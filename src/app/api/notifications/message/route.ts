import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { emailService } from '@/lib/email'

interface ConversationWithDetails {
  id: string
  buyer_id: string
  seller_id: string
  buyer: {
    full_name: string
    email: string
  } | null
  seller: {
    full_name: string
    email: string
  } | null
  ideas: {
    title: string
  } | null
}

export async function POST(request: NextRequest) {
  try {
    const { conversationId, senderId, messageContent } = await request.json()

    if (!conversationId || !senderId || !messageContent) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Get conversation details with related data
    const { data: conversationData, error: conversationError } = await supabase
      .from('conversations')
      .select(`
        id,
        buyer_id,
        seller_id,
        buyer:users:buyer_id (
          full_name,
          email
        ),
        seller:users:seller_id (
          full_name,
          email
        ),
        ideas (
          title
        )
      `)
      .eq('id', conversationId)
      .single()

    const conversation = conversationData as ConversationWithDetails | null

    if (conversationError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Get sender details
    const { data: sender, error: senderError } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', senderId)
      .single()

    if (senderError || !sender) {
      return NextResponse.json(
        { error: 'Sender not found' },
        { status: 404 }
      )
    }

    // Determine recipient (the other person in the conversation)
    const recipient = senderId === conversation.buyer_id 
      ? conversation.seller 
      : conversation.buyer

    if (!recipient || !recipient.email) {
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      )
    }

    const messagePreview = messageContent.length > 100 
      ? messageContent.substring(0, 100) + '...'
      : messageContent

    const notificationData = {
      senderName: sender.full_name,
      ideaTitle: conversation.ideas?.title || 'Unknown Idea',
      messagePreview: messagePreview,
      conversationId: conversationId
    }

    // Send notification to recipient
    const result = await emailService.sendMessageNotification(
      recipient.email, 
      notificationData
    )

    return NextResponse.json({
      success: true,
      notified: result
    })

  } catch (error) {
    console.error('Message notification error:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}