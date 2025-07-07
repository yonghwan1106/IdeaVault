'use client'

import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { 
  TrendingUp, 
  ShoppingCart, 
  Lightbulb, 
  DollarSign,
  Eye,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

const stats = [
  { 
    name: '총 수익', 
    value: '₩2,450,000', 
    change: '+12%', 
    changeType: 'positive', 
    icon: DollarSign 
  },
  { 
    name: '판매된 아이디어', 
    value: '8', 
    change: '+2', 
    changeType: 'positive', 
    icon: Lightbulb 
  },
  { 
    name: '구매한 아이디어', 
    value: '12', 
    change: '+3', 
    changeType: 'positive', 
    icon: ShoppingCart 
  },
  { 
    name: '총 조회수', 
    value: '1,523', 
    change: '+8%', 
    changeType: 'positive', 
    icon: Eye 
  },
]

const recentActivities = [
  {
    id: 1,
    type: 'sale',
    title: 'AI 기반 일정 관리 SaaS',
    amount: '₩350,000',
    time: '2시간 전',
    buyer: '김개발자'
  },
  {
    id: 2,
    type: 'purchase',
    title: '소상공인 재고 관리 시스템',
    amount: '₩280,000',
    time: '1일 전',
    seller: '박창업자'
  },
  {
    id: 3,
    type: 'view',
    title: 'B2B 화상회의 도구',
    views: '45회',
    time: '2일 전'
  },
]

const trendingIdeas = [
  {
    id: 1,
    title: 'AI 콘텐츠 생성 도구',
    category: 'AI/ML',
    price: '₩450,000',
    views: 234,
    difficulty: 4
  },
  {
    id: 2,
    title: '소규모 팀 협업 플랫폼',
    category: '협업 도구',
    price: '₩320,000',
    views: 189,
    difficulty: 3
  },
  {
    id: 3,
    title: '개인 투자 분석 대시보드',
    category: '핀테크',
    price: '₩280,000',
    views: 156,
    difficulty: 3
  },
]

export default function DashboardPage() {
  const { userProfile } = useAuth()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome section */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            안녕하세요, {userProfile?.full_name || '사용자'}님! 👋
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            오늘도 멋진 아이디어를 발견하고 공유해보세요.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Icon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {stat.name}
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {stat.value}
                          </div>
                          <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                            stat.changeType === 'positive' 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {stat.changeType === 'positive' ? (
                              <ArrowUpRight className="self-center flex-shrink-0 h-4 w-4" />
                            ) : (
                              <ArrowDownRight className="self-center flex-shrink-0 h-4 w-4" />
                            )}
                            <span className="sr-only">
                              {stat.changeType === 'positive' ? 'Increased' : 'Decreased'} by
                            </span>
                            {stat.change}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                최근 활동
              </h3>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`flex-shrink-0 h-2 w-2 rounded-full ${
                        activity.type === 'sale' 
                          ? 'bg-green-400' 
                          : activity.type === 'purchase' 
                            ? 'bg-blue-400' 
                            : 'bg-gray-400'
                      }`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {activity.type === 'sale' && `${activity.buyer}님이 구매`}
                          {activity.type === 'purchase' && `${activity.seller}님으로부터 구매`}
                          {activity.type === 'view' && `${activity.views} 조회`}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.amount || activity.views}
                      </p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trending Ideas */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                인기 아이디어
              </h3>
              <div className="space-y-4">
                {trendingIdeas.map((idea) => (
                  <div key={idea.id} className="border-l-4 border-blue-400 pl-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {idea.title}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {idea.category}
                          </span>
                          <div className="flex items-center text-xs text-gray-500">
                            <Eye className="h-3 w-3 mr-1" />
                            {idea.views}
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            난이도: {idea.difficulty}/5
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {idea.price}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              빠른 작업
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button className="flex items-center justify-center px-4 py-6 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                <div className="text-center">
                  <Lightbulb className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-blue-900">
                    새 아이디어 등록
                  </p>
                </div>
              </button>
              
              <button className="flex items-center justify-center px-4 py-6 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-900">
                    판매 분석 보기
                  </p>
                </div>
              </button>
              
              <button className="flex items-center justify-center px-4 py-6 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
                <div className="text-center">
                  <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-purple-900">
                    대기 중인 작업
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}