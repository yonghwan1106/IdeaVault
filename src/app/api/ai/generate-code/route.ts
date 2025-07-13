import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { codeGenerator, CodeGenerationRequest } from '@/lib/ai/code-generator';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const {
      ideaId,
      buyerId,
      title,
      description,
      targetFramework = 'nextjs',
      preferredLanguage = 'typescript',
      includeDatabase = true,
      includeAuth = false,
      includePayments = false,
      deploymentTarget = 'vercel'
    } = await request.json();

    // Validate required fields
    if (!ideaId || !buyerId || !title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: ideaId, buyerId, title, description' },
        { status: 400 }
      );
    }

    // Check if user has purchased this idea
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .eq('idea_id', ideaId)
      .eq('buyer_id', buyerId)
      .eq('status', 'completed')
      .single();

    if (transactionError || !transaction) {
      return NextResponse.json(
        { error: 'Access denied. Please purchase this idea first.' },
        { status: 403 }
      );
    }

    // Check if code was already generated
    const existingCode = await codeGenerator.getGeneratedCode(ideaId, buyerId);
    if (existingCode) {
      return NextResponse.json({
        message: 'Code already generated for this idea',
        code: existingCode,
        cached: true
      });
    }

    // Prepare code generation request
    const codeRequest: CodeGenerationRequest = {
      ideaId,
      buyerId,
      title,
      description,
      targetFramework,
      preferredLanguage,
      includeDatabase,
      includeAuth,
      includePayments,
      deploymentTarget
    };

    // Generate code using AI
    const generatedCode = await codeGenerator.generateMVPCode(codeRequest);

    return NextResponse.json({
      message: 'Code generated successfully',
      code: generatedCode,
      cached: false
    });

  } catch (error) {
    console.error('Code generation failed:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Code generation failed: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error during code generation' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ideaId = searchParams.get('ideaId');
    const buyerId = searchParams.get('buyerId');

    if (!ideaId || !buyerId) {
      return NextResponse.json(
        { error: 'Missing required parameters: ideaId, buyerId' },
        { status: 400 }
      );
    }

    // Get existing generated code
    const generatedCode = await codeGenerator.getGeneratedCode(ideaId, buyerId);

    if (!generatedCode) {
      return NextResponse.json(
        { error: 'No generated code found for this idea' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      code: generatedCode,
      cached: true
    });

  } catch (error) {
    console.error('Failed to retrieve generated code:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve generated code' },
      { status: 500 }
    );
  }
}