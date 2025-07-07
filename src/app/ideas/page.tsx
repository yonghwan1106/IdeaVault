'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import { IDEA_CATEGORIES, PACKAGE_TYPES } from '@/lib/categories'
import { 
  Search, 
  Star, 
  Eye, 
  Grid,
  List
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import RecommendedIdeas from '@/components/ui/RecommendedIdeas'
import AdvancedSearch, { AdvancedSearchFilters } from '@/components/ui/AdvancedSearch'
import { useAuth } from '@/contexts/AuthContext'

interface Idea {
  id: string
  title: string
  description: string
  category: string
  package_type: 'idea' | 'mvp' | 'launch_kit'
  price: number
  implementation_difficulty: number
  tech_stack: string[]
  view_count: number
  created_at: string
  seller: {
    full_name: string
    avatar_url: string
  }
}

interface IdeaWithUser {
  id: string
  title: string
  description: string
  category: string
  package_type: 'idea' | 'mvp' | 'launch_kit'
  price: number
  implementation_difficulty: number
  tech_stack: string[]
  view_count: number
  created_at: string
  revenue_model: string
  rating: number
  users: Array<{
    full_name: string
    avatar_url: string
    verified: boolean
  }>
}

export default function IdeasPage() {
  const { user } = useAuth()
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [, setCurrentFilters] = useState<AdvancedSearchFilters | null>(null)

  const supabase = createClient()

  const fetchIdeas = useCallback(async (filters?: AdvancedSearchFilters) => {
    setLoading(true)
    try {
      let query = supabase
        .from('ideas')
        .select('*')
        .eq('status', 'active')
        .eq('validation_status', 'approved')

      if (filters) {
        // Text search
        if (filters.query) {
          query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`)
        }

        // Categories
        if (filters.categories.length > 0) {
          query = query.in('category', filters.categories)
        }

        // Package types
        if (filters.packageTypes.length > 0) {
          query = query.in('package_type', filters.packageTypes)
        }

        // Price range
        if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000000) {
          query = query.gte('price', filters.priceRange[0]).lte('price', filters.priceRange[1])
        }

        // Tech stack - filter ideas that contain any of the selected technologies
        if (filters.techStack.length > 0) {
          const techStackFilters = filters.techStack.map(tech => `tech_stack.cs.{${tech}}`).join(',')
          query = query.or(techStackFilters)
        }

        // Difficulty range
        if (filters.difficultyRange[0] > 1 || filters.difficultyRange[1] < 5) {
          query = query.gte('implementation_difficulty', filters.difficultyRange[0])
                      .lte('implementation_difficulty', filters.difficultyRange[1])
        }

        // Revenue models
        if (filters.revenueModels.length > 0) {
          const revenueFilters = filters.revenueModels.map(model => `revenue_model.ilike.%${model}%`).join(',')
          query = query.or(revenueFilters)
        }

        // Minimum rating
        if (filters.minRating > 0) {
          query = query.gte('rating', filters.minRating)
        }

        // Minimum views
        if (filters.minViews > 0) {
          query = query.gte('view_count', filters.minViews)
        }

        // Verified seller filter - handled separately after getting sellers data
        // if (filters.isVerified) {
        //   query = query.eq('users.verified', true)
        // }

        // Date filter (maxAge in days)
        if (filters.maxAge < 365) {
          const cutoffDate = new Date()
          cutoffDate.setDate(cutoffDate.getDate() - filters.maxAge)
          query = query.gte('created_at', cutoffDate.toISOString())
        }

        // Sorting
        const isAscending = filters.sortOrder === 'asc'
        query = query.order(filters.sortBy, { ascending: isAscending })
      } else {
        // Default sorting
        query = query.order('created_at', { ascending: false })
      }

      const { data: ideasData, error } = await query

      if (error) {
        console.error('Error fetching ideas:', error)
        return
      }

      if (!ideasData || ideasData.length === 0) {
        setIdeas([])
        return
      }

      // Transform the data with dummy seller info for now
      const transformedData = ideasData.map((idea: any) => ({
        ...idea,
        seller: {
          full_name: 'Test Seller',
          avatar_url: 'https://ui-avatars.com/api/?name=Test+Seller&background=3b82f6&color=ffffff',
          verified: true
        }
      }))

      setIdeas(transformedData)
    } catch (error) {
      console.error('Error fetching ideas:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchIdeas()
  }, [fetchIdeas])

  const handleAdvancedSearch = (filters: AdvancedSearchFilters) => {
    setCurrentFilters(filters)
    fetchIdeas(filters)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-full mb-4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
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
              <h1 className="text-3xl font-bold text-gray-900">아이디어 탐색</h1>
              <p className="mt-1 text-gray-600">
                검증된 마이크로 SaaS 아이디어를 찾아보세요
              </p>
            </div>
            <Link
              href="/ideas/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              아이디어 등록
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Recommended Ideas - Temporarily disabled 
        {user && (
          <div className="mb-8">
            <RecommendedIdeas
              title="당신을 위한 추천 아이디어"
              limit={3}
              excludeIds={ideas.map(idea => idea.id)}
              className=""
            />
          </div>
        )} */}

        {/* Advanced Search - Temporarily disabled */}
        {/* <div className="mb-8">
          <AdvancedSearch 
            onSearch={handleAdvancedSearch}
            loading={loading}
          />
        </div> */}

        {/* Results Header */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-gray-600">
            총 {ideas.length}개의 아이디어를 찾았습니다
          </p>
          
          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 border-l border-gray-300 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Ideas Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ideas.map((idea) => (
              <Link key={idea.id} href={`/ideas/${idea.id}`}>
                <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getCategoryLabel(idea.category)}
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        {formatPrice(idea.price)}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {idea.title}
                    </h3>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {idea.description}
                    </p>

                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                        {getPackageTypeLabel(idea.package_type)}
                      </span>
                      <div className="flex items-center">
                        {getDifficultyStars(idea.implementation_difficulty)}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {idea.tech_stack?.slice(0, 3).map((tech: string) => (
                        <span
                          key={tech}
                          className="inline-flex items-center px-2 py-1 rounded text-xs bg-purple-100 text-purple-800"
                        >
                          {tech}
                        </span>
                      ))}
                      {idea.tech_stack?.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
                          +{idea.tech_stack.length - 3}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <div className="flex items-center space-x-2">
                        <Image
                          src={idea.seller?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(idea.seller?.full_name || 'User')}&background=3b82f6&color=ffffff`}
                          alt={`${idea.seller?.full_name || 'User'}의 프로필 사진`}
                          width={24}
                          height={24}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="text-sm text-gray-600 truncate">
                          {idea.seller?.full_name}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Eye className="h-4 w-4 mr-1" />
                        {idea.view_count}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {ideas.map((idea) => (
              <Link key={idea.id} href={`/ideas/${idea.id}`}>
                <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getCategoryLabel(idea.category)}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                          {getPackageTypeLabel(idea.package_type)}
                        </span>
                        <div className="flex items-center">
                          {getDifficultyStars(idea.implementation_difficulty)}
                        </div>
                      </div>

                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {idea.title}
                      </h3>

                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {idea.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {idea.tech_stack?.slice(0, 5).map((tech: string) => (
                            <span
                              key={tech}
                              className="inline-flex items-center px-2 py-1 rounded text-xs bg-purple-100 text-purple-800"
                            >
                              {tech}
                            </span>
                          ))}
                          {idea.tech_stack?.length > 5 && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
                              +{idea.tech_stack.length - 5}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Image
                              src={idea.seller?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(idea.seller?.full_name || 'User')}&background=3b82f6&color=ffffff`}
                              alt={`${idea.seller?.full_name || 'User'}의 프로필 사진`}
                              width={24}
                              height={24}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                            <span className="text-sm text-gray-600">
                              {idea.seller?.full_name}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Eye className="h-4 w-4 mr-1" />
                            {idea.view_count}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="ml-6 text-right">
                      <span className="text-2xl font-bold text-green-600">
                        {formatPrice(idea.price)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {ideas.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              검색 결과가 없습니다
            </h3>
            <p className="text-gray-600 mb-4">
              다른 검색어나 필터를 시도해보세요.
            </p>
            <button
              onClick={() => {
                setCurrentFilters(null)
                fetchIdeas()
              }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              모든 아이디어 보기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}