import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail, MessageCircle, Phone, MapPin, Clock, Headphones } from 'lucide-react'

export const metadata: Metadata = {
  title: 'IdeaVault 문의 - 고객 지원 및 파트너십',
  description: '궁금한 점이나 제안 사항이 있으시면 언제든 연락해주세요. 24시간 지원 서비스를 제공합니다.',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            📞 Contact Us
          </Badge>
          <h1 className="text-4xl font-bold mb-4 gradient-text">
            언제든 문의하세요
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            궁금한 점이나 제안 사항이 있으시면 언제든 연락해주세요. 
            전문 고객지원팀이 신속하게 도움을 드리겠습니다.
          </p>
        </div>

        {/* Contact Options */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <Card>
            <CardHeader className="text-center">
              <Mail className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>이메일 문의</CardTitle>
              <CardDescription>일반적인 문의사항</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-lg font-semibold text-blue-600 mb-2">
                support@ideavault.kr
              </p>
              <p className="text-sm text-muted-foreground">
                24시간 내 답변 보장
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <MessageCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>실시간 채팅</CardTitle>
              <CardDescription>즉시 도움이 필요할 때</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-lg font-semibold text-green-600 mb-2">
                라이브 채팅
              </p>
              <p className="text-sm text-muted-foreground">
                평일 09:00 - 18:00
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Headphones className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>전화 상담</CardTitle>
              <CardDescription>긴급 지원 및 상담</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-lg font-semibold text-purple-600 mb-2">
                02-1234-5678
              </p>
              <p className="text-sm text-muted-foreground">
                평일 09:00 - 18:00
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Support Categories */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">
            문의 유형별 안내
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">일반 사용자 지원</CardTitle>
                <CardDescription>구매, 판매, 결제 관련 문의</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• 계정 생성 및 로그인 문제</li>
                  <li>• 아이디어 구매 및 결제 방법</li>
                  <li>• 파일 다운로드 및 접근 권한</li>
                  <li>• 환불 및 교환 정책</li>
                  <li>• 플랫폼 사용법 가이드</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">판매자 지원</CardTitle>
                <CardDescription>아이디어 등록 및 판매 관련</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• 아이디어 등록 가이드</li>
                  <li>• AI 분석 결과 해석</li>
                  <li>• 가격 책정 컨설팅</li>
                  <li>• 마케팅 전략 지원</li>
                  <li>• 수수료 및 정산 문의</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">기술 지원</CardTitle>
                <CardDescription>AI 분석 및 기술적 문의</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• AI 분석 결과 상세 설명</li>
                  <li>• 코드 생성 가이드</li>
                  <li>• 기술 스택 추천</li>
                  <li>• 개발 멘토링 연결</li>
                  <li>• API 사용법 안내</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">비즈니스 파트너십</CardTitle>
                <CardDescription>협업 및 제휴 제안</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• 기업 파트너십 제안</li>
                  <li>• 대량 구매 할인 문의</li>
                  <li>• 교육기관 협력 프로그램</li>
                  <li>• 투자 및 M&A 문의</li>
                  <li>• 미디어 및 보도자료</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Company Info */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">
            회사 정보
          </h2>
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    본사 주소
                  </h3>
                  <div className="space-y-2 text-muted-foreground">
                    <p>Creative Nexus Inc.</p>
                    <p>서울특별시 강남구 테헤란로 123</p>
                    <p>IdeaVault 빌딩 10층</p>
                    <p>우편번호: 06234</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    운영 시간
                  </h3>
                  <div className="space-y-2 text-muted-foreground">
                    <p><strong>고객지원:</strong> 평일 09:00 - 18:00</p>
                    <p><strong>기술지원:</strong> 평일 10:00 - 17:00</p>
                    <p><strong>긴급지원:</strong> 24시간 (이메일)</p>
                    <p><strong>주말/공휴일:</strong> 이메일 문의만 접수</p>
                  </div>
                </div>
              </div>
              
              <div className="border-t mt-8 pt-8">
                <h3 className="text-xl font-semibold mb-4">사업자 정보</h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                  <div>
                    <p><strong>상호:</strong> 크리에이티브 넥서스</p>
                    <p><strong>대표:</strong> 박용환</p>
                  </div>
                  <div>
                    <p><strong>사업자등록번호:</strong> 123-45-67890</p>
                    <p><strong>통신판매신고:</strong> 2025-서울강남-1234</p>
                  </div>
                  <div>
                    <p><strong>개인정보보호책임자:</strong> 김보안</p>
                    <p><strong>호스팅:</strong> Vercel Inc.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl">
                자주 묻는 질문도 확인해보세요
              </CardTitle>
              <CardDescription className="text-lg">
                빠른 해결책을 찾고 계시다면 FAQ를 먼저 확인해보세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                대부분의 궁금증은 FAQ에서 해결하실 수 있습니다.
              </p>
              <Badge variant="outline" className="text-primary">
                📚 FAQ 준비 중
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}