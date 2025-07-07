'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { IDEA_CATEGORIES, PACKAGE_TYPES, TECH_STACK_OPTIONS, REVENUE_MODEL_LABELS } from '@/lib/categories'
import { 
  Search, 
  X, 
  ChevronDown, 
  ChevronUp,
  RotateCcw
} from 'lucide-react'

export interface AdvancedSearchFilters {
  query: string
  categories: string[]
  packageTypes: string[]
  priceRange: [number, number]
  techStack: string[]
  difficultyRange: [number, number]
  revenueModels: string[]
  hasFiles: boolean
  isVerified: boolean
  minRating: number
  sortBy: 'created_at' | 'price' | 'rating' | 'view_count' | 'purchase_count'
  sortOrder: 'asc' | 'desc'
  minViews: number
  maxAge: number // 일 단위
}

interface AdvancedSearchProps {
  onSearch: (filters: AdvancedSearchFilters) => void
  initialFilters?: Partial<AdvancedSearchFilters>
  loading?: boolean
}

const DEFAULT_FILTERS: AdvancedSearchFilters = {
  query: '',
  categories: [],
  packageTypes: [],
  priceRange: [0, 1000000],
  techStack: [],
  difficultyRange: [1, 5],
  revenueModels: [],
  hasFiles: false,
  isVerified: false,
  minRating: 0,
  sortBy: 'created_at',
  sortOrder: 'desc',
  minViews: 0,
  maxAge: 365
}

export default function AdvancedSearch({ 
  onSearch, 
  initialFilters = {}, 
  loading = false 
}: AdvancedSearchProps) {
  const [filters, setFilters] = useState<AdvancedSearchFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters
  })
  
  const [isExpanded, setIsExpanded] = useState(false)
  const [showTechStack, setShowTechStack] = useState(false)
  const [showRevenueModels, setShowRevenueModels] = useState(false)

  useEffect(() => {
    if (Object.keys(initialFilters).length > 0) {
      setFilters(prev => ({ ...prev, ...initialFilters }))
    }
  }, [initialFilters])

  const handleFilterChange = (key: keyof AdvancedSearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleArrayToggle = (key: keyof AdvancedSearchFilters, value: string) => {
    setFilters(prev => {
      const currentArray = prev[key] as string[]
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value]
      
      return {
        ...prev,
        [key]: newArray
      }
    })
  }

  const handleSearch = () => {
    onSearch(filters)
  }

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS)
    onSearch(DEFAULT_FILTERS)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0
    }).format(price)
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.query) count++
    if (filters.categories.length > 0) count++
    if (filters.packageTypes.length > 0) count++
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000000) count++
    if (filters.techStack.length > 0) count++
    if (filters.difficultyRange[0] > 1 || filters.difficultyRange[1] < 5) count++
    if (filters.revenueModels.length > 0) count++
    if (filters.hasFiles) count++
    if (filters.isVerified) count++
    if (filters.minRating > 0) count++
    if (filters.minViews > 0) count++
    if (filters.maxAge < 365) count++
    return count
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            고급 검색
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary">
                {getActiveFiltersCount()}개 필터 적용
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                접기 <ChevronUp className="w-4 h-4 ml-1" />
              </>
            ) : (
              <>
                필터 <ChevronDown className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 기본 검색 */}
        <div className="space-y-2">
          <Label htmlFor="search-query">검색어</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="search-query"
              placeholder="아이디어 제목, 설명, 키워드 검색..."
              value={filters.query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('query', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* 확장 필터 */}
        {isExpanded && (
          <div className="space-y-6">
            {/* 카테고리 선택 */}
            <div className="space-y-3">
              <Label>카테고리</Label>
              <div className="flex flex-wrap gap-2">
                {IDEA_CATEGORIES.map(category => (
                  <Button
                    key={category.value}
                    variant={filters.categories.includes(category.value) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleArrayToggle('categories', category.value)}
                  >
                    {category.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* 패키지 타입 */}
            <div className="space-y-3">
              <Label>패키지 타입</Label>
              <div className="flex flex-wrap gap-2">
                {PACKAGE_TYPES.map(type => (
                  <Button
                    key={type.value}
                    variant={filters.packageTypes.includes(type.value) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleArrayToggle('packageTypes', type.value)}
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* 가격 범위 */}
            <div className="space-y-3">
              <Label>가격 범위</Label>
              <div className="px-3">
                <Slider
                  value={filters.priceRange}
                  onValueChange={(value: number[]) => handleFilterChange('priceRange', value)}
                  max={1000000}
                  min={0}
                  step={10000}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>{formatPrice(filters.priceRange[0])}</span>
                  <span>{formatPrice(filters.priceRange[1])}</span>
                </div>
              </div>
            </div>

            {/* 기술 스택 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>기술 스택</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTechStack(!showTechStack)}
                >
                  {showTechStack ? '접기' : '더보기'}
                  {showTechStack ? (
                    <ChevronUp className="w-4 h-4 ml-1" />
                  ) : (
                    <ChevronDown className="w-4 h-4 ml-1" />
                  )}
                </Button>
              </div>
              <div className={`flex flex-wrap gap-2 ${showTechStack ? '' : 'max-h-20 overflow-hidden'}`}>
                {TECH_STACK_OPTIONS.slice(0, showTechStack ? undefined : 15).map(tech => (
                  <Button
                    key={tech}
                    variant={filters.techStack.includes(tech) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleArrayToggle('techStack', tech)}
                  >
                    {tech}
                  </Button>
                ))}
              </div>
            </div>

            {/* 난이도 범위 */}
            <div className="space-y-3">
              <Label>구현 난이도</Label>
              <div className="px-3">
                <Slider
                  value={filters.difficultyRange}
                  onValueChange={(value: number[]) => handleFilterChange('difficultyRange', value)}
                  max={5}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>쉬움 ({filters.difficultyRange[0]})</span>
                  <span>어려움 ({filters.difficultyRange[1]})</span>
                </div>
              </div>
            </div>

            {/* 수익 모델 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>수익 모델</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRevenueModels(!showRevenueModels)}
                >
                  {showRevenueModels ? '접기' : '더보기'}
                  {showRevenueModels ? (
                    <ChevronUp className="w-4 h-4 ml-1" />
                  ) : (
                    <ChevronDown className="w-4 h-4 ml-1" />
                  )}
                </Button>
              </div>
              <div className={`flex flex-wrap gap-2 ${showRevenueModels ? '' : 'max-h-20 overflow-hidden'}`}>
                {REVENUE_MODEL_LABELS.slice(0, showRevenueModels ? undefined : 8).map((model: string) => (
                  <Button
                    key={model}
                    variant={filters.revenueModels.includes(model) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleArrayToggle('revenueModels', model)}
                  >
                    {model}
                  </Button>
                ))}
              </div>
            </div>

            {/* 품질 필터 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label>최소 평점</Label>
                <div className="px-3">
                  <Slider
                    value={[filters.minRating]}
                    onValueChange={(value: number[]) => handleFilterChange('minRating', value[0])}
                    max={5}
                    min={0}
                    step={0.5}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-600 mt-1">
                    {filters.minRating}점 이상
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label>최소 조회수</Label>
                <Input
                  type="number"
                  value={filters.minViews}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('minViews', parseInt(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            {/* 옵션 스위치 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="has-files">파일 포함</Label>
                <Switch
                  id="has-files"
                  checked={filters.hasFiles}
                  onCheckedChange={(checked: boolean) => handleFilterChange('hasFiles', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is-verified">검증된 판매자</Label>
                <Switch
                  id="is-verified"
                  checked={filters.isVerified}
                  onCheckedChange={(checked: boolean) => handleFilterChange('isVerified', checked)}
                />
              </div>
            </div>

            {/* 날짜 및 정렬 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>최근 게시일</Label>
                <select
                  value={filters.maxAge}
                  onChange={(e) => handleFilterChange('maxAge', parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value={365}>전체</option>
                  <option value={7}>1주일 이내</option>
                  <option value={30}>1개월 이내</option>
                  <option value={90}>3개월 이내</option>
                  <option value={180}>6개월 이내</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>정렬 기준</Label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="created_at">등록일</option>
                  <option value="price">가격</option>
                  <option value="rating">평점</option>
                  <option value="view_count">조회수</option>
                  <option value="purchase_count">구매수</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>정렬 순서</Label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="desc">내림차순</option>
                  <option value="asc">오름차순</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex gap-3 pt-4 border-t">
          <Button 
            onClick={handleSearch} 
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                검색 중...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                검색
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleReset}
            disabled={loading}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            초기화
          </Button>
        </div>

        {/* 적용된 필터 표시 */}
        {getActiveFiltersCount() > 0 && (
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {filters.categories.map(category => (
              <Badge key={category} variant="secondary" className="flex items-center gap-1">
                {IDEA_CATEGORIES.find(c => c.value === category)?.label}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => handleArrayToggle('categories', category)}
                />
              </Badge>
            ))}
            {filters.packageTypes.map(type => (
              <Badge key={type} variant="secondary" className="flex items-center gap-1">
                {PACKAGE_TYPES.find(t => t.value === type)?.label}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => handleArrayToggle('packageTypes', type)}
                />
              </Badge>
            ))}
            {filters.techStack.slice(0, 5).map(tech => (
              <Badge key={tech} variant="secondary" className="flex items-center gap-1">
                {tech}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => handleArrayToggle('techStack', tech)}
                />
              </Badge>
            ))}
            {filters.techStack.length > 5 && (
              <Badge variant="secondary">
                +{filters.techStack.length - 5}개 더
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}