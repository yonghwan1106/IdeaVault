import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { stripe } from '@/lib/stripe'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = headers()
  const signature = headersList.get('stripe-signature')!

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: unknown) {
    console.error('Webhook signature verification failed:', err instanceof Error ? err.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  const supabase = createClient()

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object
        const { ideaId, buyerId, sellerId } = paymentIntent.metadata

        // Update transaction status to completed
        const { error: updateError } = await supabase
          .from('transactions')
          .update({
            status: 'completed',
            payment_details: {
              ...paymentIntent.metadata,
              payment_method: paymentIntent.payment_method_types[0],
              completed_at: new Date().toISOString()
            }
          })
          .eq('stripe_payment_intent_id', paymentIntent.id)

        if (updateError) {
          console.error('Failed to update transaction:', updateError)
          break
        }

        // Update idea purchase count
        await supabase.rpc('increment_purchase_count', {
          idea_id: ideaId
        })

        // Send email notifications
        try {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/purchase`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ideaId,
              buyerId,
              sellerId,
              amount: paymentIntent.amount
            }),
          })
        } catch (emailError) {
          console.error('Failed to send purchase notifications:', emailError)
        }

        console.log(`Payment succeeded for idea ${ideaId}`)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object

        // Update transaction status to failed
        await supabase
          .from('transactions')
          .update({
            status: 'failed',
            payment_details: {
              error: paymentIntent.last_payment_error?.message || 'Payment failed',
              failed_at: new Date().toISOString()
            }
          })
          .eq('stripe_payment_intent_id', paymentIntent.id)

        console.log(`Payment failed for payment intent ${paymentIntent.id}`)
        break
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object

        // Update transaction status to cancelled
        await supabase
          .from('transactions')
          .update({
            status: 'cancelled',
            payment_details: {
              cancelled_at: new Date().toISOString()
            }
          })
          .eq('stripe_payment_intent_id', paymentIntent.id)

        console.log(`Payment cancelled for payment intent ${paymentIntent.id}`)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}