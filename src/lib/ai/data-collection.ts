/**
 * Big Data Collection Pipeline for IdeaVault
 * Handles data collection from multiple sources for market analysis and trend prediction
 */

import axios from 'axios';
import cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import cron from 'node-cron';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface DataSource {
  id: string;
  name: string;
  type: 'api' | 'web_scraping' | 'manual' | 'file_upload';
  endpointUrl: string;
  apiKeyName?: string;
  syncFrequencyHours: number;
  isActive: boolean;
  dataSchema?: Record<string, any>;
}

export interface TrendData {
  keyword: string;
  searchVolume: number;
  trendDirection: 'rising' | 'falling' | 'stable';
  marketSize: number;
  competitionLevel: 'low' | 'medium' | 'high';
  source: string;
  timestamp: Date;
}

export interface GitHubTrendingData {
  name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  growth: number;
  url: string;
}

export class DataCollectionPipeline {
  private static instance: DataCollectionPipeline;
  private isRunning = false;
  private collectors: Map<string, DataCollector> = new Map();

  public static getInstance(): DataCollectionPipeline {
    if (!DataCollectionPipeline.instance) {
      DataCollectionPipeline.instance = new DataCollectionPipeline();
    }
    return DataCollectionPipeline.instance;
  }

  constructor() {
    this.initializeCollectors();
  }

  /**
   * Initialize all data collectors
   */
  private initializeCollectors(): void {
    this.collectors.set('github-trending', new GitHubTrendingCollector());
    this.collectors.set('product-hunt', new ProductHuntCollector());
    this.collectors.set('reddit-tech', new RedditTechCollector());
    this.collectors.set('naver-trends', new NaverTrendsCollector());
    this.collectors.set('google-trends', new GoogleTrendsCollector());
    this.collectors.set('hackernews', new HackerNewsCollector());
  }

  /**
   * Start the data collection pipeline
   */
  public startPipeline(): void {
    if (this.isRunning) {
      console.log('Data collection pipeline is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting data collection pipeline...');

    // Schedule different collectors at different intervals
    this.scheduleCollections();
  }

  /**
   * Stop the data collection pipeline
   */
  public stopPipeline(): void {
    this.isRunning = false;
    console.log('Data collection pipeline stopped');
  }

  /**
   * Schedule data collections
   */
  private scheduleCollections(): void {
    // GitHub Trending - every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      if (this.isRunning) {
        await this.runCollector('github-trending');
      }
    });

    // Product Hunt - every 12 hours
    cron.schedule('0 */12 * * *', async () => {
      if (this.isRunning) {
        await this.runCollector('product-hunt');
      }
    });

    // Reddit Tech - every 4 hours
    cron.schedule('0 */4 * * *', async () => {
      if (this.isRunning) {
        await this.runCollector('reddit-tech');
      }
    });

    // Naver Trends - daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      if (this.isRunning) {
        await this.runCollector('naver-trends');
      }
    });

    // Google Trends - daily at 3 AM
    cron.schedule('0 3 * * *', async () => {
      if (this.isRunning) {
        await this.runCollector('google-trends');
      }
    });

    // HackerNews - every 2 hours
    cron.schedule('0 */2 * * *', async () => {
      if (this.isRunning) {
        await this.runCollector('hackernews');
      }
    });
  }

  /**
   * Run a specific data collector
   */
  private async runCollector(collectorName: string): Promise<void> {
    try {
      console.log(`Running collector: ${collectorName}`);
      const collector = this.collectors.get(collectorName);
      
      if (!collector) {
        console.error(`Collector not found: ${collectorName}`);
        return;
      }

      const data = await collector.collect();
      await this.processAndStore(collectorName, data);
      
      // Update last sync time
      await this.updateLastSync(collectorName);
      
      console.log(`Collector ${collectorName} completed successfully`);
    } catch (error) {
      console.error(`Error running collector ${collectorName}:`, error);
    }
  }

  /**
   * Manually trigger a collector
   */
  public async triggerCollector(collectorName: string): Promise<any[]> {
    const collector = this.collectors.get(collectorName);
    if (!collector) {
      throw new Error(`Collector not found: ${collectorName}`);
    }

    const data = await collector.collect();
    await this.processAndStore(collectorName, data);
    return data;
  }

  /**
   * Process and store collected data
   */
  private async processAndStore(source: string, data: any[]): Promise<void> {
    if (!data || data.length === 0) return;

    for (const item of data) {
      try {
        await this.storeMarketData(source, item);
      } catch (error) {
        console.error(`Error storing data from ${source}:`, error);
      }
    }
  }

  /**
   * Store market data in database
   */
  private async storeMarketData(source: string, data: any): Promise<void> {
    // Convert collected data to market analytics format
    const marketData = this.convertToMarketData(source, data);
    
    if (marketData) {
      const { error } = await supabase.from('market_analytics').upsert(marketData);
      if (error) {
        console.error('Failed to store market data:', error);
      }
    }
  }

  /**
   * Convert raw data to market analytics format
   */
  private convertToMarketData(source: string, data: any): any | null {
    try {
      switch (source) {
        case 'github-trending':
          return {
            keyword: data.name?.toLowerCase() || 'unknown',
            search_volume: data.stars || 0,
            trend_direction: data.growth > 0 ? 'rising' : 'stable',
            market_size_estimate: data.stars * 100, // Rough estimate
            competition_level: data.stars > 1000 ? 'high' : data.stars > 100 ? 'medium' : 'low',
            revenue_potential: this.assessRevenuePotential(data.description),
            data_sources: [source],
            confidence_score: 75.0
          };

        case 'product-hunt':
          return {
            keyword: data.name?.toLowerCase() || 'unknown',
            search_volume: data.votes || 0,
            trend_direction: data.featured ? 'rising' : 'stable',
            market_size_estimate: data.votes * 50,
            competition_level: 'medium',
            revenue_potential: 'medium',
            data_sources: [source],
            confidence_score: 80.0
          };

        default:
          return null;
      }
    } catch (error) {
      console.error('Error converting data:', error);
      return null;
    }
  }

  /**
   * Assess revenue potential from description
   */
  private assessRevenuePotential(description: string): 'low' | 'medium' | 'high' {
    if (!description) return 'low';
    
    const highPotential = ['saas', 'subscription', 'marketplace', 'fintech', 'enterprise'];
    const mediumPotential = ['app', 'platform', 'service', 'tool'];
    
    const desc = description.toLowerCase();
    
    if (highPotential.some(keyword => desc.includes(keyword))) return 'high';
    if (mediumPotential.some(keyword => desc.includes(keyword))) return 'medium';
    return 'low';
  }

  /**
   * Update last sync time for data source
   */
  private async updateLastSync(sourceName: string): Promise<void> {
    const { error } = await supabase
      .from('data_sources')
      .update({ last_sync: new Date().toISOString() })
      .eq('source_name', sourceName);

    if (error) {
      console.error('Failed to update last sync:', error);
    }
  }

  /**
   * Get collection statistics
   */
  public async getCollectionStats(): Promise<any> {
    const { data: sources, error } = await supabase
      .from('data_sources')
      .select('*')
      .eq('is_active', true);

    if (error) return { error };

    const { data: analytics, error: analyticsError } = await supabase
      .from('market_analytics')
      .select('data_sources, created_at')
      .gte('analysis_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    return {
      activeSources: sources?.length || 0,
      totalDataPoints: analytics?.length || 0,
      lastUpdated: sources?.[0]?.last_sync,
      collectors: Array.from(this.collectors.keys())
    };
  }
}

/**
 * Base class for all data collectors
 */
abstract class DataCollector {
  abstract collect(): Promise<any[]>;
  
  protected async makeRequest(url: string, headers?: Record<string, string>): Promise<any> {
    try {
      const response = await axios.get(url, { 
        headers: {
          'User-Agent': 'IdeaVault-DataCollector/1.0',
          ...headers
        },
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      console.error(`Request failed for ${url}:`, error);
      throw error;
    }
  }

  protected async scrapeWeb(url: string): Promise<cheerio.CheerioAPI> {
    const html = await this.makeRequest(url);
    return cheerio.load(html);
  }
}

/**
 * GitHub Trending Collector
 */
class GitHubTrendingCollector extends DataCollector {
  async collect(): Promise<GitHubTrendingData[]> {
    try {
      const url = 'https://api.github.com/search/repositories?q=created:>2024-01-01&sort=stars&order=desc&per_page=50';
      const data = await this.makeRequest(url);
      
      return data.items?.map((repo: any) => ({
        name: repo.name,
        description: repo.description || '',
        language: repo.language || 'Unknown',
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        growth: repo.stargazers_count, // Simplified growth metric
        url: repo.html_url
      })) || [];
    } catch (error) {
      console.error('GitHub trending collection failed:', error);
      return [];
    }
  }
}

/**
 * Product Hunt Collector
 */
class ProductHuntCollector extends DataCollector {
  async collect(): Promise<any[]> {
    try {
      // Note: Product Hunt API requires authentication
      // This is a simplified version for demonstration
      const mockData = [
        {
          name: 'AI Startup Tool',
          votes: 250,
          featured: true,
          category: 'productivity'
        }
      ];
      return mockData;
    } catch (error) {
      console.error('Product Hunt collection failed:', error);
      return [];
    }
  }
}

/**
 * Reddit Tech Collector
 */
class RedditTechCollector extends DataCollector {
  async collect(): Promise<any[]> {
    try {
      const url = 'https://www.reddit.com/r/technology/hot.json?limit=25';
      const data = await this.makeRequest(url);
      
      return data.data?.children?.map((post: any) => ({
        title: post.data.title,
        score: post.data.score,
        comments: post.data.num_comments,
        url: post.data.url,
        created: new Date(post.data.created_utc * 1000)
      })) || [];
    } catch (error) {
      console.error('Reddit tech collection failed:', error);
      return [];
    }
  }
}

/**
 * Naver Trends Collector (simplified)
 */
class NaverTrendsCollector extends DataCollector {
  async collect(): Promise<any[]> {
    try {
      // Note: Naver DataLab requires API key and specific implementation
      // This is a mock implementation
      const mockTrends = [
        { keyword: 'AI 스타트업', volume: 15000, trend: 'rising' },
        { keyword: '핀테크', volume: 12000, trend: 'stable' },
        { keyword: '이커머스', volume: 8500, trend: 'falling' }
      ];
      return mockTrends;
    } catch (error) {
      console.error('Naver trends collection failed:', error);
      return [];
    }
  }
}

/**
 * Google Trends Collector (simplified)
 */
class GoogleTrendsCollector extends DataCollector {
  async collect(): Promise<any[]> {
    try {
      // Note: Google Trends requires specific API implementation
      // This is a mock implementation
      const mockTrends = [
        { keyword: 'startup ideas', volume: 22000, trend: 'rising' },
        { keyword: 'SaaS business', volume: 18000, trend: 'stable' },
        { keyword: 'mobile app development', volume: 14000, trend: 'rising' }
      ];
      return mockTrends;
    } catch (error) {
      console.error('Google trends collection failed:', error);
      return [];
    }
  }
}

/**
 * HackerNews Collector
 */
class HackerNewsCollector extends DataCollector {
  async collect(): Promise<any[]> {
    try {
      const topStoriesUrl = 'https://hacker-news.firebaseio.com/v0/topstories.json';
      const topStoryIds = await this.makeRequest(topStoriesUrl);
      
      // Get top 20 stories
      const stories = await Promise.all(
        topStoryIds.slice(0, 20).map(async (id: number) => {
          try {
            const storyUrl = `https://hacker-news.firebaseio.com/v0/item/${id}.json`;
            return await this.makeRequest(storyUrl);
          } catch (error) {
            console.error(`Failed to fetch story ${id}:`, error);
            return null;
          }
        })
      );
      
      return stories.filter(story => story && story.title).map(story => ({
        title: story.title,
        score: story.score || 0,
        comments: story.descendants || 0,
        url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
        time: new Date(story.time * 1000)
      }));
    } catch (error) {
      console.error('HackerNews collection failed:', error);
      return [];
    }
  }
}

// Export singleton instance
export const dataCollectionPipeline = DataCollectionPipeline.getInstance();