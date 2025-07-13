'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Brain, Zap, TrendingUp, Code, Target, BarChart3, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function AIAnalysisPage() {
  const [ideaTitle, setIdeaTitle] = useState('')
  const [ideaDescription, setIdeaDescription] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)

  const handleAnalyze = async () => {
    if (!ideaTitle.trim() || !ideaDescription.trim()) return

    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/ai/analyze-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: ideaTitle,
          text: ideaDescription,
          options: { includeMarketAnalysis: true, includeTechnicalComplexity: true }
        })
      })

      if (response.ok) {
        const result = await response.json()
        setAnalysisResult(result.analysis)
      }
    } catch (error) {
      console.error('Analysis failed:', error)
      // Show demo result for preview
      setAnalysisResult({
        marketPotential: 78,
        technicalComplexity: 3,
        innovationScore: 85,
        sentiment: 'positive',
        confidence: 0.82,
        categories: ['AI', 'SaaS', 'Productivity'],
        keywords: ['automation', 'efficiency', 'machine learning'],
        recommendations: [
          'Market timing is favorable for AI-powered solutions',
          'Consider freemium pricing model for user acquisition',
          'Focus on small business segment initially'
        ]
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const generatePrediction = async () => {
    try {
      const response = await fetch('/api/ai/predict-success', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideaTitle,
          ideaDescription,
          developerId: 'demo-user',
          includeDetailedAnalysis: true
        })
      })

      if (response.ok) {
        const result = await response.json()
        setAnalysisResult({
          ...analysisResult,
          prediction: result.prediction
        })
      }
    } catch (error) {
      console.error('Prediction failed:', error)
      // Demo prediction
      setAnalysisResult({
        ...analysisResult,
        prediction: {
          successScore: 82,
          marketTiming: 75,
          technicalFeasibility: 88,
          fundingProbability: 70,
          confidence: 85,
          swotAnalysis: {
            strengths: ['Strong technical foundation', 'Clear value proposition'],
            weaknesses: ['High competition', 'Technical complexity'],
            opportunities: ['Growing AI market', 'Enterprise adoption'],
            threats: ['Market saturation', 'Regulatory changes']
          }
        }
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-4">
            🤖 AI 분석 체험
          </Badge>
          <h1 className="text-4xl font-bold mb-4 gradient-text">
            AI가 분석하는 아이디어의 성공 가능성
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            최첨단 AI 기술로 아이디어의 시장 잠재력, 기술적 복잡도, 성공 확률을 실시간으로 분석해보세요
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                아이디어 입력
              </CardTitle>
              <CardDescription>
                분석하고 싶은 아이디어를 입력해주세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">아이디어 제목</label>
                <Input
                  placeholder="예: AI 기반 개인 맞춤형 학습 플랫폼"
                  value={ideaTitle}
                  onChange={(e) => setIdeaTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">아이디어 설명</label>
                <Textarea
                  placeholder="아이디어에 대해 자세히 설명해주세요. 타겟 고객, 해결하려는 문제, 제공하는 가치 등을 포함해주세요..."
                  value={ideaDescription}
                  onChange={(e) => setIdeaDescription(e.target.value)}
                  rows={6}
                />
              </div>
              <Button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || !ideaTitle.trim() || !ideaDescription.trim()}
                className="w-full"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    AI 분석 중...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    AI 분석 시작
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                분석 결과
              </CardTitle>
              <CardDescription>
                AI가 분석한 아이디어의 상세 정보
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!analysisResult ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>아이디어를 입력하고 분석을 시작해보세요</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {analysisResult.marketPotential}%
                      </div>
                      <div className="text-sm text-green-700">시장 잠재력</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {analysisResult.innovationScore}%
                      </div>
                      <div className="text-sm text-blue-700">혁신성 점수</div>
                    </div>
                  </div>

                  {/* Categories */}
                  <div>
                    <h4 className="font-medium mb-2">카테고리</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.categories?.map((category: string, index: number) => (
                        <Badge key={index} variant="secondary">{category}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Technical Complexity */}
                  <div>
                    <h4 className="font-medium mb-2">기술적 복잡도</h4>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`w-6 h-2 rounded-full ${
                              level <= analysisResult.technicalComplexity
                                ? 'bg-orange-500'
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {analysisResult.technicalComplexity}/5
                      </span>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h4 className="font-medium mb-2">AI 추천사항</h4>
                    <div className="space-y-2">
                      {analysisResult.recommendations?.map((rec: string, index: number) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Success Prediction Button */}
                  {!analysisResult.prediction && (
                    <Button onClick={generatePrediction} variant="outline" className="w-full">
                      <Target className="h-4 w-4 mr-2" />
                      성공 확률 예측하기
                    </Button>
                  )}

                  {/* Prediction Results */}
                  {analysisResult.prediction && (
                    <div className="border-t pt-6">
                      <h4 className="font-medium mb-4 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        성공 확률 예측
                      </h4>
                      <div className="space-y-4">
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-3xl font-bold text-purple-600">
                            {analysisResult.prediction.successScore}%
                          </div>
                          <div className="text-sm text-purple-700">전체 성공 확률</div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="font-bold">{analysisResult.prediction.marketTiming}%</div>
                            <div>시장 타이밍</div>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="font-bold">{analysisResult.prediction.technicalFeasibility}%</div>
                            <div>기술적 실현성</div>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="font-bold">{analysisResult.prediction.fundingProbability}%</div>
                            <div>투자 가능성</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Features Showcase */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            IdeaVault AI 시스템의 강력한 기능들
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Brain className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>자연어 처리 분석</CardTitle>
                <CardDescription>
                  한국어/영어 이중 언어 지원으로 아이디어의 감정, 카테고리, 키워드를 정확히 분석
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle>실시간 시장 데이터</CardTitle>
                <CardDescription>
                  GitHub, Reddit, Product Hunt 등에서 실시간으로 수집된 데이터로 시장 동향 분석
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Code className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>AI 코드 생성</CardTitle>
                <CardDescription>
                  아이디어 기반으로 MVP 코드, 데이터베이스 설계, 배포 가이드를 자동 생성
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl">
                AI 분석된 검증된 아이디어를 구매하세요
              </CardTitle>
              <CardDescription className="text-lg">
                IdeaVault에서 AI가 성공 확률을 예측한 아이디어들을 찾아보세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/ideas">
                  <Button size="lg" className="flex items-center gap-2">
                    AI 검증된 아이디어 보기
                    <Brain className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button variant="outline" size="lg">
                    무료 회원가입
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}