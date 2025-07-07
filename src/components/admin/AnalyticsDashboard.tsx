'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  Star,
  Eye,
  Calendar,
  Download,
  Filter
} from 'lucide-react'

interface AnalyticsData {
  totalRevenue: number
  totalUsers: number
  totalTransactions: number
  averageRating: number
  revenueGrowth: number
  userGrowth: number
  transactionGrowth: number
  topCategories: Array<{
    category: string
    count: number
    revenue: number
  }>
  revenueByMonth: Array<{
    month: string
    revenue: number
    transactions: number
  }>
  usersByMonth: Array<{
    month: string
    buyers: number
    sellers: number
  }>
  popularIdeas: Array<{
    id: string
    title: string
    views: number
    purchases: number
    revenue: number
  }>
  sellerPerformance: Array<{
    sellerId: string
    sellerName: string
    ideasCount: number
    totalRevenue: number
    averageRating: number
  }>
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'users' | 'transactions'>('revenue')

  const supabase = createClient()

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)

      // 날짜 범위 계산
      const endDate = new Date()
      const startDate = new Date()
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7)
          break
        case '30d':
          startDate.setDate(endDate.getDate() - 30)
          break
        case '90d':
          startDate.setDate(endDate.getDate() - 90)
          break
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1)
          break
      }

      // 병렬로 데이터 가져오기
      const [
        revenueData,
        usersData,
        transactionsData,
        ratingsData,
        categoriesData,
        monthlyRevenueData,
        monthlyUsersData,
        popularIdeasData,
        sellerPerformanceData
      ] = await Promise.all([
        // 총 수익
        supabase
          .from('transactions')
          .select('amount, created_at')
          .eq('status', 'completed')
          .gte('created_at', startDate.toISOString()),

        // 사용자 통계
        supabase
          .from('users')
          .select('id, user_type, created_at')
          .gte('created_at', startDate.toISOString()),

        // 거래 통계
        supabase
          .from('transactions')
          .select('id, status, created_at')
          .gte('created_at', startDate.toISOString()),

        // 평점 통계
        supabase
          .from('reviews')
          .select('rating')
          .gte('created_at', startDate.toISOString()),

        // 카테고리별 통계
        supabase
          .from('ideas')
          .select(`
            category,
            price,
            purchase_count,
            transactions!inner(amount, status)
          `)
          .eq('status', 'active'),

        // 월별 수익 데이터
        supabase
          .from('transactions')
          .select('amount, created_at')
          .eq('status', 'completed')
          .gte('created_at', new Date(endDate.getFullYear() - 1, endDate.getMonth(), 1).toISOString())
          .order('created_at'),

        // 월별 사용자 데이터
        supabase
          .from('users')
          .select('user_type, created_at')
          .gte('created_at', new Date(endDate.getFullYear() - 1, endDate.getMonth(), 1).toISOString())
          .order('created_at'),

        // 인기 아이디어
        supabase
          .from('ideas')
          .select(`
            id,
            title,
            view_count,
            purchase_count,
            price,
            transactions!inner(amount, status)
          `)
          .eq('status', 'active')
          .order('view_count', { ascending: false })
          .limit(10),

        // 판매자 성과
        supabase
          .from('ideas')
          .select(`
            seller_id,
            price,
            users:seller_id(full_name),
            transactions!inner(amount, status),
            reviews(rating)
          `)
          .eq('status', 'active')
      ])

      // 데이터 처리
      const processedData = processAnalyticsData({
        revenueData: revenueData.data || [],
        usersData: usersData.data || [],
        transactionsData: transactionsData.data || [],
        ratingsData: ratingsData.data || [],
        categoriesData: categoriesData.data || [],
        monthlyRevenueData: monthlyRevenueData.data || [],
        monthlyUsersData: monthlyUsersData.data || [],
        popularIdeasData: popularIdeasData.data || [],
        sellerPerformanceData: sellerPerformanceData.data || [],
        timeRange
      })

      setData(processedData)

    } catch (error) {
      console.error('Analytics data fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const processAnalyticsData = (rawData: any): AnalyticsData => {
    const { revenueData, usersData, transactionsData, ratingsData } = rawData

    // 기본 통계 계산
    const totalRevenue = revenueData.reduce((sum: number, t: any) => sum + (t.amount || 0), 0)
    const totalUsers = usersData.length
    const totalTransactions = transactionsData.filter((t: any) => t.status === 'completed').length
    const averageRating = ratingsData.length > 0 
      ? ratingsData.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / ratingsData.length 
      : 0

    // 성장률 계산 (이전 기간 대비)
    const revenueGrowth = calculateGrowthRate(revenueData, 'amount')
    const userGrowth = calculateGrowthRate(usersData, 'count')
    const transactionGrowth = calculateGrowthRate(transactionsData.filter((t: any) => t.status === 'completed'), 'count')

    // 카테고리별 데이터 처리
    const categoryStats = new Map()
    rawData.categoriesData.forEach((idea: any) => {
      const category = idea.category
      const revenue = idea.transactions
        .filter((t: any) => t.status === 'completed')
        .reduce((sum: number, t: any) => sum + (t.amount || 0), 0)
      
      if (categoryStats.has(category)) {
        const existing = categoryStats.get(category)
        categoryStats.set(category, {
          count: existing.count + 1,
          revenue: existing.revenue + revenue
        })
      } else {
        categoryStats.set(category, { count: 1, revenue })
      }
    })

    const topCategories = Array.from(categoryStats.entries())
      .map(([category, stats]) => ({
        category,
        count: stats.count,
        revenue: stats.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // 월별 수익 데이터
    const revenueByMonth = processMonthlyData(rawData.monthlyRevenueData, 'revenue')
    const usersByMonth = processMonthlyUserData(rawData.monthlyUsersData)

    // 인기 아이디어 처리
    const popularIdeas = rawData.popularIdeasData.map((idea: any) => ({
      id: idea.id,
      title: idea.title,
      views: idea.view_count || 0,
      purchases: idea.purchase_count || 0,
      revenue: idea.transactions
        .filter((t: any) => t.status === 'completed')
        .reduce((sum: number, t: any) => sum + (t.amount || 0), 0)
    }))

    // 판매자 성과 처리
    const sellerStats = new Map()
    rawData.sellerPerformanceData.forEach((idea: any) => {
      const sellerId = idea.seller_id
      const sellerName = Array.isArray(idea.users) ? idea.users[0]?.full_name : idea.users?.full_name
      const revenue = idea.transactions
        .filter((t: any) => t.status === 'completed')
        .reduce((sum: number, t: any) => sum + (t.amount || 0), 0)
      const ratings = Array.isArray(idea.reviews) ? idea.reviews : []
      const avgRating = ratings.length > 0 
        ? ratings.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / ratings.length 
        : 0

      if (sellerStats.has(sellerId)) {
        const existing = sellerStats.get(sellerId)
        sellerStats.set(sellerId, {
          sellerName: existing.sellerName || sellerName,
          ideasCount: existing.ideasCount + 1,
          totalRevenue: existing.totalRevenue + revenue,
          averageRating: (existing.averageRating + avgRating) / 2
        })
      } else {
        sellerStats.set(sellerId, {
          sellerName: sellerName || '익명',
          ideasCount: 1,
          totalRevenue: revenue,
          averageRating: avgRating
        })
      }
    })

    const sellerPerformance = Array.from(sellerStats.entries())
      .map(([sellerId, stats]) => ({
        sellerId,
        ...stats
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10)

    return {
      totalRevenue,
      totalUsers,
      totalTransactions,
      averageRating,
      revenueGrowth,
      userGrowth,
      transactionGrowth,
      topCategories,
      revenueByMonth,
      usersByMonth,
      popularIdeas,
      sellerPerformance
    }
  }

  const calculateGrowthRate = (data: any[], field: string) => {
    if (data.length === 0) return 0
    
    const midPoint = Math.floor(data.length / 2)
    const firstHalf = data.slice(0, midPoint)
    const secondHalf = data.slice(midPoint)
    
    const firstHalfValue = field === 'count' 
      ? firstHalf.length 
      : firstHalf.reduce((sum, item) => sum + (item[field] || 0), 0)
    
    const secondHalfValue = field === 'count'
      ? secondHalf.length
      : secondHalf.reduce((sum, item) => sum + (item[field] || 0), 0)
    
    if (firstHalfValue === 0) return secondHalfValue > 0 ? 100 : 0
    
    return ((secondHalfValue - firstHalfValue) / firstHalfValue) * 100
  }

  const processMonthlyData = (data: any[], type: 'revenue' | 'transactions') => {
    const monthlyStats = new Map()
    
    data.forEach(item => {
      const date = new Date(item.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (monthlyStats.has(monthKey)) {
        const existing = monthlyStats.get(monthKey)
        monthlyStats.set(monthKey, {
          month: monthKey,
          revenue: existing.revenue + (item.amount || 0),
          transactions: existing.transactions + 1
        })
      } else {
        monthlyStats.set(monthKey, {
          month: monthKey,
          revenue: item.amount || 0,
          transactions: 1
        })
      }
    })

    return Array.from(monthlyStats.values()).sort((a, b) => a.month.localeCompare(b.month))
  }

  const processMonthlyUserData = (data: any[]) => {
    const monthlyStats = new Map()
    
    data.forEach(user => {
      const date = new Date(user.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (monthlyStats.has(monthKey)) {
        const existing = monthlyStats.get(monthKey)
        monthlyStats.set(monthKey, {
          month: monthKey,
          buyers: existing.buyers + (user.user_type === 'buyer' || user.user_type === 'both' ? 1 : 0),
          sellers: existing.sellers + (user.user_type === 'seller' || user.user_type === 'both' ? 1 : 0)
        })
      } else {
        monthlyStats.set(monthKey, {
          month: monthKey,
          buyers: user.user_type === 'buyer' || user.user_type === 'both' ? 1 : 0,
          sellers: user.user_type === 'seller' || user.user_type === 'both' ? 1 : 0
        })
      }
    })

    return Array.from(monthlyStats.values()).sort((a, b) => a.month.localeCompare(b.month))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num)
  }

  const formatGrowth = (growth: number) => {
    const formatted = Math.abs(growth).toFixed(1)
    return growth >= 0 ? `+${formatted}%` : `-${formatted}%`
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">분석 데이터를 불러올 수 없습니다.</p>
        <Button onClick={fetchAnalyticsData} className="mt-4">
          다시 시도
        </Button>
      </div>
    )
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

  return (
    <div className="space-y-6">
      {/* 시간 범위 선택 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">분석 대시보드</h2>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <div className="flex rounded-lg border">
            {[
              { key: '7d', label: '7일' },
              { key: '30d', label: '30일' },
              { key: '90d', label: '90일' },
              { key: '1y', label: '1년' }
            ].map(range => (
              <Button
                key={range.key}
                variant={timeRange === range.key ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange(range.key as any)}
                className="rounded-none first:rounded-l-lg last:rounded-r-lg"
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* 주요 메트릭 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 수익</p>
                <p className="text-2xl font-bold">{formatCurrency(data.totalRevenue)}</p>
                <div className="flex items-center mt-1">
                  {data.revenueGrowth >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${data.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatGrowth(data.revenueGrowth)}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 사용자</p>
                <p className="text-2xl font-bold">{formatNumber(data.totalUsers)}</p>
                <div className="flex items-center mt-1">
                  {data.userGrowth >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${data.userGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatGrowth(data.userGrowth)}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 거래</p>
                <p className="text-2xl font-bold">{formatNumber(data.totalTransactions)}</p>
                <div className="flex items-center mt-1">
                  {data.transactionGrowth >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${data.transactionGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatGrowth(data.transactionGrowth)}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <ShoppingCart className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">평균 평점</p>
                <p className="text-2xl font-bold">{data.averageRating.toFixed(1)}</p>
                <div className="flex items-center mt-1">
                  <Star className="w-4 h-4 text-yellow-500 mr-1" />
                  <span className="text-sm text-gray-600">5점 만점</span>
                </div>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 월별 수익 차트 */}
        <Card>
          <CardHeader>
            <CardTitle>월별 수익 추이</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), '수익']}
                  labelFormatter={(label) => `${label}월`}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 월별 사용자 차트 */}
        <Card>
          <CardHeader>
            <CardTitle>월별 사용자 증가</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.usersByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  labelFormatter={(label) => `${label}월`}
                />
                <Line 
                  type="monotone" 
                  dataKey="buyers" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="구매자"
                />
                <Line 
                  type="monotone" 
                  dataKey="sellers" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  name="판매자"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 하단 통계 테이블 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 인기 아이디어 */}
        <Card>
          <CardHeader>
            <CardTitle>인기 아이디어 TOP 10</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.popularIdeas.map((idea, index) => (
                <div key={idea.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <div>
                      <p className="font-medium text-sm">{idea.title}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {formatNumber(idea.views)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {formatNumber(idea.purchases)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{formatCurrency(idea.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 카테고리별 통계 */}
        <Card>
          <CardHeader>
            <CardTitle>카테고리별 성과</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topCategories.map((category, index) => (
                <div key={category.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div>
                      <p className="font-medium text-sm">{category.category}</p>
                      <p className="text-xs text-gray-600">{formatNumber(category.count)}개 아이디어</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{formatCurrency(category.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}