import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'IdeaVault 개인정보처리방침',
  description: 'IdeaVault의 개인정보 수집, 이용, 보관에 관한 정책을 확인하세요.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-4">
            🔒 개인정보처리방침
          </Badge>
          <h1 className="text-4xl font-bold mb-4">개인정보처리방침</h1>
          <p className="text-muted-foreground">
            최종 업데이트: 2025년 1월 13일
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* 1. 개인정보 처리 목적 */}
          <Card>
            <CardHeader>
              <CardTitle>1. 개인정보 처리 목적</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>
                크리에이티브 넥서스(이하 "회사")는 다음의 목적을 위하여 개인정보를 처리합니다. 
                처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 
                이용 목적이 변경되는 경우에는 개인정보보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>회원 가입 및 관리</li>
                <li>서비스 제공 및 계약의 이행</li>
                <li>아이디어 거래 중개 및 결제 처리</li>
                <li>AI 분석 서비스 제공</li>
                <li>고객 상담 및 민원 처리</li>
                <li>서비스 개선 및 마케팅 활용</li>
              </ul>
            </CardContent>
          </Card>

          {/* 2. 개인정보 수집 항목 */}
          <Card>
            <CardHeader>
              <CardTitle>2. 개인정보 수집 항목</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">가. 필수 수집 항목</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>이름, 이메일 주소, 휴대폰 번호</li>
                    <li>아이디, 비밀번호</li>
                    <li>결제 정보 (카드번호, 계좌번호 등)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold">나. 선택 수집 항목</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>프로필 사진, 자기소개</li>
                    <li>관심 분야, 기술 스택</li>
                    <li>마케팅 정보 수신 동의</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold">다. 자동 수집 항목</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>IP 주소, 쿠키, 방문 기록</li>
                    <li>서비스 이용 기록, 접속 로그</li>
                    <li>기기 정보 (OS, 브라우저 종류 등)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. 개인정보 처리 및 보유 기간 */}
          <Card>
            <CardHeader>
              <CardTitle>3. 개인정보 처리 및 보유 기간</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>회사는 법령에 따른 개인정보 보유·이용 기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용 기간 내에서 개인정보를 처리·보유합니다.</p>
              <div className="space-y-2">
                <p><strong>회원 정보:</strong> 회원 탈퇴 시까지 (단, 관련 법령에 따라 일정 기간 보관)</p>
                <p><strong>거래 정보:</strong> 거래 완료 후 5년</p>
                <p><strong>결제 정보:</strong> 결제 완료 후 5년</p>
                <p><strong>접속 로그:</strong> 3개월</p>
                <p><strong>쿠키:</strong> 브라우저 종료 시 또는 로그아웃 시</p>
              </div>
            </CardContent>
          </Card>

          {/* 4. 개인정보의 제3자 제공 */}
          <Card>
            <CardHeader>
              <CardTitle>4. 개인정보의 제3자 제공</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>회사는 원칙적으로 정보주체의 개인정보를 수집·이용 목적으로 명시한 범위 내에서 처리하며, 다음의 경우에만 제3자에게 제공합니다:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>정보주체로부터 별도의 동의를 받은 경우</li>
                <li>법률에 특별한 규정이 있거나 법령상 의무를 준수하기 위해 불가피한 경우</li>
                <li>정보주체 또는 그 법정대리인이 의사표시를 할 수 없는 상태에 있거나 주소불명 등으로 사전 동의를 받을 수 없는 경우로서 명백히 정보주체 또는 제3자의 급박한 생명, 신체, 재산의 이익을 위하여 필요하다고 인정되는 경우</li>
              </ul>
              
              <div className="mt-4">
                <h4 className="font-semibold">제3자 제공 현황:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>결제대행사:</strong> Stripe, Toss Payments (결제 처리 목적)</li>
                  <li><strong>이메일 서비스:</strong> Resend (알림 발송 목적)</li>
                  <li><strong>클라우드 서비스:</strong> Supabase, Vercel (서비스 운영 목적)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* 5. 개인정보 처리 위탁 */}
          <Card>
            <CardHeader>
              <CardTitle>5. 개인정보 처리 위탁</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:</p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 mt-4">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2">수탁업체</th>
                      <th className="border border-gray-300 p-2">위탁업무</th>
                      <th className="border border-gray-300 p-2">개인정보 보유 및 이용기간</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-2">Stripe Inc.</td>
                      <td className="border border-gray-300 p-2">결제 처리</td>
                      <td className="border border-gray-300 p-2">거래 완료 후 5년</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2">Toss Payments</td>
                      <td className="border border-gray-300 p-2">결제 처리</td>
                      <td className="border border-gray-300 p-2">거래 완료 후 5년</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2">Supabase Inc.</td>
                      <td className="border border-gray-300 p-2">데이터베이스 관리</td>
                      <td className="border border-gray-300 p-2">회원 탈퇴 시까지</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 6. 정보주체의 권리·의무 */}
          <Card>
            <CardHeader>
              <CardTitle>6. 정보주체의 권리·의무</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>개인정보 처리현황 통지 요구</li>
                <li>개인정보 처리 정지 요구</li>
                <li>개인정보의 수정·삭제 요구</li>
                <li>개인정보 처리에 대한 동의 철회</li>
              </ul>
              <p className="mt-4">
                권리 행사는 회사에 대해 서면, 전화, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며 
                회사는 이에 대해 지체 없이 조치하겠습니다.
              </p>
            </CardContent>
          </Card>

          {/* 7. 개인정보의 안전성 확보 조치 */}
          <Card>
            <CardHeader>
              <CardTitle>7. 개인정보의 안전성 확보 조치</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>회사는 개인정보보호법 제29조에 따라 다음과 같이 안전성 확보에 필요한 기술적/관리적 및 물리적 조치를 하고 있습니다:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>개인정보 취급 직원의 최소화 및 교육:</strong> 개인정보를 취급하는 직원을 지정하고 담당자에 한정시켜 최소화하여 개인정보를 관리하는 대책을 시행하고 있습니다.</li>
                <li><strong>정기적인 자체 감사:</strong> 개인정보 취급 관련 안정성 확보를 위해 정기적(분기 1회)으로 자체 감사를 실시하고 있습니다.</li>
                <li><strong>내부관리계획의 수립 및 시행:</strong> 개인정보의 안전한 처리를 위하여 내부관리계획을 수립하고 시행하고 있습니다.</li>
                <li><strong>개인정보의 암호화:</strong> 개인정보는 암호화 등을 통해 안전하게 저장 및 관리되고 있습니다.</li>
                <li><strong>해킹 등에 대비한 기술적 대책:</strong> 해킹이나 컴퓨터 바이러스 등에 의한 개인정보 유출 및 훼손을 막기 위하여 보안프로그램을 설치하고 주기적인 갱신·점검을 하며 외부로부터 접근이 통제된 구역에 시스템을 설치하고 기술적/물리적으로 감시 및 차단하고 있습니다.</li>
              </ul>
            </CardContent>
          </Card>

          {/* 8. 개인정보보호책임자 */}
          <Card>
            <CardHeader>
              <CardTitle>8. 개인정보보호책임자</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보보호책임자를 지정하고 있습니다:</p>
              
              <div className="bg-gray-100 p-4 rounded-lg mt-4">
                <h4 className="font-semibold mb-2">개인정보보호책임자</h4>
                <ul className="space-y-1">
                  <li><strong>성명:</strong> 김보안</li>
                  <li><strong>직책:</strong> 개인정보보호책임자</li>
                  <li><strong>연락처:</strong> privacy@ideavault.kr</li>
                  <li><strong>전화:</strong> 02-1234-5679</li>
                </ul>
              </div>

              <p className="mt-4">
                정보주체께서는 회사의 서비스(또는 사업)을 이용하시면서 발생한 모든 개인정보 보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을 개인정보보호책임자 및 담당부서로 문의하실 수 있습니다. 회사는 정보주체의 문의에 대해 지체 없이 답변 및 처리해드릴 것입니다.
              </p>
            </CardContent>
          </Card>

          {/* 9. 개인정보 처리방침 변경 */}
          <Card>
            <CardHeader>
              <CardTitle>9. 개인정보 처리방침 변경</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.</p>
              
              <div className="mt-4">
                <p><strong>공고일자:</strong> 2025년 1월 13일</p>
                <p><strong>시행일자:</strong> 2025년 1월 13일</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}