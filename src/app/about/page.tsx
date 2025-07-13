import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Brain, Target, Users, TrendingUp } from 'lucide-react'

export const metadata: Metadata = {
  title: 'IdeaVault 소개 - AI 기반 딥테크 아이디어 마켓플레이스',
  description: 'IdeaVault는 AI 기술로 검증된 마이크로 SaaS 아이디어를 거래하는 한국 최초의 전문 플랫폼입니다.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            🚀 About IdeaVault
          </Badge>
          <h1 className="text-4xl font-bold mb-4 gradient-text">
            AI가 만드는 새로운 창업 생태계
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            IdeaVault는 AI 기술을 통해 검증된 딥테크 아이디어를 거래하는 한국 최초의 전문 마켓플레이스입니다. 
            바이브 코딩에 최적화된 구현 가이드로 빠른 MVP 개발을 지원합니다.
          </p>
        </div>

        {/* Mission */}
        <div className="mb-16">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">우리의 미션</h2>
            <p className="text-lg text-muted-foreground mb-8">
              "AI 기술로 아이디어의 가치를 정확히 평가하고, 개발자와 창업가를 연결하여 
              성공적인 스타트업 창업을 가속화합니다."
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="text-center">
                  <Brain className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                  <CardTitle className="text-lg">AI 검증</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    85% 정확도의 AI로 아이디어의 성공 가능성을 예측
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <Target className="h-12 w-12 text-green-600 mx-auto mb-2" />
                  <CardTitle className="text-lg">정확한 매칭</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    개발자의 스킬과 아이디어를 지능적으로 매칭
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <Users className="h-12 w-12 text-purple-600 mx-auto mb-2" />
                  <CardTitle className="text-lg">커뮤니티</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    창업가와 개발자가 함께 성장하는 생태계
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <TrendingUp className="h-12 w-12 text-orange-600 mx-auto mb-2" />
                  <CardTitle className="text-lg">성장 지원</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    MVP부터 런칭까지 전 과정 가이드 제공
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Company Info */}
        <div className="mb-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">회사 정보</h2>
            <Card>
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Creative Nexus</h3>
                    <div className="space-y-2 text-muted-foreground">
                      <p><strong>설립:</strong> 2025년</p>
                      <p><strong>본사:</strong> 대한민국 서울</p>
                      <p><strong>사업 분야:</strong> AI 기반 스타트업 플랫폼</p>
                      <p><strong>비전:</strong> AI로 연결되는 글로벌 창업 생태계</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-4">핵심 성과</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-primary/10 rounded-lg">
                        <div className="text-2xl font-bold text-primary">200+</div>
                        <div className="text-sm text-muted-foreground">검증된 아이디어</div>
                      </div>
                      <div className="text-center p-4 bg-green-100 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">85%</div>
                        <div className="text-sm text-muted-foreground">구현 성공률</div>
                      </div>
                      <div className="text-center p-4 bg-blue-100 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">2-4주</div>
                        <div className="text-sm text-muted-foreground">평균 구현 기간</div>
                      </div>
                      <div className="text-center p-4 bg-purple-100 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">₩150K</div>
                        <div className="text-sm text-muted-foreground">평균 거래액</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Technology */}
        <div className="mb-16">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">기술 스택</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>AI & 머신러닝</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">OpenAI GPT-4</Badge>
                    <Badge variant="secondary">Natural.js</Badge>
                    <Badge variant="secondary">Google Cloud AI</Badge>
                    <Badge variant="secondary">TensorFlow</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>백엔드 & 데이터베이스</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Next.js 14</Badge>
                    <Badge variant="secondary">Supabase</Badge>
                    <Badge variant="secondary">PostgreSQL</Badge>
                    <Badge variant="secondary">TypeScript</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>결제 & 보안</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Stripe</Badge>
                    <Badge variant="secondary">Toss Pay</Badge>
                    <Badge variant="secondary">AES-256</Badge>
                    <Badge variant="secondary">JWT</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl">
                함께 성장하는 AI 창업 생태계
              </CardTitle>
              <CardDescription className="text-lg">
                IdeaVault와 함께 검증된 아이디어로 성공적인 창업을 시작하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/ideas">
                  <Button size="lg">
                    아이디어 둘러보기
                  </Button>
                </Link>
                <Link href="/sell">
                  <Button variant="outline" size="lg">
                    아이디어 판매하기
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