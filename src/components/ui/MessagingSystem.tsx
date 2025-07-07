'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase-client'
import { Send, MessageCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import Image from 'next/image'

interface Message {
  id: string
  content: string
  sender_id: string
  message_type: 'text' | 'system'
  created_at: string
  sender: {
    full_name: string
    avatar_url: string
  }
}

interface Conversation {
  id: string
  idea_id: string
  buyer_id: string
  seller_id: string
  status: string
  last_message_at: string
  created_at: string
  buyer: {
    full_name: string
    avatar_url: string
  }
  seller: {
    full_name: string
    avatar_url: string
  }
  ideas: {
    title: string
  }
}

interface MessagingSystemProps {
  ideaId: string
  sellerId: string
  ideaTitle: string
  onClose?: () => void
}

interface MessageWithUser {
  id: string
  content: string
  sender_id: string
  message_type: 'text' | 'system'
  created_at: string
  users: Array<{
    full_name: string
    avatar_url: string
  }>
}

interface ConversationQueryResult {
  id: string
  idea_id: string
  buyer_id: string
  seller_id: string
  status: string
  last_message_at: string
  created_at: string
  buyer: Array<{
    full_name: string
    avatar_url: string
  }>
  seller: Array<{
    full_name: string
    avatar_url: string
  }>
  ideas: Array<{
    title: string
  }>
}

export default function MessagingSystem({ ideaId, sellerId, ideaTitle, onClose }: MessagingSystemProps) {
  const { user } = useAuth()
  const supabase = createClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          sender_id,
          message_type,
          created_at,
          users:sender_id (
            full_name,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching messages:', error)
        return
      }

      const transformedMessages = data?.map((message: MessageWithUser): Message => ({
        id: message.id,
        content: message.content,
        sender_id: message.sender_id,
        message_type: message.message_type,
        created_at: message.created_at,
        sender: message.users[0] || { full_name: 'Unknown', avatar_url: '' }
      })) || []

      setMessages(transformedMessages)
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }, [supabase])

  const initializeConversation = useCallback(async () => {
    if (!user) return

    try {
      // Check if conversation exists
      const { data: fetchedConversation, error: conversationError } = await supabase
        .from('conversations')
        .select(`
          id,
          idea_id,
          buyer_id,
          seller_id,
          status,
          last_message_at,
          created_at,
          buyer:users:buyer_id (
            full_name,
            avatar_url
          ),
          seller:users:seller_id (
            full_name,
            avatar_url
          ),
          ideas!idea_id (
            title
          )
        `)
        .eq('idea_id', ideaId)
        .eq('buyer_id', user.id)
        .eq('seller_id', sellerId)
        .single()

      if (conversationError && conversationError.code !== 'PGRST116') {
        console.error('Error fetching conversation:', conversationError)
        return
      }

      let existingConversation = fetchedConversation

      if (!existingConversation) {
        // Create new conversation
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert([{
            idea_id: ideaId,
            buyer_id: user.id,
            seller_id: sellerId
          }])
          .select(`
            id,
            idea_id,
            buyer_id,
            seller_id,
            status,
            last_message_at,
            created_at,
            buyer:users:buyer_id (
              full_name,
              avatar_url
            ),
            seller:users:seller_id (
              full_name,
              avatar_url
            ),
            ideas!idea_id (
              title
            )
          `)
          .single()

        if (createError) {
          console.error('Error creating conversation:', createError)
          toast.error('대화방 생성에 실패했습니다.')
          return
        }

        existingConversation = newConversation as any
      }

      if (!existingConversation) {
        toast.error('대화방 정보를 불러올 수 없습니다.')
        return
      }

      const conversation: Conversation = {
        id: (existingConversation as any).id,
        idea_id: (existingConversation as any).idea_id,
        buyer_id: (existingConversation as any).buyer_id,
        seller_id: (existingConversation as any).seller_id,
        status: (existingConversation as any).status,
        last_message_at: (existingConversation as any).last_message_at,
        created_at: (existingConversation as any).created_at,
        buyer: (existingConversation as any).buyer?.[0] || { full_name: 'Unknown', avatar_url: '' },
        seller: (existingConversation as any).seller?.[0] || { full_name: 'Unknown', avatar_url: '' },
        ideas: (existingConversation as any).ideas?.[0] || { title: ideaTitle }
      }

      setConversation(conversation)
      if ((existingConversation as any)?.id) {
        await fetchMessages((existingConversation as any).id)
      }
    } catch (error) {
      console.error('Error initializing conversation:', error)
      toast.error('대화방을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [user, ideaId, sellerId, ideaTitle, supabase, fetchMessages])

  useEffect(() => {
    if (user && ideaId && sellerId) {
      initializeConversation()
    }
  }, [user, ideaId, sellerId, initializeConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async () => {
    if (!user || !conversation || !newMessage.trim()) return

    setSending(true)

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          conversation_id: conversation.id,
          sender_id: user.id,
          content: newMessage.trim(),
          message_type: 'text'
        }])
        .select(`
          id,
          content,
          sender_id,
          message_type,
          created_at,
          users:sender_id (
            full_name,
            avatar_url
          )
        `)
        .single()

      if (error) {
        console.error('Error sending message:', error)
        toast.error('메시지 전송에 실패했습니다.')
        return
      }

      const messageData = data as MessageWithUser
      const newMsg: Message = {
        id: messageData.id,
        content: messageData.content,
        sender_id: messageData.sender_id,
        message_type: messageData.message_type,
        created_at: messageData.created_at,
        sender: messageData.users[0] || { full_name: 'Unknown', avatar_url: '' }
      }

      setMessages(prev => [...prev, newMsg])
      setNewMessage('')

      // Send email notification
      try {
        await fetch('/api/notifications/message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId: conversation.id,
            senderId: user.id,
            messageContent: newMessage.trim()
          }),
        })
      } catch (emailError) {
        console.error('Failed to send message notification:', emailError)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('메시지 전송 중 오류가 발생했습니다.')
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getOtherParticipant = () => {
    if (!conversation || !user) return null
    return user.id === conversation.buyer_id ? conversation.seller : conversation.buyer
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">대화방을 불러오는 중...</span>
      </div>
    )
  }

  const otherParticipant = getOtherParticipant()

  return (
    <div className="flex flex-col h-full max-h-[600px] bg-white rounded-lg shadow">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <MessageCircle className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="font-semibold text-gray-900">
              {otherParticipant?.full_name}와의 대화
            </h3>
            <p className="text-sm text-gray-600 truncate">
              {ideaTitle}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p>아직 메시지가 없습니다.</p>
            <p className="text-sm">첫 번째 메시지를 보내보세요!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender_id === user?.id
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <Image
                    src={message.sender.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender.full_name)}&background=3b82f6&color=ffffff`}
                    alt={`${message.sender.full_name}의 프로필 사진`}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className={`${isOwnMessage ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'} rounded-lg px-3 py-2`}>
                    <p className="text-sm">{message.content}</p>
                    <div className={`flex items-center mt-1 text-xs ${isOwnMessage ? 'text-blue-200' : 'text-gray-500'}`}>
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(message.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="메시지를 입력하세요..."
            rows={2}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
          <button
            onClick={sendMessage}
            disabled={sending || !newMessage.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}