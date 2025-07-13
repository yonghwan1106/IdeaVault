import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'IdeaVault 이용약관',
  description: 'IdeaVault 서비스 이용약관 및 정책을 확인하세요.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-4">
            📋 이용약관
          </Badge>
          <h1 className="text-4xl font-bold mb-4">IdeaVault 이용약관</h1>
          <p className="text-muted-foreground">
            최종 업데이트: 2025년 1월 13일
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* 제1조 */}
          <Card>
            <CardHeader>
              <CardTitle>제1조 (목적)</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>
                본 약관은 크리에이티브 넥서스(이하 "회사")가 운영하는 IdeaVault 서비스(이하 "서비스")의 
                이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
              </p>
            </CardContent>
          </Card>

          {/* 제2조 */}
          <Card>
            <CardHeader>
              <CardTitle>제2조 (정의)</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>본 약관에서 사용하는 용어의 정의는 다음과 같습니다:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>"서비스"란 회사가 제공하는 IdeaVault 플랫폼을 의미합니다.</li>
                <li>"이용자"란 본 약관에 따라 서비스를 이용하는 회원 및 비회원을 말합니다.</li>
                <li>"회원"이란 서비스에 개인정보를 제공하여 회원등록을 한 자를 말합니다.</li>
                <li>"아이디어"란 회원이 서비스를 통해 판매하는 디지털 콘텐츠를 의미합니다.</li>
                <li>"AI 분석"이란 회사가 제공하는 인공지능 기반 아이디어 검증 서비스를 의미합니다.</li>
              </ol>
            </CardContent>
          </Card>

          {/* 제3조 */}
          <Card>
            <CardHeader>
              <CardTitle>제3조 (약관의 효력 및 변경)</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <ol className="list-decimal list-inside space-y-2">
                <li>본 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력을 발생합니다.</li>
                <li>회사는 필요한 경우 관련법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있습니다.</li>
                <li>약관이 변경되는 경우 변경된 약관의 적용일자 및 변경사유를 명시하여 적용일자 7일 전부터 공지합니다.</li>
              </ol>
            </CardContent>
          </Card>

          {/* 제4조 */}
          <Card>
            <CardHeader>
              <CardTitle>제4조 (서비스의 제공)</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>회사가 제공하는 서비스는 다음과 같습니다:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>검증된 마이크로 SaaS 아이디어 마켓플레이스</li>
                <li>AI 기반 아이디어 성공 확률 예측 서비스</li>
                <li>자동 MVP 코드 생성 서비스</li>
                <li>실시간 시장 동향 분석 서비스</li>
                <li>개발자-아이디어 매칭 서비스</li>
                <li>기타 회사가 정하는 서비스</li>
              </ol>
            </CardContent>
          </Card>

          {/* 제5조 */}
          <Card>
            <CardHeader>
              <CardTitle>제5조 (회원가입)</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <ol className="list-decimal list-inside space-y-2">
                <li>이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 본 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다.</li>
                <li>회사는 다음 각 호에 해당하는 신청에 대하여는 승낙하지 아니할 수 있습니다:
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                    <li>실명이 아니거나 타인의 명의를 이용한 경우</li>
                    <li>허위의 정보를 기재하거나, 회사가 제시하는 내용을 기재하지 않은 경우</li>
                    <li>관련법령에 위배되는 목적으로 신청한 경우</li>
                  </ul>
                </li>
              </ol>
            </CardContent>
          </Card>

          {/* 제6조 */}
          <Card>
            <CardHeader>
              <CardTitle>제6조 (아이디어 거래)</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <ol className="list-decimal list-inside space-y-2">
                <li>아이디어 판매자는 지적재산권을 보유하고 있는 아이디어만 등록할 수 있습니다.</li>
                <li>모든 거래는 서비스 내에서 진행되며, 에스크로 시스템을 통해 안전하게 보호됩니다.</li>
                <li>구매자는 결제 완료 후 48시간 이내에 파일에 접근할 수 있습니다.</li>
                <li>회사는 거래 금액의 12-15%를 수수료로 부과합니다.</li>
              </ol>
            </CardContent>
          </Card>

          {/* 제7조 */}
          <Card>
            <CardHeader>
              <CardTitle>제7조 (AI 서비스 이용)</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <ol className="list-decimal list-inside space-y-2">
                <li>AI 분석 결과는 참고용이며, 실제 사업 성공을 보장하지 않습니다.</li>
                <li>AI가 생성한 코드의 품질과 완성도에 대해 회사는 책임지지 않습니다.</li>
                <li>이용자는 AI 서비스를 남용하거나 무단으로 복제할 수 없습니다.</li>
              </ol>
            </CardContent>
          </Card>

          {/* 제8조 */}
          <Card>
            <CardHeader>
              <CardTitle>제8조 (환불 정책)</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <ol className="list-decimal list-inside space-y-2">
                <li>디지털 콘텐츠의 특성상 다운로드 후에는 환불이 제한됩니다.</li>
                <li>다음의 경우 구매일로부터 7일 이내 환불 신청이 가능합니다:
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                    <li>설명과 다른 내용이 제공된 경우</li>
                    <li>기술적 오류로 파일에 접근할 수 없는 경우</li>
                    <li>중복 구매한 경우</li>
                  </ul>
                </li>
              </ol>
            </CardContent>
          </Card>

          {/* 제9조 */}
          <Card>
            <CardHeader>
              <CardTitle>제9조 (면책사항)</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <ol className="list-decimal list-inside space-y-2">
                <li>회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력으로 인한 서비스 중단에 대해 책임지지 않습니다.</li>
                <li>회사는 이용자가 서비스를 이용하여 얻은 정보로 인한 손해에 대해 책임지지 않습니다.</li>
                <li>회사는 이용자 간의 거래에서 발생한 분쟁에 대해 중재하지 않으며, 이에 대한 책임을 지지 않습니다.</li>
              </ol>
            </CardContent>
          </Card>

          {/* 제10조 */}
          <Card>
            <CardHeader>
              <CardTitle>제10조 (준거법 및 관할법원)</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <ol className="list-decimal list-inside space-y-2">
                <li>본 약관은 대한민국 법령에 의하여 규정되고 이행됩니다.</li>
                <li>서비스 이용으로 발생한 분쟁에 대해서는 대한민국 서울중앙지방법원을 관할법원으로 합니다.</li>
              </ol>
            </CardContent>
          </Card>

          {/* 부칙 */}
          <Card>
            <CardHeader>
              <CardTitle>부칙</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>본 약관은 2025년 1월 13일부터 적용됩니다.</p>
              <p className="mt-4 text-sm text-muted-foreground">
                문의사항이 있으시면 support@ideavault.kr로 연락해주세요.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}