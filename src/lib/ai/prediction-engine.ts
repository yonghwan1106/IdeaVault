/**
 * AI Prediction Engine for IdeaVault
 * Handles success prediction, market analysis, and matching algorithms
 */

import { createClient } from '@supabase/supabase-js';
import { nlpEngine, NLPAnalysisResult } from './nlp-engine';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface SuccessPrediction {
  predictionScore: number; // 0-100
  marketTimingScore: number;
  technicalFeasibilityScore: number;
  developerMatchScore: number;
  fundingProbabilityScore: number;
  confidenceInterval: number;
  factors: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    risks: string[];
  };
  recommendation: string;
}

export interface DeveloperProfile {
  userId: string;
  githubUsername?: string;
  skillScores: Record<string, number>;
  projectCompletionRate: number;
  averageProjectDuration: number;
  preferredTechStack: string[];
  successRate: number;
  specializationAreas: string[];
}

export interface MarketAnalysis {
  keyword: string;
  searchVolume: number;
  trendDirection: 'rising' | 'falling' | 'stable';
  marketSizeEstimate: number;
  competitionLevel: 'low' | 'medium' | 'high';
  revenuePotential: 'low' | 'medium' | 'high';
  confidenceScore: number;
}

export interface IdeaMetrics {
  id: string;
  title: string;
  description: string;
  category: string;
  techStack: string[];
  implementationDifficulty: number;
  targetAudience: string;
  revenueModel: string;
}

export class PredictionEngine {
  private static instance: PredictionEngine;

  public static getInstance(): PredictionEngine {
    if (!PredictionEngine.instance) {
      PredictionEngine.instance = new PredictionEngine();
    }
    return PredictionEngine.instance;
  }

  /**
   * Generate comprehensive success prediction for idea-developer pair
   */
  async generateSuccessPrediction(
    ideaId: string,
    developerId: string
  ): Promise<SuccessPrediction> {
    const [idea, developer, marketData] = await Promise.all([
      this.getIdeaMetrics(ideaId),
      this.getDeveloperProfile(developerId),
      this.getMarketAnalysis(ideaId)
    ]);

    if (!idea || !developer) {
      throw new Error('Idea or developer not found');
    }

    // Calculate individual scores
    const marketTimingScore = await this.calculateMarketTimingScore(idea, marketData);
    const technicalFeasibilityScore = await this.calculateTechnicalFeasibilityScore(idea);
    const developerMatchScore = await this.calculateDeveloperMatchScore(idea, developer);
    const fundingProbabilityScore = await this.calculateFundingProbability(idea, marketData);

    // Calculate weighted overall score
    const predictionScore = this.calculateWeightedScore({
      marketTiming: marketTimingScore,
      technicalFeasibility: technicalFeasibilityScore,
      developerMatch: developerMatchScore,
      fundingProbability: fundingProbabilityScore
    });

    // Generate SWOT analysis
    const factors = await this.generateSWOTAnalysis(idea, developer, marketData);

    // Generate confidence interval based on data quality
    const confidenceInterval = this.calculateConfidenceInterval(idea, developer, marketData);

    // Generate recommendation
    const recommendation = this.generateRecommendation(predictionScore, factors);

    const prediction: SuccessPrediction = {
      predictionScore,
      marketTimingScore,
      technicalFeasibilityScore,
      developerMatchScore,
      fundingProbabilityScore,
      confidenceInterval,
      factors,
      recommendation
    };

    // Save prediction to database
    await this.savePrediction(ideaId, developerId, prediction);

    return prediction;
  }

  /**
   * Calculate market timing score based on trends and competition
   */
  private async calculateMarketTimingScore(
    idea: IdeaMetrics,
    marketData?: MarketAnalysis[]
  ): Promise<number> {
    let score = 50; // Base score

    if (!marketData || marketData.length === 0) {
      return score;
    }

    // Analyze trend direction
    const trendScores = marketData.map(data => {
      switch (data.trendDirection) {
        case 'rising': return 20;
        case 'stable': return 10;
        case 'falling': return -10;
        default: return 0;
      }
    });
    const avgTrendScore = trendScores.length > 0 ? trendScores.reduce((a: number, b: number) => a + b, 0) / trendScores.length : 0;
    score += avgTrendScore;

    // Analyze competition level
    const competitionPenalty = marketData.reduce((penalty, data) => {
      switch (data.competitionLevel) {
        case 'low': return penalty - 5; // Low competition is good
        case 'medium': return penalty;
        case 'high': return penalty + 10; // High competition is bad
        default: return penalty;
      }
    }, 0);
    score -= competitionPenalty;

    // Market size bonus
    const hasLargeMarket = marketData.some(data => data.marketSizeEstimate > 1000000);
    if (hasLargeMarket) score += 15;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate technical feasibility based on complexity and tech stack
   */
  private async calculateTechnicalFeasibilityScore(idea: IdeaMetrics): Promise<number> {
    let score = 80; // Start with high feasibility

    // Penalize based on implementation difficulty
    const difficultyPenalty = (idea.implementationDifficulty - 1) * 10; // 0-40 penalty
    score -= difficultyPenalty;

    // Analyze tech stack complexity
    const complexTechnologies = [
      'blockchain', 'machine learning', 'ai', 'quantum', 'ar', 'vr',
      'kubernetes', 'microservices', 'distributed systems'
    ];

    const complexTechCount = idea.techStack.filter(tech =>
      complexTechnologies.some(complex => tech.toLowerCase().includes(complex))
    ).length;

    score -= complexTechCount * 8; // Penalty for each complex technology

    // Bonus for common, well-supported technologies
    const matureTechnologies = ['react', 'nextjs', 'node', 'python', 'javascript', 'typescript'];
    const matureTechCount = idea.techStack.filter(tech =>
      matureTechnologies.some(mature => tech.toLowerCase().includes(mature))
    ).length;

    score += matureTechCount * 3;

    return Math.max(20, Math.min(100, score));
  }

  /**
   * Calculate how well developer matches the idea requirements
   */
  private async calculateDeveloperMatchScore(
    idea: IdeaMetrics,
    developer: DeveloperProfile
  ): Promise<number> {
    let score = 0;

    // Tech stack alignment
    const techAlignment = this.calculateTechStackAlignment(idea.techStack, developer);
    score += techAlignment * 0.4;

    // Experience and success rate
    score += developer.successRate * 0.3;

    // Project completion rate
    score += developer.projectCompletionRate * 0.2;

    // Specialization match
    const specializationMatch = this.calculateSpecializationMatch(idea, developer);
    score += specializationMatch * 0.1;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate tech stack alignment between idea and developer
   */
  private calculateTechStackAlignment(
    ideaTechStack: string[],
    developer: DeveloperProfile
  ): number {
    if (ideaTechStack.length === 0 || Object.keys(developer.skillScores).length === 0) {
      return 50; // Default score when no data
    }

    let totalAlignment = 0;
    let matchedTechnologies = 0;

    ideaTechStack.forEach(tech => {
      const normalizedTech = tech.toLowerCase();
      
      // Check for exact match
      if (developer.skillScores[normalizedTech]) {
        totalAlignment += developer.skillScores[normalizedTech];
        matchedTechnologies++;
      } else {
        // Check for partial matches (e.g., 'react' matches 'reactjs')
        const partialMatch = Object.keys(developer.skillScores).find(skill =>
          skill.includes(normalizedTech) || normalizedTech.includes(skill)
        );
        
        if (partialMatch) {
          totalAlignment += developer.skillScores[partialMatch] * 0.8; // Partial match penalty
          matchedTechnologies++;
        }
      }
    });

    // Calculate percentage alignment
    const alignmentPercentage = matchedTechnologies / ideaTechStack.length;
    const averageSkillLevel = matchedTechnologies > 0 ? totalAlignment / matchedTechnologies : 0;

    return (alignmentPercentage * 70) + (averageSkillLevel * 0.3);
  }

  /**
   * Calculate specialization match
   */
  private calculateSpecializationMatch(
    idea: IdeaMetrics,
    developer: DeveloperProfile
  ): number {
    const ideaCategory = idea.category.toLowerCase();
    const matchingSpecializations = developer.specializationAreas.filter(area =>
      area.toLowerCase().includes(ideaCategory) || ideaCategory.includes(area.toLowerCase())
    );

    return (matchingSpecializations.length / Math.max(1, developer.specializationAreas.length)) * 100;
  }

  /**
   * Calculate funding probability based on market and idea characteristics
   */
  private async calculateFundingProbability(
    idea: IdeaMetrics,
    marketData?: MarketAnalysis[]
  ): Promise<number> {
    let score = 40; // Base funding probability

    // High-potential categories get bonus
    const highPotentialCategories = [
      'ai', 'fintech', 'healthtech', 'cleantech', 'edtech',
      'automation', 'blockchain', 'cybersecurity'
    ];

    if (highPotentialCategories.some(cat => idea.category.toLowerCase().includes(cat))) {
      score += 25;
    }

    // Revenue model analysis
    const strongRevenueModels = ['subscription', 'saas', 'marketplace', 'freemium'];
    if (strongRevenueModels.some(model => idea.revenueModel.toLowerCase().includes(model))) {
      score += 15;
    }

    // Market potential from market data
    if (marketData && marketData.length > 0) {
      const highRevenuePotential = marketData.some(data => data.revenuePotential === 'high');
      if (highRevenuePotential) score += 20;
    }

    return Math.max(10, Math.min(100, score));
  }

  /**
   * Calculate weighted overall prediction score
   */
  private calculateWeightedScore(scores: {
    marketTiming: number;
    technicalFeasibility: number;
    developerMatch: number;
    fundingProbability: number;
  }): number {
    const weights = {
      marketTiming: 0.25,
      technicalFeasibility: 0.25,
      developerMatch: 0.3,
      fundingProbability: 0.2
    };

    return (
      scores.marketTiming * weights.marketTiming +
      scores.technicalFeasibility * weights.technicalFeasibility +
      scores.developerMatch * weights.developerMatch +
      scores.fundingProbability * weights.fundingProbability
    );
  }

  /**
   * Generate SWOT analysis
   */
  private async generateSWOTAnalysis(
    idea: IdeaMetrics,
    developer: DeveloperProfile,
    marketData?: MarketAnalysis[]
  ): Promise<{
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    risks: string[];
  }> {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const opportunities: string[] = [];
    const risks: string[] = [];

    // Analyze strengths
    if (developer.successRate > 80) {
      strengths.push('Proven track record of successful project completion');
    }
    if (idea.implementationDifficulty <= 2) {
      strengths.push('Low technical complexity enables rapid development');
    }

    // Analyze weaknesses
    if (developer.successRate < 50) {
      weaknesses.push('Limited history of successful project delivery');
    }
    if (idea.implementationDifficulty >= 4) {
      weaknesses.push('High technical complexity may lead to delays');
    }

    // Analyze opportunities
    if (marketData?.some(data => data.trendDirection === 'rising')) {
      opportunities.push('Growing market trend provides expansion potential');
    }
    if (marketData?.some(data => data.competitionLevel === 'low')) {
      opportunities.push('Low competition allows for market leadership');
    }

    // Analyze risks
    if (marketData?.some(data => data.competitionLevel === 'high')) {
      risks.push('High market competition may limit growth');
    }
    if (idea.techStack.some(tech => ['blockchain', 'quantum'].includes(tech.toLowerCase()))) {
      risks.push('Cutting-edge technology may face adoption challenges');
    }

    return { strengths, weaknesses, opportunities, risks };
  }

  /**
   * Calculate confidence interval based on data quality
   */
  private calculateConfidenceInterval(
    idea: IdeaMetrics,
    developer: DeveloperProfile,
    marketData?: MarketAnalysis[]
  ): number {
    let confidence = 100;

    // Reduce confidence based on missing data
    if (!developer.githubUsername) confidence -= 10;
    if (Object.keys(developer.skillScores).length < 3) confidence -= 15;
    if (!marketData || marketData.length === 0) confidence -= 20;
    if (idea.techStack.length === 0) confidence -= 10;

    // Reduce confidence for newer developers
    if (developer.projectCompletionRate === 0) confidence -= 15;

    return Math.max(50, confidence);
  }

  /**
   * Generate recommendation based on prediction score and factors
   */
  private generateRecommendation(
    score: number,
    factors: { strengths: string[]; weaknesses: string[]; risks: string[] }
  ): string {
    if (score >= 80) {
      return 'Highly recommended: Strong potential for success with favorable market conditions and good developer match.';
    } else if (score >= 65) {
      return 'Recommended: Good potential for success, consider addressing identified weaknesses.';
    } else if (score >= 50) {
      return 'Proceed with caution: Moderate potential, significant risks need mitigation.';
    } else {
      return 'Not recommended: High risk of failure, consider alternative ideas or different developer match.';
    }
  }

  /**
   * Get idea metrics from database
   */
  private async getIdeaMetrics(ideaId: string): Promise<IdeaMetrics | null> {
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('id', ideaId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      category: data.category,
      techStack: data.tech_stack || [],
      implementationDifficulty: data.implementation_difficulty || 3,
      targetAudience: data.target_audience || '',
      revenueModel: data.revenue_model || ''
    };
  }

  /**
   * Get developer profile from database
   */
  private async getDeveloperProfile(userId: string): Promise<DeveloperProfile | null> {
    const { data, error } = await supabase
      .from('developer_analytics')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      // Create default profile for new developers
      return {
        userId,
        skillScores: {},
        projectCompletionRate: 0,
        averageProjectDuration: 90,
        preferredTechStack: [],
        successRate: 0,
        specializationAreas: []
      };
    }

    return {
      userId: data.user_id,
      githubUsername: data.github_username,
      skillScores: data.skill_scores || {},
      projectCompletionRate: data.project_completion_rate || 0,
      averageProjectDuration: data.average_project_duration || 90,
      preferredTechStack: data.preferred_tech_stack || [],
      successRate: data.success_rate || 0,
      specializationAreas: data.specialization_areas || []
    };
  }

  /**
   * Get market analysis data
   */
  private async getMarketAnalysis(ideaId: string): Promise<MarketAnalysis[] | undefined> {
    // Get idea keywords for market analysis
    const idea = await this.getIdeaMetrics(ideaId);
    if (!idea) return undefined;

    // Analyze idea text to extract keywords
    const nlpResult = await nlpEngine.analyzeIdea(idea.description, idea.title);
    const keywords = nlpResult.keywords.slice(0, 3); // Top 3 keywords

    if (keywords.length === 0) return undefined;

    const { data, error } = await supabase
      .from('market_analytics')
      .select('*')
      .in('keyword', keywords)
      .order('analysis_date', { ascending: false })
      .limit(10);

    if (error || !data) return undefined;

    return data.map(row => ({
      keyword: row.keyword,
      searchVolume: row.search_volume,
      trendDirection: row.trend_direction,
      marketSizeEstimate: row.market_size_estimate,
      competitionLevel: row.competition_level,
      revenuePotential: row.revenue_potential,
      confidenceScore: row.confidence_score
    }));
  }

  /**
   * Save prediction to database
   */
  private async savePrediction(
    ideaId: string,
    buyerId: string,
    prediction: SuccessPrediction
  ): Promise<void> {
    try {
      const { error } = await supabase.from('success_predictions').insert({
        idea_id: ideaId,
        buyer_id: buyerId,
        prediction_score: prediction.predictionScore,
        market_timing_score: prediction.marketTimingScore,
        technical_feasibility_score: prediction.technicalFeasibilityScore,
        developer_match_score: prediction.developerMatchScore,
        funding_probability_score: prediction.fundingProbabilityScore,
        confidence_interval: prediction.confidenceInterval,
        prediction_factors: {
          strengths: prediction.factors.strengths,
          weaknesses: prediction.factors.weaknesses,
          opportunities: prediction.factors.opportunities,
          risks: prediction.factors.risks,
          recommendation: prediction.recommendation
        }
      });

      if (error) {
        console.error('Failed to save prediction:', error);
      }
    } catch (error) {
      console.error('Error saving prediction:', error);
    }
  }

  /**
   * Get historical predictions for analysis
   */
  async getHistoricalPredictions(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('success_predictions')
      .select(`
        *,
        ideas:idea_id (title, category),
        transactions:transaction_id (status)
      `)
      .eq('buyer_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to get historical predictions:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Update developer analytics based on project outcomes
   */
  async updateDeveloperAnalytics(
    userId: string,
    projectOutcome: {
      completed: boolean;
      durationDays: number;
      techStack: string[];
      successRating?: number;
    }
  ): Promise<void> {
    try {
      // Get current analytics
      const currentProfile = await this.getDeveloperProfile(userId);
      if (!currentProfile) return;

      // Update metrics
      const completionRate = projectOutcome.completed ? 
        (currentProfile.projectCompletionRate + 1) / 2 : // Simple moving average
        currentProfile.projectCompletionRate * 0.9;

      const avgDuration = currentProfile.averageProjectDuration > 0 ?
        (currentProfile.averageProjectDuration + projectOutcome.durationDays) / 2 :
        projectOutcome.durationDays;

      const successRate = projectOutcome.successRating ?
        (currentProfile.successRate + projectOutcome.successRating) / 2 :
        currentProfile.successRate;

      // Update skill scores based on tech stack used
      const updatedSkillScores = { ...currentProfile.skillScores };
      projectOutcome.techStack.forEach(tech => {
        const normalizedTech = tech.toLowerCase();
        const currentScore = updatedSkillScores[normalizedTech] || 50;
        const improvement = projectOutcome.completed ? 5 : -2;
        updatedSkillScores[normalizedTech] = Math.max(0, Math.min(100, currentScore + improvement));
      });

      // Update database
      await supabase.from('developer_analytics').upsert({
        user_id: userId,
        skill_scores: updatedSkillScores,
        project_completion_rate: completionRate,
        average_project_duration: avgDuration,
        preferred_tech_stack: projectOutcome.techStack,
        success_rate: successRate,
        last_updated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to update developer analytics:', error);
    }
  }
}

export const predictionEngine = PredictionEngine.getInstance();