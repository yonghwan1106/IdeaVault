import { createClient } from '@/lib/supabase-client'

interface UserPreferences {
  categories: string[]
  priceRange: { min: number; max: number }
  packageTypes: string[]
  techStack: string[]
  difficultyLevel: number[]
}

interface RecommendationScore {
  ideaId: string
  score: number
  reasons: string[]
}

export class RecommendationEngine {
  private supabase = createClient()

  async getRecommendations(userId: string, limit = 6): Promise<RecommendationScore[]> {
    try {
      // 사용자의 구매 히스토리 분석
      const purchaseHistory = await this.getUserPurchaseHistory(userId)
      
      // 사용자 선호도 추출
      const preferences = await this.extractUserPreferences(userId, purchaseHistory)
      
      // 협업 필터링 (비슷한 사용자들의 구매 패턴)
      const collaborativeScores = await this.getCollaborativeFilteringScores(userId, preferences)
      
      // 콘텐츠 기반 필터링 (유사한 아이디어)
      const contentScores = await this.getContentBasedScores(preferences)
      
      // 인기도 기반 추천
      const popularityScores = await this.getPopularityBasedScores()
      
      // 점수 통합 및 정규화
      const finalScores = this.combineScores(
        collaborativeScores,
        contentScores,
        popularityScores,
        preferences
      )
      
      return finalScores.slice(0, limit)
    } catch (error) {
      console.error('Error generating recommendations:', error)
      return this.getFallbackRecommendations(limit)
    }
  }

  private async getUserPurchaseHistory(userId: string) {
    const { data: transactions } = await this.supabase
      .from('transactions')
      .select(`
        *,
        ideas:idea_id (
          id,
          category,
          package_type,
          price,
          tech_stack,
          implementation_difficulty
        )
      `)
      .eq('buyer_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(50)

    return transactions || []
  }

  private async extractUserPreferences(
    userId: string, 
    purchaseHistory: unknown[]
  ): Promise<UserPreferences> {
    const categories: Record<string, number> = {}
    const packageTypes: Record<string, number> = {}
    const techStack: Record<string, number> = {}
    const difficulties: number[] = []
    let totalPrice = 0
    let priceCount = 0

    // 구매 히스토리에서 선호도 추출
    purchaseHistory.forEach((transaction: any) => {
      const idea = transaction.ideas
      if (!idea) return

      // 카테고리 선호도
      categories[idea.category] = (categories[idea.category] || 0) + 1
      
      // 패키지 타입 선호도
      packageTypes[idea.package_type] = (packageTypes[idea.package_type] || 0) + 1
      
      // 기술 스택 선호도
      if (idea.tech_stack) {
        idea.tech_stack.forEach((tech: string) => {
          techStack[tech] = (techStack[tech] || 0) + 1
        })
      }
      
      // 난이도 선호도
      if (idea.implementation_difficulty) {
        difficulties.push(idea.implementation_difficulty)
      }
      
      // 가격대 분석
      if (idea.price) {
        totalPrice += idea.price
        priceCount++
      }
    })

    // 평균 가격 계산
    const avgPrice = priceCount > 0 ? totalPrice / priceCount : 100000

    return {
      categories: Object.keys(categories).sort((a, b) => categories[b] - categories[a]),
      priceRange: {
        min: Math.max(0, avgPrice * 0.5),
        max: avgPrice * 1.5
      },
      packageTypes: Object.keys(packageTypes).sort((a, b) => packageTypes[b] - packageTypes[a]),
      techStack: Object.keys(techStack).sort((a, b) => techStack[b] - techStack[a]),
      difficultyLevel: difficulties.length > 0 ? [Math.round(difficulties.reduce((a, b) => a + b) / difficulties.length)] : [1, 2, 3]
    }
  }

  private async getCollaborativeFilteringScores(
    userId: string, 
    preferences: UserPreferences
  ): Promise<Record<string, number>> {
    // 비슷한 사용자들 찾기
    const { data: similarUsers } = await this.supabase
      .from('transactions')
      .select('buyer_id, idea_id')
      .neq('buyer_id', userId)
      .eq('status', 'completed')
      .in('idea_id', await this.getIdeasByCategories(preferences.categories.slice(0, 3)))

    if (!similarUsers) return {}

    // 유사 사용자들의 구매 패턴 분석
    const userItemMatrix: Record<string, Set<string>> = {}
    similarUsers.forEach(transaction => {
      if (!userItemMatrix[transaction.buyer_id]) {
        userItemMatrix[transaction.buyer_id] = new Set()
      }
      userItemMatrix[transaction.buyer_id].add(transaction.idea_id)
    })

    // 아이디어별 점수 계산
    const scores: Record<string, number> = {}
    Object.values(userItemMatrix).forEach(userItems => {
      userItems.forEach(ideaId => {
        scores[ideaId] = (scores[ideaId] || 0) + 1
      })
    })

    return scores
  }

  private async getContentBasedScores(preferences: UserPreferences): Promise<Record<string, number>> {
    const { data: ideas } = await this.supabase
      .from('ideas')
      .select('*')
      .eq('status', 'active')
      .eq('validation_status', 'approved')

    if (!ideas) return {}

    const scores: Record<string, number> = {}

    ideas.forEach(idea => {
      let score = 0

      // 카테고리 매칭 (40점)
      if (preferences.categories.includes(idea.category)) {
        score += 40
      }

      // 패키지 타입 매칭 (20점)
      if (preferences.packageTypes.includes(idea.package_type)) {
        score += 20
      }

      // 가격대 매칭 (20점)
      if (idea.price >= preferences.priceRange.min && idea.price <= preferences.priceRange.max) {
        score += 20
      }

      // 기술 스택 매칭 (15점)
      if (idea.tech_stack) {
        const techMatches = idea.tech_stack.filter((tech: string) => 
          preferences.techStack.includes(tech)
        ).length
        score += Math.min(15, techMatches * 3)
      }

      // 난이도 매칭 (5점)
      if (preferences.difficultyLevel.includes(idea.implementation_difficulty)) {
        score += 5
      }

      if (score > 0) {
        scores[idea.id] = score
      }
    })

    return scores
  }

  private async getPopularityBasedScores(): Promise<Record<string, number>> {
    const { data: ideas } = await this.supabase
      .from('ideas')
      .select('id, view_count, purchase_count')
      .eq('status', 'active')
      .eq('validation_status', 'approved')
      .order('purchase_count', { ascending: false })
      .limit(100)

    if (!ideas) return {}

    const scores: Record<string, number> = {}
    const maxViews = Math.max(...ideas.map(idea => idea.view_count || 0))
    const maxPurchases = Math.max(...ideas.map(idea => idea.purchase_count || 0))

    ideas.forEach(idea => {
      const viewScore = maxViews > 0 ? (idea.view_count || 0) / maxViews * 30 : 0
      const purchaseScore = maxPurchases > 0 ? (idea.purchase_count || 0) / maxPurchases * 70 : 0
      scores[idea.id] = viewScore + purchaseScore
    })

    return scores
  }

  private combineScores(
    collaborative: Record<string, number>,
    content: Record<string, number>,
    popularity: Record<string, number>,
    preferences: UserPreferences
  ): RecommendationScore[] {
    const allIdeaIds = new Set([
      ...Object.keys(collaborative),
      ...Object.keys(content),
      ...Object.keys(popularity)
    ])

    const combinedScores: RecommendationScore[] = []

    allIdeaIds.forEach(ideaId => {
      const collaborativeScore = collaborative[ideaId] || 0
      const contentScore = content[ideaId] || 0
      const popularityScore = popularity[ideaId] || 0

      // 가중 평균 계산
      const weights = {
        collaborative: 0.4,
        content: 0.4,
        popularity: 0.2
      }

      const finalScore = 
        collaborativeScore * weights.collaborative +
        contentScore * weights.content +
        popularityScore * weights.popularity

      const reasons: string[] = []
      if (collaborativeScore > 0) reasons.push('비슷한 사용자들이 관심을 보임')
      if (contentScore > 40) reasons.push('선호하는 카테고리')
      if (contentScore > 20) reasons.push('선호하는 패키지 타입')
      if (popularityScore > 50) reasons.push('인기 아이디어')

      combinedScores.push({
        ideaId,
        score: finalScore,
        reasons: reasons.length > 0 ? reasons : ['추천 아이디어']
      })
    })

    return combinedScores.sort((a, b) => b.score - a.score)
  }

  private async getIdeasByCategories(categories: string[]): Promise<string[]> {
    const { data: ideas } = await this.supabase
      .from('ideas')
      .select('id')
      .in('category', categories)
      .eq('status', 'active')

    return ideas?.map(idea => idea.id) || []
  }

  private async getFallbackRecommendations(limit: number): Promise<RecommendationScore[]> {
    // 최신 인기 아이디어로 폴백
    const { data: ideas } = await this.supabase
      .from('ideas')
      .select('id')
      .eq('status', 'active')
      .eq('validation_status', 'approved')
      .order('purchase_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    return ideas?.map(idea => ({
      ideaId: idea.id,
      score: 50,
      reasons: ['인기 아이디어']
    })) || []
  }

  // 추천 시스템 성능 모니터링
  async trackRecommendationClick(userId: string, ideaId: string, position: number) {
    try {
      await this.supabase
        .from('recommendation_clicks')
        .insert({
          user_id: userId,
          idea_id: ideaId,
          position,
          clicked_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error tracking recommendation click:', error)
    }
  }
}

export const recommendationEngine = new RecommendationEngine()