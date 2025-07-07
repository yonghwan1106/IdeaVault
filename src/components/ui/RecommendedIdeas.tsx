'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { recommendationEngine } from '@/lib/recommendations'
import { createClient } from '@/lib/supabase-client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, Eye, User, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface RecommendedIdea {
  id: string
  title: string
  description: string
  price: number
  category: string
  package_type: string
  seller: {
    full_name: string
    avatar_url: string
  }
  avg_rating: number
  review_count: number
  view_count: number
  reasons: string[]
}

interface RecommendedIdeasProps {
  title?: string
  limit?: number
  excludeIds?: string[]
  className?: string
}

export default function RecommendedIdeas({ 
  title = "추천 아이디어", 
  limit = 6,
  excludeIds = [],
  className = ""
}: RecommendedIdeasProps) {
  const { user } = useAuth()
  const [ideas, setIdeas] = useState<RecommendedIdea[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchRecommendations()
    } else {
      fetchPopularIdeas()
    }
  }, [user, excludeIds])

  const fetchRecommendations = async () => {
    try {
      setLoading(true)
      const recommendations = await recommendationEngine.getRecommendations(user!.id, limit + excludeIds.length)
      
      // 제외할 아이디어들 필터링
      const filteredRecommendations = recommendations.filter(
        rec => !excludeIds.includes(rec.ideaId)
      ).slice(0, limit)

      if (filteredRecommendations.length === 0) {
        await fetchPopularIdeas()
        return
      }

      // 추천된 아이디어들의 상세 정보 가져오기
      const ideaIds = filteredRecommendations.map(rec => rec.ideaId)
      
      const { data: ideasData, error } = await supabase
        .from('ideas')
        .select('*')
        .in('id', ideaIds)
        .eq('status', 'active')

      if (error) throw error

      // Get seller information
      const sellerIds = Array.from(new Set(ideasData?.map(idea => idea.seller_id) || []))
      const { data: sellersData } = await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .in('id', sellerIds)

      // Get review information
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('idea_id, rating')
        .in('idea_id', ideaIds)

      // 추천 이유와 함께 데이터 매핑
      const ideasWithReasons = ideasData?.map(idea => {
        const recommendation = filteredRecommendations.find(rec => rec.ideaId === idea.id)
        const seller = sellersData?.find(s => s.id === idea.seller_id) || {
          full_name: 'Unknown',
          avatar_url: ''
        }
        const reviews = reviewsData?.filter(r => r.idea_id === idea.id) || []
        const avgRating = reviews.length > 0 
          ? reviews.reduce((sum: number, review: any) => sum + (review.rating || 0), 0) / reviews.length 
          : 0

        return {
          ...idea,
          seller,
          avg_rating: Number(avgRating.toFixed(1)),
          review_count: reviews.length,
          reasons: recommendation?.reasons || ['추천 아이디어']
        }
      }) || []

      setIdeas(ideasWithReasons)
    } catch (err) {
      console.error('Error fetching recommendations:', err)
      setError('추천 아이디어를 불러오는데 실패했습니다.')
      await fetchPopularIdeas()
    } finally {
      setLoading(false)
    }
  }

  const fetchPopularIdeas = async () => {
    try {
      const { data: ideasData, error } = await supabase
        .from('ideas')
        .select('*')
        .eq('status', 'active')
        .eq('validation_status', 'approved')
        .not('id', 'in', `(${excludeIds.join(',')})`)
        .order('purchase_count', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      if (!ideasData || ideasData.length === 0) {
        setIdeas([])
        return
      }

      // Get seller information
      const sellerIds = Array.from(new Set(ideasData.map(idea => idea.seller_id)))
      const { data: sellersData } = await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .in('id', sellerIds)

      // Get review information
      const ideaIds = ideasData.map(idea => idea.id)
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('idea_id, rating')
        .in('idea_id', ideaIds)

      const mappedIdeas = ideasData.map(idea => {
        const seller = sellersData?.find(s => s.id === idea.seller_id) || {
          full_name: 'Unknown',
          avatar_url: ''
        }
        const reviews = reviewsData?.filter(r => r.idea_id === idea.id) || []
        const avgRating = reviews.length > 0 
          ? reviews.reduce((sum: number, review: any) => sum + (review.rating || 0), 0) / reviews.length 
          : 0

        return {
          ...idea,
          seller,
          avg_rating: Number(avgRating.toFixed(1)),
          review_count: reviews.length,
          reasons: ['인기 아이디어']
        }
      })

      setIdeas(mappedIdeas)
    } catch (err) {
      console.error('Error fetching popular ideas:', err)
      setError('인기 아이디어를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleIdeaClick = async (ideaId: string, position: number) => {
    if (user) {
      await recommendationEngine.trackRecommendationClick(user.id, ideaId, position)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0
    }).format(price)
  }

  const getPackageTypeLabel = (type: string) => {
    switch (type) {
      case 'idea': return '아이디어 패키지'
      case 'mvp': return 'MVP 설계도'
      case 'launch_kit': return '런치 키트'
      default: return type
    }
  }

  if (loading) {
    return (
      <div className={className}>
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: limit }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={className}>
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            다시 시도
          </Button>
        </div>
      </div>
    )
  }

  if (ideas.length === 0) {
    return (
      <div className={className}>
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        <div className="text-center py-8">
          <p className="text-gray-500">추천할 아이디어가 없습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{title}</h2>
        {user && (
          <div className="flex items-center text-sm text-gray-500">
            <TrendingUp className="w-4 h-4 mr-1" />
            개인화된 추천
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ideas.map((idea, index) => (
          <Card key={idea.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              {/* 추천 이유 */}
              <div className="flex flex-wrap gap-1 mb-3">
                {idea.reasons.slice(0, 2).map((reason, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {reason}
                  </Badge>
                ))}
              </div>

              {/* 아이디어 제목 */}
              <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                <Link 
                  href={`/ideas/${idea.id}`}
                  onClick={() => handleIdeaClick(idea.id, index)}
                  className="hover:text-blue-600 transition-colors"
                >
                  {idea.title}
                </Link>
              </h3>

              {/* 설명 */}
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {idea.description}
              </p>

              {/* 패키지 타입 및 카테고리 */}
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="text-xs">
                  {getPackageTypeLabel(idea.package_type)}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {idea.category}
                </Badge>
              </div>

              {/* 판매자 정보 */}
              <div className="flex items-center gap-2 mb-4">
                {idea.seller?.avatar_url ? (
                  <Image
                    src={idea.seller.avatar_url}
                    alt={`${idea.seller.full_name}의 프로필 사진`}
                    width={24}
                    height={24}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                    <User className="w-3 h-3 text-gray-600" />
                  </div>
                )}
                <span className="text-sm text-gray-600">
                  {idea.seller?.full_name || '익명'}
                </span>
              </div>

              {/* 평점 및 조회수 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  {idea.avg_rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">
                        {idea.avg_rating}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({idea.review_count})
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {idea.view_count}
                    </span>
                  </div>
                </div>
              </div>

              {/* 가격 및 구매 버튼 */}
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-blue-600">
                  {formatPrice(idea.price)}
                </div>
                <Button size="sm" asChild>
                  <Link 
                    href={`/ideas/${idea.id}`}
                    onClick={() => handleIdeaClick(idea.id, index)}
                  >
                    자세히 보기
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {ideas.length === limit && (
        <div className="text-center mt-8">
          <Button variant="outline" asChild>
            <Link href="/ideas">더 많은 아이디어 보기</Link>
          </Button>
        </div>
      )}
    </div>
  )
}