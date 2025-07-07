'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase-client'
import { 
  Users, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  BarChart3,
  PieChart
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard'

interface AdminStats {
  total_users: number
  total_ideas: number
  pending_ideas: number
  total_transactions: number
  total_revenue: number
  active_users_today: number
}

interface PendingIdea {
  id: string
  title: string
  description: string
  category: string
  price: number
  seller: {
    full_name: string
    email: string
  }
  created_at: string
}

interface IdeaWithUser {
  id: string
  title: string
  description: string
  category: string
  price: number
  created_at: string
  users: Array<{
    full_name: string
    email: string
  }>
}

type TabType = 'overview' | 'analytics' | 'pending'

export default function AdminDashboard() {
  const { user } = useAuth()
  const supabase = createClient()
  
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [stats, setStats] = useState<AdminStats>({
    total_users: 0,
    total_ideas: 0,
    pending_ideas: 0,
    total_transactions: 0,
    total_revenue: 0,
    active_users_today: 0
  })
  const [pendingIdeas, setPendingIdeas] = useState<PendingIdea[]>([])
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    try {
      // Get user stats
      const { data: users } = await supabase
        .from('users')
        .select('id, created_at, last_login_at')

      // Get idea stats
      const { data: ideas } = await supabase
        .from('ideas')
        .select('id, validation_status')

      // Get transaction stats
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, status')

      const totalUsers = users?.length || 0
      const totalIdeas = ideas?.length || 0
      const pendingIdeas = ideas?.filter(idea => idea.validation_status === 'pending').length || 0
      const totalTransactions = transactions?.filter(t => t.status === 'completed').length || 0
      const totalRevenue = transactions?.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0) || 0
      
      // Calculate active users today (users who logged in today)
      const today = new Date().toISOString().split('T')[0]
      const activeUsersToday = users?.filter(user => 
        user.last_login_at && user.last_login_at.startsWith(today)
      ).length || 0

      setStats({
        total_users: totalUsers,
        total_ideas: totalIdeas,
        pending_ideas: pendingIdeas,
        total_transactions: totalTransactions,
        total_revenue: totalRevenue,
        active_users_today: activeUsersToday
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      toast.error('통계 데이터를 불러오는데 실패했습니다.')
    }
  }, [supabase])

  const fetchPendingIdeas = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('ideas')
        .select(`
          id,
          title,
          description,
          category,
          price,
          created_at,
          users:seller_id (
            full_name,
            email
          )
        `)
        .eq('validation_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Error fetching pending ideas:', error)
        return
      }

      const transformedData = data?.map((item: IdeaWithUser) => ({
        ...item,
        seller: item.users[0] || { full_name: 'Unknown', email: 'unknown@example.com' }
      })) || []

      setPendingIdeas(transformedData)
    } catch (error) {
      console.error('Error fetching pending ideas:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    if (user) {
      fetchStats()
      fetchPendingIdeas()
    }
  }, [user, fetchStats, fetchPendingIdeas])



  const handleIdeaApproval = async (ideaId: string, action: 'approve' | 'reject') => {
    try {
      const { error } = await supabase
        .from('ideas')
        .update({ 
          validation_status: action === 'approve' ? 'approved' : 'rejected',
          published_at: action === 'approve' ? new Date().toISOString() : null
        })
        .eq('id', ideaId)

      if (error) {
        console.error('Error updating idea:', error)
        toast.error('아이디어 상태 변경에 실패했습니다.')
        return
      }

      toast.success(`아이디어가 ${action === 'approve' ? '승인' : '반려'}되었습니다.`)
      fetchPendingIdeas()
      fetchStats()
    } catch (error) {
      console.error('Error updating idea:', error)
      toast.error('아이디어 상태 변경 중 오류가 발생했습니다.')
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-300 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
              <p className="mt-1 text-gray-600">
                IdeaVault 플랫폼 관리 및 모니터링
              </p>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/admin/users"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <Users className="h-4 w-4 mr-2" />
                사용자 관리
              </Link>
              <Link
                href="/admin/ideas"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <FileText className="h-4 w-4 mr-2" />
                아이디어 관리
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  기본 통계 및 요약
                </div>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'analytics'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <PieChart className="h-4 w-4 mr-2" />
                  상세 분석 대시보드
                </div>
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'pending'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  승인 대기 아이디어
                  {stats.pending_ideas > 0 && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {stats.pending_ideas}
                    </span>
                  )}
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">전체 사용자</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.total_users.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">전체 아이디어</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.total_ideas.toLocaleString()}</p>
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
                    <p className="text-sm font-medium text-gray-600">승인 대기</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.pending_ideas.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">완료된 거래</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.total_transactions.toLocaleString()}</p>
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

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Eye className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">오늘 활성 사용자</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.active_users_today.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link
                href="/admin/users"
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">사용자 관리</h3>
                    <p className="text-sm text-gray-600">계정 및 권한 관리</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/admin/ideas"
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">아이디어 관리</h3>
                    <p className="text-sm text-gray-600">검토 및 승인 관리</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/admin/transactions"
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">거래 관리</h3>
                    <p className="text-sm text-gray-600">결제 및 환불 관리</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/admin/analytics"
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center">
                  <BarChart3 className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">분석</h3>
                    <p className="text-sm text-gray-600">통계 및 리포트</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white rounded-lg shadow p-6">
            <AnalyticsDashboard />
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
                  승인 대기 아이디어
                </h2>
                <Link
                  href="/admin/ideas"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  전체 보기
                </Link>
              </div>
            </div>

            {pendingIdeas.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                승인 대기 중인 아이디어가 없습니다.
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {pendingIdeas.map((idea) => (
                  <div key={idea.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {idea.title}
                        </h3>
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {idea.description}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{idea.category}</span>
                          <span>{formatPrice(idea.price)}</span>
                          <span>by {idea.seller.full_name}</span>
                          <span>{new Date(idea.created_at).toLocaleDateString('ko-KR')}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 ml-4">
                        <Link
                          href={`/ideas/${idea.id}`}
                          className="p-2 text-gray-400 hover:text-gray-600"
                          title="미리보기"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleIdeaApproval(idea.id, 'approve')}
                          className="inline-flex items-center px-3 py-1 border border-green-300 text-green-700 rounded-md hover:bg-green-50"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          승인
                        </button>
                        <button
                          onClick={() => handleIdeaApproval(idea.id, 'reject')}
                          className="inline-flex items-center px-3 py-1 border border-red-300 text-red-700 rounded-md hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          반려
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}