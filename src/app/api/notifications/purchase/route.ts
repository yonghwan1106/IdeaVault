import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { emailService } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { ideaId, buyerId, sellerId, amount } = await request.json()

    if (!ideaId || !buyerId || !sellerId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Get idea details
    const { data: idea, error: ideaError } = await supabase
      .from('ideas')
      .select('title')
      .eq('id', ideaId)
      .single()

    if (ideaError || !idea) {
      return NextResponse.json(
        { error: 'Idea not found' },
        { status: 404 }
      )
    }

    // Get buyer details
    const { data: buyer, error: buyerError } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', buyerId)
      .single()

    if (buyerError || !buyer) {
      return NextResponse.json(
        { error: 'Buyer not found' },
        { status: 404 }
      )
    }

    // Get seller details
    const { data: seller, error: sellerError } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', sellerId)
      .single()

    if (sellerError || !seller) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      )
    }

    const purchaseDate = new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    const notificationData = {
      buyerName: buyer.full_name,
      ideaTitle: idea.title,
      amount: amount,
      purchaseDate: purchaseDate
    }

    // Send notifications
    const [sellerResult, buyerResult] = await Promise.all([
      emailService.sendPurchaseNotificationToSeller(seller.email, notificationData),
      emailService.sendPurchaseConfirmationToBuyer(buyer.email, notificationData)
    ])

    return NextResponse.json({
      success: true,
      sellerNotified: sellerResult,
      buyerNotified: buyerResult
    })

  } catch (error) {
    console.error('Purchase notification error:', error)
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    )
  }
}