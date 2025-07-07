'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase-client'
import { Star, ThumbsUp, User } from 'lucide-react'
import toast from 'react-hot-toast'
import Image from 'next/image'

interface Review {
  id: string
  rating: number
  implementation_success: number
  revenue_potential: number
  comment: string
  anonymous: boolean
  helpful_count: number
  created_at: string
  buyer: {
    full_name: string
    avatar_url: string
  } | null
}

interface ReviewStats {
  average_rating: number
  total_reviews: number
  rating_distribution: { [key: number]: number }
  avg_implementation_success: number
  avg_revenue_potential: number
}

interface ReviewSystemProps {
  ideaId: string
  hasPurchased: boolean
  isOwner: boolean
}

interface ReviewWithUser {
  id: string
  rating: number
  implementation_success: number
  revenue_potential: number
  comment: string
  anonymous: boolean
  helpful_count: number
  created_at: string
  users: Array<{
    full_name: string
    avatar_url: string
  }>
}

export default function ReviewSystem({ ideaId, hasPurchased, isOwner }: ReviewSystemProps) {
  const { user } = useAuth()
  const supabase = createClient()
  
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats>({
    average_rating: 0,
    total_reviews: 0,
    rating_distribution: {},
    avg_implementation_success: 0,
    avg_revenue_potential: 0
  })
  const [loading, setLoading] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [userReview, setUserReview] = useState<Review | null>(null)
  
  // Review form state
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    implementation_success: 5,
    revenue_potential: 5,
    comment: '',
    anonymous: false
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchReviews = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          implementation_success,
          revenue_potential,
          comment,
          anonymous,
          helpful_count,
          created_at,
          users:buyer_id (
            full_name,
            avatar_url
          )
        `)
        .eq('idea_id', ideaId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching reviews:', error)
        return
      }

      const transformedReviews = data?.map((review: ReviewWithUser): Review => ({
        id: review.id,
        rating: review.rating,
        implementation_success: review.implementation_success,
        revenue_potential: review.revenue_potential,
        comment: review.comment,
        anonymous: review.anonymous,
        helpful_count: review.helpful_count,
        created_at: review.created_at,
        buyer: review.anonymous ? null : (review.users[0] || null)
      })) || []

      setReviews(transformedReviews)
    } catch (error) {
      console.error('Error fetching reviews:', error)
    }
  }, [supabase, ideaId])

  const fetchStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('rating, implementation_success, revenue_potential')
        .eq('idea_id', ideaId)

      if (error) {
        console.error('Error fetching review stats:', error)
        return
      }

      if (data && data.length > 0) {
        const totalReviews = data.length
        const averageRating = data.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        const avgImplementation = data.reduce((sum, r) => sum + r.implementation_success, 0) / totalReviews
        const avgRevenue = data.reduce((sum, r) => sum + r.revenue_potential, 0) / totalReviews

        // Calculate rating distribution
        const distribution: { [key: number]: number } = {}
        for (let i = 1; i <= 5; i++) {
          distribution[i] = data.filter(r => r.rating === i).length
        }

        setStats({
          average_rating: averageRating,
          total_reviews: totalReviews,
          rating_distribution: distribution,
          avg_implementation_success: avgImplementation,
          avg_revenue_potential: avgRevenue
        })
      }
    } catch (error) {
      console.error('Error fetching review stats:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase, ideaId])

  const checkUserReview = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('idea_id', ideaId)
        .eq('buyer_id', user.id)
        .single()

      if (!error && data) {
        setUserReview(data)
        setReviewForm({
          rating: data.rating,
          implementation_success: data.implementation_success,
          revenue_potential: data.revenue_potential,
          comment: data.comment,
          anonymous: data.anonymous
        })
      }
    } catch {
      // No existing review, which is fine
    }
  }, [user, supabase, ideaId])

  useEffect(() => {
    fetchReviews()
    fetchStats()
    if (user && hasPurchased) {
      checkUserReview()
    }
  }, [ideaId, user, hasPurchased, fetchReviews, fetchStats, checkUserReview])

  const handleSubmitReview = async () => {
    if (!user || !hasPurchased) {
      toast.error('구매한 사용자만 리뷰를 작성할 수 있습니다.')
      return
    }

    if (!reviewForm.comment.trim()) {
      toast.error('리뷰 내용을 입력해주세요.')
      return
    }

    setSubmitting(true)

    try {
      const reviewData = {
        idea_id: ideaId,
        buyer_id: user.id,
        rating: reviewForm.rating,
        implementation_success: reviewForm.implementation_success,
        revenue_potential: reviewForm.revenue_potential,
        comment: reviewForm.comment.trim(),
        anonymous: reviewForm.anonymous
      }

      if (userReview) {
        // Update existing review
        const { error } = await supabase
          .from('reviews')
          .update(reviewData)
          .eq('id', userReview.id)

        if (error) {
          console.error('Error updating review:', error)
          toast.error('리뷰 수정에 실패했습니다.')
          return
        }

        toast.success('리뷰가 수정되었습니다.')
      } else {
        // Create new review
        const { error } = await supabase
          .from('reviews')
          .insert([reviewData])

        if (error) {
          console.error('Error creating review:', error)
          toast.error('리뷰 작성에 실패했습니다.')
          return
        }

        toast.success('리뷰가 작성되었습니다.')
      }

      setShowReviewForm(false)
      await fetchReviews()
      await fetchStats()
      await checkUserReview()

      // Send email notification for new reviews only
      if (!userReview) {
        try {
          await fetch('/api/notifications/review', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ideaId,
              reviewerId: user.id,
              rating: reviewForm.rating,
              comment: reviewForm.comment.trim()
            }),
          })
        } catch (emailError) {
          console.error('Failed to send review notification:', emailError)
        }
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      toast.error('리뷰 제출 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleHelpfulVote = async (reviewId: string) => {
    if (!user) {
      toast.error('로그인이 필요합니다.')
      return
    }

    try {
      // Check if user already voted
      const { data: existingVote } = await supabase
        .from('review_votes')
        .select('id')
        .eq('review_id', reviewId)
        .eq('user_id', user.id)
        .single()

      if (existingVote) {
        toast.error('이미 도움이 됨에 투표했습니다.')
        return
      }

      // Add vote
      const { error: voteError } = await supabase
        .from('review_votes')
        .insert([{ review_id: reviewId, user_id: user.id }])

      if (voteError) {
        console.error('Error adding vote:', voteError)
        return
      }

      // Update helpful count
      const { error: updateError } = await supabase.rpc('increment_helpful_count', {
        review_id: reviewId
      })

      if (updateError) {
        console.error('Error updating helpful count:', updateError)
        return
      }

      toast.success('도움이 됨에 투표했습니다.')
      fetchReviews()
    } catch (error) {
      console.error('Error handling helpful vote:', error)
    }
  }

  const renderStars = (rating: number, size = 'h-4 w-4') => {
    return (
      <div className="flex">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`${size} ${
              i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  const renderInteractiveStars = (value: number, onChange: (value: number) => void) => {
    return (
      <div className="flex">
        {Array.from({ length: 5 }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i + 1)}
            className="focus:outline-none"
          >
            <Star
              className={`h-6 w-6 ${
                i < value ? 'text-yellow-400 fill-current' : 'text-gray-300 hover:text-yellow-300'
              }`}
            />
          </button>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-300 rounded w-1/4"></div>
        <div className="h-20 bg-gray-300 rounded"></div>
        <div className="h-20 bg-gray-300 rounded"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Review Stats */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            리뷰 ({stats.total_reviews})
          </h3>
          {hasPurchased && !isOwner && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              {userReview ? '리뷰 수정' : '리뷰 작성'}
            </button>
          )}
        </div>

        {stats.total_reviews > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {stats.average_rating.toFixed(1)}
              </div>
              {renderStars(Math.round(stats.average_rating), 'h-5 w-5')}
              <div className="text-sm text-gray-600 mt-1">전체 평점</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {stats.avg_implementation_success.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">구현 성공도</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {stats.avg_revenue_potential.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">수익 잠재력</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            아직 리뷰가 없습니다. 첫 번째 리뷰를 작성해보세요!
          </div>
        )}
      </div>

      {/* Review Form Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {userReview ? '리뷰 수정' : '리뷰 작성'}
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Overall Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  전체 평점 *
                </label>
                {renderInteractiveStars(reviewForm.rating, (rating) =>
                  setReviewForm(prev => ({ ...prev, rating }))
                )}
              </div>

              {/* Implementation Success */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  구현 성공도 (1-5) *
                </label>
                {renderInteractiveStars(reviewForm.implementation_success, (implementation_success) =>
                  setReviewForm(prev => ({ ...prev, implementation_success }))
                )}
                <p className="text-xs text-gray-500 mt-1">
                  아이디어를 실제로 구현하는데 얼마나 도움이 되었나요?
                </p>
              </div>

              {/* Revenue Potential */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  수익 잠재력 (1-5) *
                </label>
                {renderInteractiveStars(reviewForm.revenue_potential, (revenue_potential) =>
                  setReviewForm(prev => ({ ...prev, revenue_potential }))
                )}
                <p className="text-xs text-gray-500 mt-1">
                  이 아이디어의 수익 창출 가능성을 어떻게 평가하시나요?
                </p>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  리뷰 내용 *
                </label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="아이디어에 대한 상세한 리뷰를 작성해주세요..."
                />
              </div>

              {/* Anonymous Option */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={reviewForm.anonymous}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, anonymous: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="anonymous" className="ml-2 text-sm text-gray-700">
                  익명으로 리뷰 작성
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowReviewForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={submitting}
              >
                취소
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={submitting || !reviewForm.comment.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? '제출 중...' : (userReview ? '수정하기' : '리뷰 작성')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {review.buyer ? (
                  <>
                    <Image
                      src={review.buyer.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.buyer.full_name)}&background=3b82f6&color=ffffff`}
                      alt={`${review.buyer.full_name}의 프로필 사진`}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{review.buyer.full_name}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">익명 사용자</div>
                      <div className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="text-right">
                {renderStars(review.rating)}
                <div className="text-sm text-gray-500 mt-1">
                  구현: {review.implementation_success}/5 • 수익: {review.revenue_potential}/5
                </div>
              </div>
            </div>

            <p className="text-gray-700 mb-4">{review.comment}</p>

            <div className="flex items-center justify-between">
              <button
                onClick={() => handleHelpfulVote(review.id)}
                className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
                disabled={!user}
              >
                <ThumbsUp className="h-4 w-4" />
                <span>도움이 됨 ({review.helpful_count})</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}