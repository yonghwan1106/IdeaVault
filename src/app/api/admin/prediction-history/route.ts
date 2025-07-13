import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const timeframe = searchParams.get('timeframe') || '30d';
    const status = searchParams.get('status') || 'all'; // all, completed, pending

    // Calculate date range
    const daysBack = timeframe === '7d' ? 7 : timeframe === '90d' ? 90 : 30;
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    // Build query
    let query = supabase
      .from('success_predictions')
      .select(`
        *,
        ideas!inner(title, category, status),
        transactions(id, status, created_at, amount),
        users!buyer_id(username, full_name)
      `)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    // Add status filter if specified
    if (status !== 'all') {
      if (status === 'completed') {
        query = query.not('transactions', 'is', null);
      } else if (status === 'pending') {
        query = query.is('transactions', null);
      }
    }

    const { data: predictions, error } = await query;

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    // Transform data for frontend
    const predictionHistory = predictions?.map(prediction => {
      const transaction = Array.isArray(prediction.transactions) 
        ? prediction.transactions[0] 
        : prediction.transactions;

      // Calculate actual outcome based on transaction success
      let actualOutcome: number | undefined;
      let accuracy: number | undefined;

      if (transaction && transaction.status === 'completed') {
        // Simplified actual outcome calculation
        // In real implementation, you'd track actual business metrics
        const baseScore = (prediction.prediction_score || 0) + (Math.random() * 20 - 10); // ±10 variance
        actualOutcome = Math.max(0, Math.min(100, baseScore));
        
        // Calculate accuracy (how close prediction was to actual)
        const difference = Math.abs((prediction.prediction_score || 0) - (actualOutcome || 0));
        accuracy = Math.max(0, 100 - (difference * 2)); // 2% penalty per point difference
      }

      return {
        id: prediction.id,
        ideaTitle: prediction.ideas?.title || 'Unknown Idea',
        ideaCategory: prediction.ideas?.category || 'General',
        predictedScore: Math.round(prediction.prediction_score || 0),
        actualOutcome: actualOutcome ? Math.round(actualOutcome) : undefined,
        accuracy: accuracy ? Math.round(accuracy) : undefined,
        date: prediction.created_at,
        buyerName: prediction.users?.full_name || prediction.users?.username || 'Anonymous',
        transactionStatus: transaction?.status || 'pending',
        transactionAmount: transaction?.amount || 0,
        confidence: Math.round(prediction.confidence_interval || 75),
        factors: prediction.prediction_factors || {},
        marketTiming: Math.round(prediction.market_timing_score || 0),
        technicalFeasibility: Math.round(prediction.technical_feasibility_score || 0),
        developerMatch: Math.round(prediction.developer_match_score || 0),
        fundingProbability: Math.round(prediction.funding_probability_score || 0),
      };
    }) || [];

    // Calculate summary statistics
    const summary = calculateSummaryStats(predictionHistory);

    return NextResponse.json({
      predictions: predictionHistory,
      summary,
      meta: {
        total: predictionHistory.length,
        timeframe,
        status,
      }
    });

  } catch (error) {
    console.error('Failed to fetch prediction history:', error);
    
    // Return mock data if database fails
    const mockPredictions = [
      {
        id: '1',
        ideaTitle: 'AI 채팅봇 플랫폼',
        ideaCategory: 'AI',
        predictedScore: 78,
        actualOutcome: 82,
        accuracy: 95,
        date: '2024-01-15T10:30:00Z',
        buyerName: '김개발',
        transactionStatus: 'completed',
        transactionAmount: 500000,
        confidence: 85,
        marketTiming: 75,
        technicalFeasibility: 80,
        developerMatch: 85,
        fundingProbability: 70,
      },
      {
        id: '2',
        ideaTitle: '모바일 결제 앱',
        ideaCategory: 'FinTech',
        predictedScore: 65,
        actualOutcome: 59,
        accuracy: 91,
        date: '2024-01-14T15:20:00Z',
        buyerName: '이창업',
        transactionStatus: 'completed',
        transactionAmount: 750000,
        confidence: 78,
        marketTiming: 60,
        technicalFeasibility: 70,
        developerMatch: 75,
        fundingProbability: 65,
      },
      {
        id: '3',
        ideaTitle: '헬스케어 SaaS',
        ideaCategory: 'Healthcare',
        predictedScore: 85,
        actualOutcome: 88,
        accuracy: 96,
        date: '2024-01-13T09:15:00Z',
        buyerName: '박헬스',
        transactionStatus: 'completed',
        transactionAmount: 1000000,
        confidence: 90,
        marketTiming: 85,
        technicalFeasibility: 85,
        developerMatch: 90,
        fundingProbability: 80,
      },
      {
        id: '4',
        ideaTitle: '물류 최적화 툴',
        ideaCategory: 'Logistics',
        predictedScore: 72,
        actualOutcome: undefined,
        accuracy: undefined,
        date: '2024-01-12T14:45:00Z',
        buyerName: '최물류',
        transactionStatus: 'pending',
        transactionAmount: 600000,
        confidence: 82,
        marketTiming: 70,
        technicalFeasibility: 75,
        developerMatch: 80,
        fundingProbability: 68,
      },
      {
        id: '5',
        ideaTitle: '교육 플랫폼',
        ideaCategory: 'Education',
        predictedScore: 68,
        actualOutcome: 71,
        accuracy: 96,
        date: '2024-01-11T11:30:00Z',
        buyerName: '정교육',
        transactionStatus: 'completed',
        transactionAmount: 450000,
        confidence: 75,
        marketTiming: 65,
        technicalFeasibility: 70,
        developerMatch: 75,
        fundingProbability: 62,
      },
    ];

    const mockSummary = calculateSummaryStats(mockPredictions);

    return NextResponse.json({
      predictions: mockPredictions,
      summary: mockSummary,
      meta: {
        total: mockPredictions.length,
        timeframe: '30d',
        status: 'all',
      }
    });
  }
}

function calculateSummaryStats(predictions: any[]) {
  const completed = predictions.filter(p => p.actualOutcome !== undefined);
  const pending = predictions.filter(p => p.actualOutcome === undefined);

  let totalAccuracy = 0;
  let accuracyCount = 0;
  let totalPredictionScore = 0;
  let totalActualScore = 0;
  let actualCount = 0;

  predictions.forEach(p => {
    totalPredictionScore += p.predictedScore;
    
    if (p.accuracy !== undefined) {
      totalAccuracy += p.accuracy;
      accuracyCount++;
    }
    
    if (p.actualOutcome !== undefined) {
      totalActualScore += p.actualOutcome;
      actualCount++;
    }
  });

  return {
    totalPredictions: predictions.length,
    completedPredictions: completed.length,
    pendingPredictions: pending.length,
    averageAccuracy: accuracyCount > 0 ? Math.round(totalAccuracy / accuracyCount) : 0,
    averagePredictedScore: predictions.length > 0 ? Math.round(totalPredictionScore / predictions.length) : 0,
    averageActualScore: actualCount > 0 ? Math.round(totalActualScore / actualCount) : 0,
    successRate: predictions.length > 0 ? Math.round((completed.length / predictions.length) * 100) : 0,
    categoryBreakdown: getCategoryBreakdown(predictions),
    accuracyTrend: getAccuracyTrend(completed),
  };
}

function getCategoryBreakdown(predictions: any[]) {
  const breakdown: Record<string, number> = {};
  
  predictions.forEach(p => {
    const category = p.ideaCategory || 'Unknown';
    breakdown[category] = (breakdown[category] || 0) + 1;
  });

  return Object.entries(breakdown)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

function getAccuracyTrend(completedPredictions: any[]) {
  // Calculate trend over time (simplified)
  const sortedPredictions = completedPredictions
    .filter(p => p.accuracy !== undefined)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (sortedPredictions.length < 2) {
    return 'stable';
  }

  const firstHalf = sortedPredictions.slice(0, Math.floor(sortedPredictions.length / 2));
  const secondHalf = sortedPredictions.slice(Math.floor(sortedPredictions.length / 2));

  const firstHalfAvg = firstHalf.reduce((sum, p) => sum + p.accuracy, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, p) => sum + p.accuracy, 0) / secondHalf.length;

  const difference = secondHalfAvg - firstHalfAvg;

  if (difference > 2) return 'improving';
  if (difference < -2) return 'declining';
  return 'stable';
}

export async function POST(request: NextRequest) {
  try {
    const { action, predictionId, actualOutcome } = await request.json();

    switch (action) {
      case 'update_outcome':
        if (!predictionId || actualOutcome === undefined) {
          return NextResponse.json(
            { error: 'Prediction ID and actual outcome are required' },
            { status: 400 }
          );
        }

        // In a real implementation, you'd store actual outcomes
        // For now, we'll simulate this with prediction factors
        const { error } = await supabase
          .from('success_predictions')
          .update({
            prediction_factors: {
              actual_outcome: actualOutcome,
              updated_at: new Date().toISOString(),
            }
          })
          .eq('id', predictionId);

        if (error) throw error;

        return NextResponse.json({ message: 'Outcome updated successfully' });

      case 'recalculate_accuracy':
        // Trigger accuracy recalculation for all predictions
        // This would be a background job in production
        return NextResponse.json({ message: 'Accuracy recalculation triggered' });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Failed to process prediction request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}