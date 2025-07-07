'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface PaymentFailData {
  orderId: string
  errorMessage: string
  errorCode?: string
  ideaTitle?: string
}

function PaymentFailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [failData, setFailData] = useState<PaymentFailData | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const handlePaymentFail = async () => {
      try {
        const orderId = searchParams?.get('orderId')
        const transactionId = searchParams?.get('transactionId')
        const code = searchParams?.get('code')
        const message = searchParams?.get('message')

        if (!orderId) {
          setFailData({
            orderId: 'Unknown',
            errorMessage: '결제 정보를 찾을 수 없습니다.',
            errorCode: 'MISSING_ORDER_ID'
          })
          return
        }

        // 거래 정보 조회
        if (transactionId) {
          const { data: transaction, error: transactionError } = await supabase
            .from('transactions')
            .select(`
              *,
              ideas:idea_id (
                title
              )
            `)
            .eq('id', transactionId)
            .single()

          if (!transactionError && transaction) {
            // 거래 상태를 실패로 업데이트
            await supabase
              .from('transactions')
              .update({
                status: 'cancelled',
                updated_at: new Date().toISOString()
              })
              .eq('id', transactionId)

            const idea = Array.isArray(transaction.ideas) ? transaction.ideas[0] : transaction.ideas
            
            setFailData({
              orderId: transaction.toss_order_id || orderId,
              errorMessage: message || '결제가 취소되었습니다.',
              errorCode: code || undefined,
              ideaTitle: idea?.title
            })
            return
          }
        }

        // 기본 실패 데이터 설정
        setFailData({
          orderId,
          errorMessage: message || '결제 중 오류가 발생했습니다.',
          errorCode: code || undefined
        })

      } catch (error) {
        console.error('Payment fail handling error:', error)
        setFailData({
          orderId: 'Unknown',
          errorMessage: '결제 실패 처리 중 오류가 발생했습니다.',
          errorCode: 'PROCESSING_ERROR'
        })
      } finally {
        setLoading(false)
      }
    }

    handlePaymentFail()
  }, [searchParams, supabase])

  const getErrorDescription = (errorCode?: string) => {
    switch (errorCode) {
      case 'USER_CANCEL':
        return '사용자가 결제를 취소했습니다.'
      case 'INVALID_CARD':
        return '유효하지 않은 카드입니다. 다른 카드로 시도해 주세요.'
      case 'INSUFFICIENT_FUNDS':
        return '잔액이 부족합니다. 카드 한도를 확인해 주세요.'
      case 'EXCEED_MAX_DAILY_PAYMENT_COUNT':
        return '일일 결제 한도를 초과했습니다.'
      case 'NOT_SUPPORTED_INSTALLMENT_PLAN':
        return '지원하지 않는 할부 개월수입니다.'
      case 'INVALID_API_KEY':
        return '결제 시스템 오류입니다. 관리자에게 문의해 주세요.'
      case 'REJECT_CARD_COMPANY':
        return '카드사에서 결제를 거부했습니다.'
      default:
        return '알 수 없는 오류가 발생했습니다.'
    }
  }

  const handleRetryPayment = () => {
    if (failData?.ideaTitle) {
      // 아이디어 상세 페이지로 이동하여 다시 결제 시도
      router.back()
    } else {
      // 아이디어 목록 페이지로 이동
      router.push('/ideas')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">결제 결과를 확인하는 중입니다...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-red-600">결제에 실패했습니다</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {failData && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">주문번호</span>
                <span className="text-sm font-mono">{failData.orderId}</span>
              </div>
              {failData.ideaTitle && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">상품명</span>
                  <span className="text-sm font-medium">{failData.ideaTitle}</span>
                </div>
              )}
              <div className="flex justify-between items-start">
                <span className="text-sm text-gray-600">실패 사유</span>
                <div className="text-right">
                  <div className="text-sm font-medium text-red-600 mb-1">
                    {failData.errorMessage}
                  </div>
                  {failData.errorCode && (
                    <div className="text-xs text-gray-500">
                      코드: {failData.errorCode}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>실패 원인:</strong><br />
              {getErrorDescription(failData?.errorCode)}
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2">해결 방법</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 카드 정보를 다시 확인해 주세요</li>
              <li>• 다른 결제 수단을 시도해 보세요</li>
              <li>• 카드사에 문의하여 결제 가능 여부를 확인해 주세요</li>
              <li>• 문제가 지속되면 고객센터로 연락해 주세요</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Button onClick={handleRetryPayment} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              다시 결제하기
            </Button>
            <Button variant="outline" onClick={() => router.back()} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              이전 페이지로 돌아가기
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/ideas">다른 아이디어 둘러보기</Link>
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2">
              결제 관련 문의는 고객센터로 연락해 주세요.
            </p>
            <p className="text-xs text-gray-400">
              주문번호를 함께 알려주시면 빠른 처리가 가능합니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin"></div>
      </div>
    }>
      <PaymentFailContent />
    </Suspense>
  )
}