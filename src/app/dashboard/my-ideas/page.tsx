'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { createClient } from '@/lib/supabase-client'
import { IDEA_CATEGORIES } from '@/lib/categories'
import { 
  Plus, 
  Edit, 
  Eye, 
  DollarSign, 
  Clock,
  MoreVertical,
  Star,
  TrendingUp,
  Filter,
  Search
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface MyIdea {
  id: string
  title: string
  description: string
  category: string
  package_type: 'idea' | 'mvp' | 'launch_kit'
  price: number
  implementation_difficulty: number
  view_count: number
  status: 'draft' | 'active' | 'archived'
  validation_status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
  published_at: string | null
}

interface IdeaStats {
  total_ideas: number
  published_ideas: number
  draft_ideas: number
  total_views: number
  total_revenue: number
}

export default function MyIdeasPage() {
  const { user, userProfile } = useAuth()
  const supabase = createClient()
  
  const [ideas, setIdeas] = useState<MyIdea[]>([])
  const [stats, setStats] = useState<IdeaStats>({
    total_ideas: 0,
    published_ideas: 0,
    draft_ideas: 0,
    total_views: 0,
    total_revenue: 0
  })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'active' | 'archived'>('all')
  const [validationFilter, setValidationFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const fetchIdeas = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      let query = supabase
        .from('ideas')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      if (validationFilter !== 'all') {
        query = query.eq('validation_status', validationFilter)
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching ideas:', error)
        toast.error('아이디어 목록을 불러오는데 실패했습니다.')
        return
      }

      setIdeas(data || [])
    } catch (error) {
      console.error('Error fetching ideas:', error)
      toast.error('아이디어 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [user, statusFilter, validationFilter, searchTerm, supabase])

  const fetchStats = useCallback(async () => {
    if (!user) return

    try {
      // Get idea stats
      const { data: ideaStats } = await supabase
        .from('ideas')
        .select('status, validation_status, view_count')
        .eq('seller_id', user.id)

      // Get revenue stats
      const { data: revenueStats } = await supabase
        .from('transactions')
        .select('amount')
        .eq('seller_id', user.id)
        .eq('status', 'completed')

      const totalIdeas = ideaStats?.length || 0
      const publishedIdeas = ideaStats?.filter(idea => idea.status === 'active' && idea.validation_status === 'approved').length || 0
      const draftIdeas = ideaStats?.filter(idea => idea.status === 'draft').length || 0
      const totalViews = ideaStats?.reduce((sum, idea) => sum + (idea.view_count || 0), 0) || 0
      const totalRevenue = revenueStats?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0

      setStats({
        total_ideas: totalIdeas,
        published_ideas: publishedIdeas,
        draft_ideas: draftIdeas,
        total_views: totalViews,
        total_revenue: totalRevenue
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [user, supabase])

  useEffect(() => {
    if (user) {
      fetchIdeas()
      fetchStats()
    }
  }, [user, statusFilter, validationFilter, fetchIdeas, fetchStats])



  const handleStatusChange = async (ideaId: string, newStatus: 'draft' | 'active' | 'archived') => {
    try {
      const { error } = await supabase
        .from('ideas')
        .update({ 
          status: newStatus,
          published_at: newStatus === 'active' ? new Date().toISOString() : null
        })
        .eq('id', ideaId)

      if (error) {
        console.error('Error updating status:', error)
        toast.error('상태 변경에 실패했습니다.')
        return
      }

      toast.success('상태가 변경되었습니다.')
      fetchIdeas()
      fetchStats()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('상태 변경에 실패했습니다.')
    }
  }

  const handleSearch = () => {
    fetchIdeas()
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


  const getStatusBadge = (status: string, validationStatus: string) => {
    if (status === 'draft') {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">임시저장</span>
    }
    
    if (status === 'active') {
      if (validationStatus === 'approved') {
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">게시중</span>
      } else if (validationStatus === 'pending') {
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">검토중</span>
      } else if (validationStatus === 'rejected') {
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">반려됨</span>
      }
    }
    
    if (status === 'archived') {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">보관됨</span>
    }

    return null
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

  if (!userProfile || (userProfile.user_type !== 'seller' && userProfile.user_type !== 'both')) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            판매자 권한이 필요합니다
          </h1>
          <p className="text-gray-600 mb-6">
            아이디어를 등록하고 관리하려면 판매자 권한이 필요합니다.
          </p>
          <Link
            href="/profile"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            프로필에서 사용자 유형 변경
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">내 아이디어</h1>
            <p className="mt-1 text-gray-600">
              등록한 아이디어를 관리하고 성과를 확인하세요.
            </p>
          </div>
          <Link
            href="/ideas/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            새 아이디어 등록
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">전체 아이디어</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total_ideas}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Eye className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">게시중</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.published_ideas}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">임시저장</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.draft_ideas}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Eye className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 조회수</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total_views.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 수익</p>
                <p className="text-2xl font-semibold text-gray-900">{formatPrice(stats.total_revenue)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="아이디어 검색..."
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'draft' | 'active' | 'archived')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">모든 상태</option>
                <option value="draft">임시저장</option>
                <option value="active">게시중</option>
                <option value="archived">보관됨</option>
              </select>

              <select
                value={validationFilter}
                onChange={(e) => setValidationFilter(e.target.value as 'all' | 'pending' | 'approved' | 'rejected')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">모든 검토상태</option>
                <option value="pending">검토중</option>
                <option value="approved">승인됨</option>
                <option value="rejected">반려됨</option>
              </select>

              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Filter className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Ideas List */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/6"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : ideas.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || statusFilter !== 'all' || validationFilter !== 'all' 
                  ? '검색 결과가 없습니다' 
                  : '아직 등록한 아이디어가 없습니다'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all' || validationFilter !== 'all'
                  ? '다른 검색 조건을 시도해보세요.'
                  : '첫 번째 아이디어를 등록해보세요.'}
              </p>
              {!searchTerm && statusFilter === 'all' && validationFilter === 'all' && (
                <Link
                  href="/ideas/new"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  아이디어 등록하기
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {ideas.map((idea) => (
                <div key={idea.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                          <Link href={`/ideas/${idea.id}`}>
                            {idea.title}
                          </Link>
                        </h3>
                        {getStatusBadge(idea.status, idea.validation_status)}
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                          {getCategoryLabel(idea.category)}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {idea.description}
                      </p>

                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {formatPrice(idea.price)}
                        </div>
                        <div className="flex items-center">
                          <Eye className="h-4 w-4 mr-1" />
                          {idea.view_count} 조회
                        </div>
                        <div className="flex items-center">
                          {getDifficultyStars(idea.implementation_difficulty)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {new Date(idea.created_at).toLocaleDateString('ko-KR')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Link
                        href={`/ideas/${idea.id}`}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="보기"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/dashboard/my-ideas/edit/${idea.id}`}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="수정"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <div className="relative group">
                        <button className="p-2 text-gray-400 hover:text-gray-600">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                          <div className="py-1">
                            {idea.status === 'draft' && (
                              <button
                                onClick={() => handleStatusChange(idea.id, 'active')}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                게시하기
                              </button>
                            )}
                            {idea.status === 'active' && (
                              <button
                                onClick={() => handleStatusChange(idea.id, 'draft')}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                임시저장으로 변경
                              </button>
                            )}
                            <button
                              onClick={() => handleStatusChange(idea.id, 'archived')}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              보관하기
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}