import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { emailService } from '@/lib/email'

interface IdeaWithSeller {
  title: string
  seller_id: string
  users: {
    full_name: string
    email: string
  } | null
}

export async function POST(request: NextRequest) {
  try {
    const { ideaId, reviewerId, rating, comment } = await request.json()

    if (!ideaId || !reviewerId || !rating || !comment) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Get idea details with seller information
    const { data: ideaData, error: ideaError } = await supabase
      .from('ideas')
      .select(`
        title,
        seller_id,
        users:seller_id (
          full_name,
          email
        )
      `)
      .eq('id', ideaId)
      .single()

    const idea = ideaData as IdeaWithSeller | null

    if (ideaError || !idea) {
      return NextResponse.json(
        { error: 'Idea not found' },
        { status: 404 }
      )
    }

    // Get reviewer details
    const { data: reviewer, error: reviewerError } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', reviewerId)
      .single()

    if (reviewerError || !reviewer) {
      return NextResponse.json(
        { error: 'Reviewer not found' },
        { status: 404 }
      )
    }

    const reviewPreview = comment.length > 150 
      ? comment.substring(0, 150) + '...'
      : comment

    const notificationData = {
      reviewerName: reviewer.full_name,
      ideaTitle: idea.title,
      rating: rating,
      reviewPreview: reviewPreview
    }

    // Send notification to seller
    if (!idea.users?.email) {
      return NextResponse.json(
        { error: 'Seller email not found' },
        { status: 404 }
      )
    }

    const result = await emailService.sendReviewNotification(
      idea.users.email,
      notificationData
    )

    return NextResponse.json({
      success: true,
      notified: result
    })

  } catch (error) {
    console.error('Review notification error:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}