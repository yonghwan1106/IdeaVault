import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, DollarSign, Users, TrendingUp, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'IdeaVault - 아이디어 판매하기',
  description: 'AI가 검증한 마이크로 SaaS 아이디어를 판매하고 수익을 창출하세요. 높은 수수료율과 전문적인 마케팅 지원을 제공합니다.',
}

export default function SellPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            💰 아이디어 판매자 가이드
          </Badge>
          <h1 className="text-4xl font-bold mb-4 gradient-text">
            당신의 아이디어로 수익 창출하기
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            AI 분석과 검증을 통해 가치 있는 아이디어를 판매하고 지속적인 수익을 만들어보세요
          </p>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card>
            <CardHeader>
              <DollarSign className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>높은 수수료율</CardTitle>
              <CardDescription>
                85-88% 높은 판매자 수수료로 최대 수익 보장
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>전문 마케팅 지원</CardTitle>
              <CardDescription>
                AI 분석 결과를 활용한 타겟 마케팅과 구매자 매칭
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle>지속적인 수익</CardTitle>
              <CardDescription>
                한 번 등록으로 반복 판매 가능한 디지털 자산 구축
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Package Types */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">
            판매 가능한 패키지 유형
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
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    검증된 아이디어 개요서
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    시장 조사 리포트
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    경쟁사 분석
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    수익모델 제안
                  </li>
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
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    기능 명세서
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    UI/UX 와이어프레임
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    데이터베이스 설계
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    AI 생성 코드 포함
                  </li>
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
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    아이디어 + MVP 설계
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    마케팅 전략
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    고객 확보 가이드
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    3개월 멘토링
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Process */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">
            간단한 판매 프로세스
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', title: '아이디어 등록', desc: '상세한 아이디어와 검증 자료 업로드' },
              { step: '2', title: 'AI 분석', desc: 'AI가 시장성과 성공 확률을 자동 분석' },
              { step: '3', title: '심사 승인', desc: '전문가 검토를 통한 품질 보증' },
              { step: '4', title: '판매 시작', desc: '자동 마케팅으로 구매자 매칭 시작' }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl">
                지금 시작하여 첫 수익 창출하기
              </CardTitle>
              <CardDescription className="text-lg">
                AI 분석과 전문가 검토를 통해 가치 있는 아이디어로 만들어보세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/ideas/new">
                  <Button size="lg" className="flex items-center gap-2">
                    아이디어 등록하기
                    <ArrowRight className="h-4 w-4" />
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