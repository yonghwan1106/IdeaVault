'use client'

export const dynamic = 'force-dynamic'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, CheckCircle, Lightbulb, Code, TrendingUp } from 'lucide-react'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect to dashboard
  }
  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Lightbulb className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold gradient-text">IdeaVault</span>
          </div>
          <nav className="flex items-center space-x-4">
            <Link href="/ideas" className="text-sm hover:text-primary">
              아이디어 둘러보기
            </Link>
            <Link href="/sell" className="text-sm hover:text-primary">
              아이디어 판매
            </Link>
            <Link href="/signin">
              <Button variant="outline" size="sm">로그인</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">회원가입</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            🚀 바이브 코딩 최적화
          </Badge>
          <h1 className="text-5xl font-bold mb-6 gradient-text">
            검증된 마이크로 SaaS 아이디어
            <br />
            거래 마켓플레이스
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            아이디어 + 시장 검증 + 구현 가이드를 한번에.
            바이브 코딩으로 빠르게 구현하세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/ideas">
              <Button size="lg" className="flex items-center gap-2">
                아이디어 찾기 <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/sell">
              <Button variant="outline" size="lg">
                아이디어 판매하기
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-secondary/50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            왜 IdeaVault인가?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CheckCircle className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle>검증된 아이디어</CardTitle>
                <CardDescription>
                  시장 조사와 경쟁사 분석이 완료된 아이디어만 판매
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Code className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>바이브 코딩 최적화</CardTitle>
                <CardDescription>
                  AI 개발에 최적화된 구현 가이드와 프롬프트 세트 제공
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>빠른 구현</CardTitle>
                <CardDescription>
                  평균 2-4주 내 MVP 완성 가능한 상세한 기술 가이드
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Product Types */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            판매 상품 유형
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📝 아이디어 패키지
                  <Badge variant="secondary">₩50K-200K</Badge>
                </CardTitle>
                <CardDescription>기본 아이디어 + 시장 검증</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• 검증된 아이디어 개요서</li>
                  <li>• 시장 조사 리포트</li>
                  <li>• 경쟁사 분석</li>
                  <li>• 수익모델 제안</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🎨 MVP 설계도
                  <Badge>₩100K-500K</Badge>
                </CardTitle>
                <CardDescription>상세한 기술 구현 가이드</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• 기능 명세서</li>
                  <li>• UI/UX 와이어프레임</li>
                  <li>• 데이터베이스 설계</li>
                  <li>• 바이브 코딩 프롬프트</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🚀 런치 키트
                  <Badge variant="secondary">₩200K-1M</Badge>
                </CardTitle>
                <CardDescription>완전한 창업 패키지</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• 아이디어 + MVP 설계</li>
                  <li>• 마케팅 전략</li>
                  <li>• 고객 확보 가이드</li>
                  <li>• 3개월 멘토링</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">200+</div>
              <div className="text-sm opacity-90">검증된 아이디어</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">₩150K</div>
              <div className="text-sm opacity-90">평균 거래액</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">2-4주</div>
              <div className="text-sm opacity-90">평균 구현 기간</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">85%</div>
              <div className="text-sm opacity-90">구현 성공률</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            지금 시작하세요
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            검증된 아이디어로 성공적인 마이크로 SaaS를 만들어보세요
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="flex items-center gap-2">
                무료로 시작하기 <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/ideas">
              <Button variant="outline" size="lg">
                아이디어 둘러보기
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Lightbulb className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">IdeaVault</span>
            </div>
            <div className="flex space-x-6 text-sm text-muted-foreground">
              <Link href="/about" className="hover:text-primary">
                소개
              </Link>
              <Link href="/contact" className="hover:text-primary">
                문의
              </Link>
              <Link href="/terms" className="hover:text-primary">
                이용약관
              </Link>
              <Link href="/privacy" className="hover:text-primary">
                개인정보처리방침
              </Link>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t text-center text-sm text-muted-foreground">
            © 2025 IdeaVault by Creative Nexus. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  )
}
