'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase-client'
import { IDEA_CATEGORIES, PACKAGE_TYPES, DIFFICULTY_LEVELS } from '@/lib/categories'
import StripePayment from '@/components/ui/StripePayment'
import TossPayment from '@/components/ui/TossPayment'
import ReviewSystem from '@/components/ui/ReviewSystem'
import MessagingSystem from '@/components/ui/MessagingSystem'
import toast from 'react-hot-toast'
import {
  Star,
  Eye,
  DollarSign,
  User,
  Clock,
  Code,
  Target,
  TrendingUp,
  MessageCircle,
  Shield,
  Download,
  Lock,
  CheckCircle,
  Calendar,
  Tag
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Idea {
  id: string
  title: string
  description: string
  category: string
  package_type: 'idea' | 'mvp' | 'launch_kit'
  price: number
  target_audience: string
  revenue_model: string
  implementation_difficulty: number
  estimated_dev_time: string
  tech_stack: string[]
  market_size: string
  preview_content: string
  full_content: string
  seo_keywords: string[]
  view_count: number
  status: string
  validation_status: string
  created_at: string
  updated_at: string
  published_at: string
  seller_id: string
  seller: {
    id: string
    full_name: string
    avatar_url: string
    username: string
    bio: string
    expertise_tags: string[]
    verified: boolean
  }
}

interface IdeaDetailClientProps {
  idea: Idea
  ideaId: string
}

export default function IdeaDetailClient({ idea: initialIdea, ideaId }: IdeaDetailClientProps) {
  const router = useRouter()
  const { user, userProfile } = useAuth()
  const supabase = createClient()
  
  const [idea] = useState<Idea>(initialIdea)
  const [hasPurchased, setHasPurchased] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'reviews' | 'seller'>('overview')
  const [showPayment, setShowPayment] = useState(false)
  const [showMessaging, setShowMessaging] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'stripe' | 'toss' | null>(null)

  const updateViewCount = useCallback(async () => {
    try {
      await supabase.rpc('increment_view_count', {
        idea_id: ideaId
      })
    } catch (error) {
      console.error('Error updating view count:', error)
    }
  }, [ideaId, supabase])

  const checkPurchaseStatus = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('id')
        .eq('buyer_id', user.id)
        .eq('idea_id', ideaId)
        .eq('status', 'completed')
        .single()

      if (!error && data) {
        setHasPurchased(true)
      }
    } catch {
      // No purchase found, which is expected
    }
  }, [user, ideaId, supabase])

  useEffect(() => {
    updateViewCount()
    if (user) {
      checkPurchaseStatus()
    }
  }, [user, updateViewCount, checkPurchaseStatus])

  const handlePurchase = () => {
    if (!user || !userProfile) {
      toast.error('로그인이 필요합니다.')
      router.push('/signin')
      return
    }

    if (user.id === idea.seller_id) {
      toast.error('자신의 아이디어는 구매할 수 없습니다.')
      return
    }

    setShowPayment(true)
  }

  const handlePaymentSuccess = () => {
    setShowPayment(false)
    setSelectedPaymentMethod(null)
    setHasPurchased(true)
    toast.success('구매가 완료되었습니다!')
    
    // Refresh the page to show purchased content
    window.location.reload()
  }

  const handlePaymentCancel = () => {
    setShowPayment(false)
    setSelectedPaymentMethod(null)
  }

  const handlePaymentMethodSelect = (method: 'stripe' | 'toss') => {
    setSelectedPaymentMethod(method)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const getCategoryLabel = (category: string) => {
    return IDEA_CATEGORIES.find(c => c.value === category)?.label || category
  }

  const getPackageTypeLabel = (packageType: string) => {
    return PACKAGE_TYPES.find(p => p.value === packageType)?.label || packageType
  }

  const getDifficultyLabel = (difficulty: number) => {
    return DIFFICULTY_LEVELS.find(d => d.value === difficulty)?.label || `레벨 ${difficulty}`
  }

  const getDifficultyStars = (difficulty: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < difficulty ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  const isOwner = user?.id === idea.seller_id

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {getCategoryLabel(idea.category)}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                  {getPackageTypeLabel(idea.package_type)}
                </span>
                {idea.seller.verified && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    검증된 판매자
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {idea.title}
              </h1>
              <p className="text-gray-600 mb-4">
                {idea.description}
              </p>
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  {idea.view_count} 조회
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(idea.published_at).toLocaleDateString('ko-KR')}
                </div>
                <div className="flex items-center">
                  {getDifficultyStars(idea.implementation_difficulty)}
                  <span className="ml-2">{getDifficultyLabel(idea.implementation_difficulty)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  {[
                    { key: 'overview', label: '개요', icon: TrendingUp },
                    { key: 'content', label: '콘텐츠', icon: hasPurchased || isOwner ? Download : Lock },
                    { key: 'reviews', label: '리뷰', icon: Star },
                    { key: 'seller', label: '판매자', icon: User }
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key as 'overview' | 'content' | 'reviews' | 'seller')}
                      className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === key
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow">
              {activeTab === 'overview' && (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <Target className="h-5 w-5 mr-2 text-blue-600" />
                        타겟 고객
                      </h3>
                      <p className="text-gray-600">{idea.target_audience}</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                        수익 모델
                      </h3>
                      <p className="text-gray-600">{idea.revenue_model}</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <Clock className="h-5 w-5 mr-2 text-orange-600" />
                        예상 개발 기간
                      </h3>
                      <p className="text-gray-600">{idea.estimated_dev_time}</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
                        시장 규모
                      </h3>
                      <p className="text-gray-600">{idea.market_size}</p>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <Code className="h-5 w-5 mr-2 text-gray-600" />
                      기술 스택
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {idea.tech_stack.map((tech) => (
                        <span
                          key={tech}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  {idea.seo_keywords && idea.seo_keywords.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <Tag className="h-5 w-5 mr-2 text-gray-600" />
                        키워드
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {idea.seo_keywords.map((keyword) => (
                          <span
                            key={keyword}
                            className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'content' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">미리보기</h3>
                    <div className="prose max-w-none">
                      <div className="whitespace-pre-wrap text-gray-700">
                        {idea.preview_content}
                      </div>
                    </div>
                  </div>

                  {hasPurchased || isOwner ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold flex items-center">
                          <Download className="h-5 w-5 mr-2 text-green-600" />
                          전체 콘텐츠
                        </h3>
                        {hasPurchased && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            구매 완료
                          </span>
                        )}
                      </div>
                      <div className="prose max-w-none">
                        <div className="whitespace-pre-wrap text-gray-700">
                          {idea.full_content}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        구매 후 이용 가능
                      </h3>
                      <p className="text-gray-600 mb-4">
                        전체 콘텐츠를 보려면 아이디어를 구매해주세요.
                      </p>
                      <button
                        onClick={handlePurchase}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        {`${formatPrice(idea.price)}에 구매하기`}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="p-6">
                  <ReviewSystem 
                    ideaId={idea.id}
                    hasPurchased={hasPurchased}
                    isOwner={isOwner}
                  />
                </div>
              )}

              {activeTab === 'seller' && (
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <Image
                      src={idea.seller.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(idea.seller.full_name)}&background=3b82f6&color=ffffff`}
                      alt={`${idea.seller.full_name}의 프로필 사진`}
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold">{idea.seller.full_name}</h3>
                        {idea.seller.verified && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      {idea.seller.username && (
                        <p className="text-gray-600 mb-2">@{idea.seller.username}</p>
                      )}
                      {idea.seller.bio && (
                        <p className="text-gray-700 mb-4">{idea.seller.bio}</p>
                      )}
                      {idea.seller.expertise_tags && idea.seller.expertise_tags.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">전문 분야</h4>
                          <div className="flex flex-wrap gap-2">
                            {idea.seller.expertise_tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {!isOwner && user && hasPurchased && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <button 
                        onClick={() => setShowMessaging(true)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        판매자에게 문의
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {formatPrice(idea.price)}
                </div>
                <p className="text-gray-600">
                  {getPackageTypeLabel(idea.package_type)}
                </p>
              </div>

              {isOwner ? (
                <div className="space-y-3">
                  <div className="text-center text-gray-600 mb-4">
                    이것은 당신의 아이디어입니다
                  </div>
                  <Link
                    href={`/dashboard/my-ideas/edit/${idea.id}`}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    아이디어 수정
                  </Link>
                  <Link
                    href="/dashboard/my-ideas"
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    내 아이디어 관리
                  </Link>
                </div>
              ) : hasPurchased ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center text-green-600 mb-4">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    구매 완료
                  </div>
                  <button className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    <Download className="h-4 w-4 mr-2" />
                    콘텐츠 다운로드
                  </button>
                  <button 
                    onClick={() => setShowMessaging(true)}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    판매자에게 문의
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {user ? (
                    <>
                      <button
                        onClick={handlePurchase}
                        className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        지금 구매하기
                      </button>
                      <div className="text-xs text-gray-500 text-center">
                        <Shield className="h-4 w-4 inline mr-1" />
                        안전한 결제가 보장됩니다
                      </div>
                    </>
                  ) : (
                    <Link
                      href="/signin"
                      className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      로그인 후 구매하기
                    </Link>
                  )}
                </div>
              )}

              {/* Payment Modal */}
              {showPayment && idea && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-4 border-b border-gray-200">
                      <h2 className="text-lg font-semibold text-gray-900">
                        아이디어 구매
                      </h2>
                    </div>
                    <div className="p-4">
                      {!selectedPaymentMethod ? (
                        <div className="space-y-4">
                          <div className="text-center mb-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              결제 방법을 선택해주세요
                            </h3>
                            <p className="text-sm text-gray-600">
                              {idea.title} - {formatPrice(idea.price)}
                            </p>
                          </div>
                          
                          <div className="space-y-3">
                            <button
                              onClick={() => handlePaymentMethodSelect('stripe')}
                              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-bold">S</span>
                                  </div>
                                  <div className="text-left">
                                    <div className="font-medium text-gray-900">
                                      International Credit Card
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      해외 신용카드 및 다양한 결제 수단
                                    </div>
                                  </div>
                                </div>
                                <div className="text-gray-400">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                              </div>
                            </button>

                            <button
                              onClick={() => handlePaymentMethodSelect('toss')}
                              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                                    <span className="text-black text-sm font-bold">T</span>
                                  </div>
                                  <div className="text-left">
                                    <div className="font-medium text-gray-900">
                                      Korean Payment Methods
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      토스페이, 카카오페이, 국내 카드 결제
                                    </div>
                                  </div>
                                </div>
                                <div className="text-gray-400">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                              </div>
                            </button>
                          </div>

                          <div className="pt-4 border-t border-gray-200">
                            <button
                              onClick={handlePaymentCancel}
                              className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <button
                              onClick={() => setSelectedPaymentMethod(null)}
                              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                              결제 방법 변경
                            </button>
                          </div>

                          {selectedPaymentMethod === 'stripe' && (
                            <StripePayment
                              ideaId={idea.id}
                              amount={idea.price}
                              ideaTitle={idea.title}
                              onSuccess={handlePaymentSuccess}
                              onCancel={handlePaymentCancel}
                            />
                          )}

                          {selectedPaymentMethod === 'toss' && (
                            <TossPayment
                              ideaId={idea.id}
                              amount={idea.price}
                              title={idea.title}
                              onSuccess={handlePaymentSuccess}
                              onError={(error) => {
                                toast.error(error)
                                setSelectedPaymentMethod(null)
                              }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Messaging Modal */}
              {showMessaging && idea && user && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                    <MessagingSystem
                      ideaId={idea.id}
                      sellerId={idea.seller_id}
                      ideaTitle={idea.title}
                      onClose={() => setShowMessaging(false)}
                    />
                  </div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex justify-between">
                    <span>조회수</span>
                    <span>{idea.view_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>게시일</span>
                    <span>{new Date(idea.published_at).toLocaleDateString('ko-KR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>구현 난이도</span>
                    <span>{getDifficultyLabel(idea.implementation_difficulty)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}