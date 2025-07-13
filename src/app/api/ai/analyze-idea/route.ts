import { NextRequest, NextResponse } from 'next/server';
import { nlpEngine, NLPAnalysisResult } from '@/lib/ai/nlp-engine';

export async function POST(request: NextRequest) {
  try {
    const { text, title, options } = await request.json();

    // Validate required fields
    if (!text) {
      return NextResponse.json(
        { error: 'Missing required field: text' },
        { status: 400 }
      );
    }

    // Check for cached analysis first (unless force refresh)
    if (!options?.forceRefresh) {
      const cachedResult = await nlpEngine.getCachedAnalysis(text);
      if (cachedResult) {
        return NextResponse.json({
          message: 'Analysis retrieved from cache',
          analysis: {
            ...cachedResult,
            cached: true
          }
        });
      }
    }

    // Perform NLP analysis
    const analysis = await nlpEngine.analyzeIdea(text, title);

    // Cache the results
    await nlpEngine.cacheAnalysis(text, analysis);

    // Classify the idea into categories
    const classification = await nlpEngine.classifyIdea(text);

    return NextResponse.json({
      message: 'Idea analysis completed successfully',
      analysis: {
        ...analysis,
        classification,
        cached: false,
        analyzedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Idea analysis failed:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Analysis failed: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error during analysis' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contentHash = searchParams.get('hash');
    const limit = parseInt(searchParams.get('limit') || '20');
    const language = searchParams.get('language') || 'all';

    if (contentHash) {
      // Get specific cached analysis by hash
      const analysis = await nlpEngine.getCachedAnalysis(contentHash);
      
      if (!analysis) {
        return NextResponse.json(
          { error: 'Cached analysis not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        analysis: {
          ...analysis,
          cached: true
        }
      });
    }

    // Get recent analysis results for analytics
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabase
      .from('nlp_analysis_cache')
      .select('*')
      .order('processed_at', { ascending: false })
      .limit(limit);

    if (language !== 'all') {
      query = query.eq('language_detected', language);
    }

    const { data: analyses, error } = await query;

    if (error) {
      throw error;
    }

    // Transform data for response
    const formattedAnalyses = analyses?.map(analysis => ({
      id: analysis.id,
      contentHash: analysis.content_hash,
      categories: analysis.categories,
      keywords: analysis.keywords,
      sentiment: analysis.sentiment_score,
      language: analysis.language_detected,
      processedAt: analysis.processed_at,
      modelVersion: analysis.model_version,
      // Don't include full text for privacy
      textPreview: analysis.original_text?.substring(0, 100) + '...'
    })) || [];

    // Calculate analytics
    const analytics = calculateAnalytics(formattedAnalyses);

    return NextResponse.json({
      analyses: formattedAnalyses,
      analytics,
      meta: {
        total: formattedAnalyses.length,
        language,
        timeframe: 'recent'
      }
    });

  } catch (error) {
    console.error('Failed to retrieve analyses:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve analyses' },
      { status: 500 }
    );
  }
}

function calculateAnalytics(analyses: any[]) {
  if (analyses.length === 0) {
    return {
      totalAnalyses: 0,
      languageBreakdown: {},
      categoryBreakdown: {},
      sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
      topKeywords: [],
      averageSentiment: 0
    };
  }

  // Language breakdown
  const languageBreakdown: Record<string, number> = {};
  analyses.forEach(analysis => {
    const lang = analysis.language || 'unknown';
    languageBreakdown[lang] = (languageBreakdown[lang] || 0) + 1;
  });

  // Category breakdown
  const categoryBreakdown: Record<string, number> = {};
  analyses.forEach(analysis => {
    analysis.categories?.forEach((category: string) => {
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
    });
  });

  // Sentiment distribution
  const sentimentDistribution = { positive: 0, neutral: 0, negative: 0 };
  let totalSentiment = 0;
  
  analyses.forEach(analysis => {
    const sentiment = analysis.sentiment || 0;
    totalSentiment += sentiment;
    
    if (sentiment > 0.1) sentimentDistribution.positive++;
    else if (sentiment < -0.1) sentimentDistribution.negative++;
    else sentimentDistribution.neutral++;
  });

  // Top keywords
  const keywordCounts: Record<string, number> = {};
  analyses.forEach(analysis => {
    analysis.keywords?.forEach((keyword: string) => {
      keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
    });
  });

  const topKeywords = Object.entries(keywordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([keyword, count]) => ({ keyword, count }));

  return {
    totalAnalyses: analyses.length,
    languageBreakdown,
    categoryBreakdown,
    sentimentDistribution,
    topKeywords,
    averageSentiment: totalSentiment / analyses.length
  };
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contentHash = searchParams.get('hash');
    const olderThan = searchParams.get('olderThan'); // ISO date string

    if (!contentHash && !olderThan) {
      return NextResponse.json(
        { error: 'Either contentHash or olderThan parameter is required' },
        { status: 400 }
      );
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (contentHash) {
      // Delete specific cached analysis
      const { error } = await supabase
        .from('nlp_analysis_cache')
        .delete()
        .eq('content_hash', contentHash);

      if (error) throw error;

      return NextResponse.json({
        message: 'Cached analysis deleted successfully'
      });
    }

    if (olderThan) {
      // Delete analyses older than specified date
      const { error } = await supabase
        .from('nlp_analysis_cache')
        .delete()
        .lt('processed_at', olderThan);

      if (error) throw error;

      return NextResponse.json({
        message: 'Old cached analyses deleted successfully'
      });
    }

  } catch (error) {
    console.error('Failed to delete cached analyses:', error);
    return NextResponse.json(
      { error: 'Failed to delete cached analyses' },
      { status: 500 }
    );
  }
}