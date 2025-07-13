import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { predictionEngine } from '@/lib/ai/prediction-engine';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { ideaId, developerId, options } = await request.json();

    // Validate required fields
    if (!ideaId || !developerId) {
      return NextResponse.json(
        { error: 'Missing required fields: ideaId, developerId' },
        { status: 400 }
      );
    }

    // Check if idea exists and is accessible
    const { data: idea, error: ideaError } = await supabase
      .from('ideas')
      .select('*')
      .eq('id', ideaId)
      .single();

    if (ideaError || !idea) {
      return NextResponse.json(
        { error: 'Idea not found or access denied' },
        { status: 404 }
      );
    }

    // Check if prediction already exists
    const { data: existingPrediction, error: predictionError } = await supabase
      .from('success_predictions')
      .select('*')
      .eq('idea_id', ideaId)
      .eq('buyer_id', developerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // If prediction exists and is recent (less than 24 hours), return cached result
    if (!predictionError && existingPrediction) {
      const predictionAge = Date.now() - new Date(existingPrediction.created_at).getTime();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (predictionAge < maxAge && !options?.forceRefresh) {
        const cachedPrediction = {
          predictionScore: existingPrediction.prediction_score,
          marketTimingScore: existingPrediction.market_timing_score,
          technicalFeasibilityScore: existingPrediction.technical_feasibility_score,
          developerMatchScore: existingPrediction.developer_match_score,
          fundingProbabilityScore: existingPrediction.funding_probability_score,
          confidenceInterval: existingPrediction.confidence_interval,
          factors: existingPrediction.prediction_factors,
          recommendation: existingPrediction.prediction_factors?.recommendation || 'Analysis completed',
          cached: true,
          generatedAt: existingPrediction.created_at
        };

        return NextResponse.json({
          message: 'Success prediction retrieved from cache',
          prediction: cachedPrediction
        });
      }
    }

    // Generate new prediction
    const prediction = await predictionEngine.generateSuccessPrediction(ideaId, developerId);

    return NextResponse.json({
      message: 'Success prediction generated successfully',
      prediction: {
        ...prediction,
        cached: false,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Success prediction failed:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Prediction failed: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error during prediction' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ideaId = searchParams.get('ideaId');
    const developerId = searchParams.get('developerId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!developerId) {
      return NextResponse.json(
        { error: 'Missing required parameter: developerId' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('success_predictions')
      .select(`
        *,
        ideas!inner(title, category, price),
        transactions(status, created_at)
      `)
      .eq('buyer_id', developerId)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter by specific idea if requested
    if (ideaId) {
      query = query.eq('idea_id', ideaId);
    }

    const { data: predictions, error } = await query;

    if (error) {
      throw error;
    }

    // Transform data for response
    const formattedPredictions = predictions?.map(prediction => ({
      id: prediction.id,
      ideaId: prediction.idea_id,
      ideaTitle: prediction.ideas?.title,
      ideaCategory: prediction.ideas?.category,
      ideaPrice: prediction.ideas?.price,
      predictionScore: prediction.prediction_score,
      marketTimingScore: prediction.market_timing_score,
      technicalFeasibilityScore: prediction.technical_feasibility_score,
      developerMatchScore: prediction.developer_match_score,
      fundingProbabilityScore: prediction.funding_probability_score,
      confidenceInterval: prediction.confidence_interval,
      factors: prediction.prediction_factors,
      transactionStatus: prediction.transactions?.status,
      createdAt: prediction.created_at,
      modelVersion: prediction.model_version
    })) || [];

    return NextResponse.json({
      predictions: formattedPredictions,
      meta: {
        total: formattedPredictions.length,
        developerId,
        ideaId: ideaId || null
      }
    });

  } catch (error) {
    console.error('Failed to retrieve predictions:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve predictions' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { predictionId, feedback, actualOutcome } = await request.json();

    if (!predictionId) {
      return NextResponse.json(
        { error: 'Missing required field: predictionId' },
        { status: 400 }
      );
    }

    // Update prediction with feedback
    const updateData: any = {};

    if (feedback) {
      updateData.prediction_factors = {
        ...updateData.prediction_factors,
        user_feedback: feedback,
        feedback_timestamp: new Date().toISOString()
      };
    }

    if (actualOutcome !== undefined) {
      updateData.prediction_factors = {
        ...updateData.prediction_factors,
        actual_outcome: actualOutcome,
        outcome_timestamp: new Date().toISOString()
      };
    }

    const { error } = await supabase
      .from('success_predictions')
      .update(updateData)
      .eq('id', predictionId);

    if (error) {
      throw error;
    }

    // If actual outcome is provided, update developer analytics
    if (actualOutcome !== undefined) {
      const { data: prediction } = await supabase
        .from('success_predictions')
        .select('buyer_id, idea_id, ideas(tech_stack)')
        .eq('id', predictionId)
        .single();

      if (prediction) {
        await predictionEngine.updateDeveloperAnalytics(
          prediction.buyer_id,
          {
            completed: actualOutcome > 50, // Consider >50 as successful
            durationDays: 90, // Default duration
            techStack: (prediction.ideas as any)?.tech_stack || [],
            successRating: actualOutcome
          }
        );
      }
    }

    return NextResponse.json({
      message: 'Prediction updated successfully'
    });

  } catch (error) {
    console.error('Failed to update prediction:', error);
    return NextResponse.json(
      { error: 'Failed to update prediction' },
      { status: 500 }
    );
  }
}