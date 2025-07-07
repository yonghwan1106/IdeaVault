'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { createClient } from '@/lib/supabase-client'
import toast from 'react-hot-toast'
import { 
  IDEA_CATEGORIES, 
  PACKAGE_TYPES, 
  TECH_STACK_OPTIONS, 
  REVENUE_MODELS,
  DIFFICULTY_LEVELS,
  MARKET_SIZES
} from '@/lib/categories'
import { 
  Save, 
  X, 
  Plus,
  FileText,
  DollarSign,
  Target,
  Code,
  TrendingUp,
  Users,
  Clock,
  Star
} from 'lucide-react'

interface IdeaFormData {
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
}

export default function NewIdeaPage() {
  const { user, userProfile } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<IdeaFormData>({
    title: '',
    description: '',
    category: '',
    package_type: 'idea',
    price: 100000,
    target_audience: '',
    revenue_model: '',
    implementation_difficulty: 3,
    estimated_dev_time: '',
    tech_stack: [],
    market_size: '',
    preview_content: '',
    full_content: '',
    seo_keywords: []
  })

  const [newTechStack, setNewTechStack] = useState('')
  const [newKeyword, setNewKeyword] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }))
  }

  const handleTechStackAdd = (tech: string) => {
    if (!formData.tech_stack.includes(tech)) {
      setFormData(prev => ({
        ...prev,
        tech_stack: [...prev.tech_stack, tech]
      }))
    }
  }

  const handleTechStackRemove = (tech: string) => {
    setFormData(prev => ({
      ...prev,
      tech_stack: prev.tech_stack.filter(t => t !== tech)
    }))
  }

  const handleKeywordAdd = (keyword: string) => {
    if (keyword.trim() && !formData.seo_keywords.includes(keyword.trim())) {
      setFormData(prev => ({
        ...prev,
        seo_keywords: [...prev.seo_keywords, keyword.trim()]
      }))
    }
  }

  const handleKeywordRemove = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      seo_keywords: prev.seo_keywords.filter(k => k !== keyword)
    }))
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.title && formData.description && formData.category && formData.package_type)
      case 2:
        return !!(formData.price && formData.target_audience && formData.revenue_model && formData.market_size)
      case 3:
        return !!(formData.estimated_dev_time && formData.tech_stack.length > 0)
      case 4:
        return !!(formData.preview_content && formData.full_content)
      default:
        return false
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1)
    } else {
      toast.error('모든 필수 항목을 입력해주세요.')
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1)
  }

  const handleSubmit = async (status: 'draft' | 'active' = 'draft') => {
    if (!user || !userProfile) {
      toast.error('로그인이 필요합니다.')
      return
    }

    if (userProfile.user_type === 'buyer') {
      toast.error('판매자 권한이 필요합니다. 프로필에서 사용자 유형을 변경해주세요.')
      return
    }

    setLoading(true)

    try {
      const ideaData = {
        ...formData,
        seller_id: user.id,
        status,
        validation_status: 'pending',
        published_at: status === 'active' ? new Date().toISOString() : null
      }

      const { error } = await supabase
        .from('ideas')
        .insert([ideaData])
        .select()
        .single()

      if (error) {
        console.error('Database error:', error)
        toast.error('아이디어 저장에 실패했습니다.')
        return
      }

      toast.success(status === 'draft' ? '임시저장되었습니다.' : '아이디어가 등록되었습니다!')
      router.push('/dashboard/my-ideas')
    } catch (error) {
      console.error('Error saving idea:', error)
      toast.error('아이디어 저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const selectedPackageType = PACKAGE_TYPES.find(p => p.value === formData.package_type)

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">새 아이디어 등록</h1>
          <p className="mt-2 text-gray-600">
            검증된 아이디어를 다른 개발자들과 공유하고 수익을 창출하세요.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  step <= currentStep 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'border-gray-300 text-gray-300'
                }`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`w-20 h-1 mx-2 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>기본 정보</span>
            <span>시장 정보</span>
            <span>기술 정보</span>
            <span>콘텐츠</span>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  기본 정보
                </h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  아이디어 제목 *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: AI 기반 일정 관리 SaaS"
                  maxLength={200}
                />
                <p className="mt-1 text-xs text-gray-500">{formData.title.length}/200</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  아이디어 설명 *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="아이디어의 핵심 내용과 해결하고자 하는 문제를 설명해주세요..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    카테고리 *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">카테고리 선택</option>
                    {IDEA_CATEGORIES.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    패키지 유형 *
                  </label>
                  <select
                    name="package_type"
                    value={formData.package_type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {PACKAGE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedPackageType && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">{selectedPackageType.label}</h4>
                  <p className="text-blue-700 text-sm mb-3">{selectedPackageType.description}</p>
                  <p className="text-blue-600 font-medium mb-2">가격 범위: {selectedPackageType.priceRange}</p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {selectedPackageType.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <div className="w-1 h-1 bg-blue-600 rounded-full mr-2"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Market Information */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  시장 및 비즈니스 정보
                </h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="inline h-4 w-4 mr-1" />
                  가격 (원) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="50000"
                  max="1000000"
                  step="10000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  권장 가격: {selectedPackageType?.priceRange}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Target className="inline h-4 w-4 mr-1" />
                  타겟 고객 *
                </label>
                <textarea
                  name="target_audience"
                  value={formData.target_audience}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: 소규모 팀의 프로젝트 관리자, 프리랜서 개발자..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    수익 모델 *
                  </label>
                  <select
                    name="revenue_model"
                    value={formData.revenue_model}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">수익 모델 선택</option>
                    {REVENUE_MODELS.map((model) => (
                      <option key={model.value} value={model.value}>
                        {model.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="inline h-4 w-4 mr-1" />
                    시장 규모 *
                  </label>
                  <select
                    name="market_size"
                    value={formData.market_size}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">시장 규모 선택</option>
                    {MARKET_SIZES.map((size) => (
                      <option key={size.value} value={size.value}>
                        {size.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Technical Information */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Code className="h-5 w-5 mr-2" />
                  기술 및 구현 정보
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Star className="inline h-4 w-4 mr-1" />
                    구현 난이도 *
                  </label>
                  <select
                    name="implementation_difficulty"
                    value={formData.implementation_difficulty}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {DIFFICULTY_LEVELS.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.value}. {level.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    {DIFFICULTY_LEVELS.find(l => l.value === formData.implementation_difficulty)?.description}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline h-4 w-4 mr-1" />
                    예상 개발 기간 *
                  </label>
                  <input
                    type="text"
                    name="estimated_dev_time"
                    value={formData.estimated_dev_time}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="예: 2-3주, 1-2개월"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  기술 스택 *
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.tech_stack.map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {tech}
                      <button
                        type="button"
                        onClick={() => handleTechStackRemove(tech)}
                        className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:text-blue-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  {TECH_STACK_OPTIONS.filter(tech => !formData.tech_stack.includes(tech)).slice(0, 20).map((tech) => (
                    <button
                      key={tech}
                      type="button"
                      onClick={() => handleTechStackAdd(tech)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 text-left"
                    >
                      {tech}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTechStack}
                    onChange={(e) => setNewTechStack(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (newTechStack.trim()) {
                          handleTechStackAdd(newTechStack.trim())
                          setNewTechStack('')
                        }
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="커스텀 기술 추가..."
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newTechStack.trim()) {
                        handleTechStackAdd(newTechStack.trim())
                        setNewTechStack('')
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Content */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  콘텐츠 작성
                </h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  미리보기 콘텐츠 *
                </label>
                <textarea
                  name="preview_content"
                  value={formData.preview_content}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="구매 전 사용자가 볼 수 있는 내용입니다. 아이디어의 핵심만 간략히 설명하세요..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  구매하지 않은 사용자도 볼 수 있는 내용입니다.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  전체 콘텐츠 *
                </label>
                <textarea
                  name="full_content"
                  value={formData.full_content}
                  onChange={handleChange}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="구매 후 제공되는 상세한 내용을 작성하세요. 구현 가이드, 시장 분석, 수익화 전략 등을 포함하세요..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  구매한 사용자만 볼 수 있는 상세한 내용입니다.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SEO 키워드
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.seo_keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() => handleKeywordRemove(keyword)}
                        className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-400 hover:text-green-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (newKeyword.trim()) {
                          handleKeywordAdd(newKeyword.trim())
                          setNewKeyword('')
                        }
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="검색을 위한 키워드 추가..."
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newKeyword.trim()) {
                        handleKeywordAdd(newKeyword.trim())
                        setNewKeyword('')
                      }
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  이전
                </button>
              )}
            </div>

            <div className="flex gap-3">
              {currentStep === 4 ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleSubmit('draft')}
                    disabled={loading}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4 mr-2 inline" />
                    임시저장
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmit('active')}
                    disabled={loading || !validateStep(4)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? '등록 중...' : '등록하기'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!validateStep(currentStep)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  다음
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}