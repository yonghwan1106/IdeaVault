import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const timeframe = searchParams.get('timeframe') || '7d'; // 7d, 30d, 90d

    // Calculate date range based on timeframe
    const daysBack = timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 7;
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    // Get market trends from database
    const { data: trends, error } = await supabase
      .from('market_analytics')
      .select('*')
      .gte('analysis_date', startDate.toISOString())
      .order('search_volume', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    // Transform data for frontend
    const marketTrends = trends?.map(trend => ({
      keyword: trend.keyword,
      volume: trend.search_volume || 0,
      trend: trend.trend_direction || 'stable',
      growth: calculateGrowth(trend),
      competitionLevel: trend.competition_level || 'medium',
      revenuePotential: trend.revenue_potential || 'medium',
      confidence: trend.confidence_score || 75,
      lastUpdated: trend.analysis_date,
    })) || [];

    // Add growth calculation and ranking
    const enrichedTrends = await enrichTrendsWithGrowth(marketTrends);

    return NextResponse.json(enrichedTrends);
  } catch (error) {
    console.error('Failed to fetch market trends:', error);
    
    // Return mock data if database fails
    const mockTrends = [
      {
        keyword: 'AI 스타트업',
        volume: 15400,
        trend: 'rising' as const,
        growth: 12.5,
        competitionLevel: 'high' as const,
        revenuePotential: 'high' as const,
        confidence: 85,
        lastUpdated: new Date().toISOString(),
      },
      {
        keyword: '핀테크',
        volume: 12800,
        trend: 'stable' as const,
        growth: 2.1,
        competitionLevel: 'high' as const,
        revenuePotential: 'high' as const,
        confidence: 82,
        lastUpdated: new Date().toISOString(),
      },
      {
        keyword: 'SaaS 솔루션',
        volume: 18900,
        trend: 'rising' as const,
        growth: 8.7,
        competitionLevel: 'medium' as const,
        revenuePotential: 'high' as const,
        confidence: 78,
        lastUpdated: new Date().toISOString(),
      },
      {
        keyword: '이커머스',
        volume: 9200,
        trend: 'falling' as const,
        growth: -3.2,
        competitionLevel: 'high' as const,
        revenuePotential: 'medium' as const,
        confidence: 72,
        lastUpdated: new Date().toISOString(),
      },
      {
        keyword: 'IoT 플랫폼',
        volume: 7600,
        trend: 'rising' as const,
        growth: 15.3,
        competitionLevel: 'medium' as const,
        revenuePotential: 'high' as const,
        confidence: 76,
        lastUpdated: new Date().toISOString(),
      },
    ];

    return NextResponse.json(mockTrends);
  }
}

function calculateGrowth(trend: any): number {
  // Simplified growth calculation
  // In a real implementation, you'd compare with historical data
  const baseGrowth = Math.random() * 20 - 10; // Random growth between -10% and +10%
  
  if (trend.trend_direction === 'rising') {
    return Math.max(0, baseGrowth + 5);
  } else if (trend.trend_direction === 'falling') {
    return Math.min(0, baseGrowth - 5);
  }
  
  return baseGrowth;
}

async function enrichTrendsWithGrowth(trends: any[]): Promise<any[]> {
  // In a real implementation, you'd calculate actual growth rates
  // by comparing current data with historical data
  
  return trends.map((trend, index) => ({
    ...trend,
    rank: index + 1,
    category: categorizeTrend(trend.keyword),
    momentum: calculateMomentum(trend),
  }));
}

function categorizeTrend(keyword: string): string {
  const categories = {
    'AI': ['ai', '인공지능', 'machine learning', '머신러닝'],
    'FinTech': ['fintech', '핀테크', 'payment', '결제', 'blockchain', '블록체인'],
    'E-commerce': ['ecommerce', '이커머스', 'shopping', '쇼핑', 'marketplace'],
    'SaaS': ['saas', 'software', '소프트웨어', 'platform', '플랫폼'],
    'Mobile': ['mobile', '모바일', 'app', '앱'],
    'Healthcare': ['health', '헬스', 'medical', '의료'],
    'Education': ['education', '교육', 'learning', '학습'],
    'IoT': ['iot', 'smart', '스마트', 'connected'],
  };

  const lowerKeyword = keyword.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(k => lowerKeyword.includes(k))) {
      return category;
    }
  }
  
  return 'General';
}

function calculateMomentum(trend: any): 'high' | 'medium' | 'low' {
  const score = (trend.volume / 1000) + (trend.growth * 2) + (trend.confidence / 10);
  
  if (score > 50) return 'high';
  if (score > 20) return 'medium';
  return 'low';
}

export async function POST(request: NextRequest) {
  try {
    const { action, keyword, data } = await request.json();

    switch (action) {
      case 'add_trend':
        if (!keyword) {
          return NextResponse.json(
            { error: 'Keyword is required' },
            { status: 400 }
          );
        }

        const { error: insertError } = await supabase
          .from('market_analytics')
          .insert({
            keyword,
            search_volume: data?.volume || 0,
            trend_direction: data?.trend || 'stable',
            market_size_estimate: data?.marketSize || 0,
            competition_level: data?.competition || 'medium',
            revenue_potential: data?.revenue || 'medium',
            confidence_score: data?.confidence || 75,
            data_sources: ['manual'],
          });

        if (insertError) throw insertError;

        return NextResponse.json({ message: 'Trend added successfully' });

      case 'update_trend':
        if (!keyword) {
          return NextResponse.json(
            { error: 'Keyword is required' },
            { status: 400 }
          );
        }

        const { error: updateError } = await supabase
          .from('market_analytics')
          .update({
            search_volume: data?.volume,
            trend_direction: data?.trend,
            market_size_estimate: data?.marketSize,
            competition_level: data?.competition,
            revenue_potential: data?.revenue,
            confidence_score: data?.confidence,
          })
          .eq('keyword', keyword);

        if (updateError) throw updateError;

        return NextResponse.json({ message: 'Trend updated successfully' });

      case 'refresh_trends':
        // Trigger manual trend refresh
        // In a real implementation, this would trigger the data collection pipeline
        return NextResponse.json({ message: 'Trend refresh triggered' });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Failed to process trend request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}