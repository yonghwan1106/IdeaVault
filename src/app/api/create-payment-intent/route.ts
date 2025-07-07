import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ideaId, userId } = body

    if (!ideaId || !userId) {
      return NextResponse.json(
        { error: 'Missing ideaId or userId' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Get idea details
    const { data: idea, error: ideaError } = await supabase
      .from('ideas')
      .select('id, title, price, seller_id')
      .eq('id', ideaId)
      .eq('status', 'active')
      .eq('validation_status', 'approved')
      .single()

    if (ideaError || !idea) {
      return NextResponse.json(
        { error: 'Idea not found or not available for purchase' },
        { status: 404 }
      )
    }

    // Check if user is trying to buy their own idea
    if (idea.seller_id === userId) {
      return NextResponse.json(
        { error: 'Cannot purchase your own idea' },
        { status: 400 }
      )
    }

    // Check if user already purchased this idea
    const { data: existingTransaction } = await supabase
      .from('transactions')
      .select('id')
      .eq('buyer_id', userId)
      .eq('idea_id', ideaId)
      .eq('status', 'completed')
      .single()

    if (existingTransaction) {
      return NextResponse.json(
        { error: 'You have already purchased this idea' },
        { status: 400 }
      )
    }

    // Calculate amounts (platform takes 15% commission)
    const totalAmount = idea.price
    const platformCommission = Math.round(totalAmount * 0.15)
    const sellerAmount = totalAmount - platformCommission

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'krw',
      payment_method_types: ['card'],
      metadata: {
        ideaId: idea.id,
        buyerId: userId,
        sellerId: idea.seller_id,
        ideaTitle: idea.title
      },
      description: `Purchase of "${idea.title}" on IdeaVault`
    })

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert([
        {
          idea_id: ideaId,
          buyer_id: userId,
          seller_id: idea.seller_id,
          amount: totalAmount,
          platform_commission: platformCommission,
          seller_amount: sellerAmount,
          stripe_payment_intent_id: paymentIntent.id,
          payment_method: 'stripe',
          status: 'pending',
          payment_details: {
            currency: 'KRW',
            payment_intent_id: paymentIntent.id
          }
        }
      ])
      .select()
      .single()

    if (transactionError) {
      console.error('Transaction creation error:', transactionError)
      return NextResponse.json(
        { error: 'Failed to create transaction record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      transactionId: transaction.id,
      amount: totalAmount
    })

  } catch (error) {
    console.error('Payment intent creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}