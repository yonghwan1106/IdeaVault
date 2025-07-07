'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Download, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface PaymentSuccessData {
  transactionId: string
  ideaTitle: string
  amount: number
  orderId: string
  paymentKey?: string
}

function PaymentSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [paymentData, setPaymentData] = useState<PaymentSuccessData | null>(null)
  const [error, setError] = useState('')

  const supabase = createClient()

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const orderId = searchParams?.get('orderId')
        const transactionId = searchParams?.get('transactionId')
        const paymentKey = searchParams?.get('paymentKey')
        const amount = searchParams?.get('amount')

        if (!orderId || !transactionId) {
          setError('결제 정보가 올바르지 않습니다.')
          return
        }

        // Toss 결제 승인 요청 (서버에서 처리되어야 함)
        if (paymentKey && amount) {
          const response = await fetch('/api/payments/toss/confirm', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              paymentKey,
              orderId,
              amount: parseInt(amount)
            })
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || '결제 승인에 실패했습니다.')
          }
        }

        // 거래 정보 확인 및 업데이트
        const { data: transaction, error: transactionError } = await supabase
          .from('transactions')
          .select(`
            *,
            ideas:idea_id (
              title,
              seller_id
            )
          `)
          .eq('id', transactionId)
          .eq('toss_order_id', orderId)
          .single()

        if (transactionError || !transaction) {
          throw new Error('거래 정보를 찾을 수 없습니다.')
        }

        // 거래 상태를 완료로 업데이트
        const { error: updateError } = await supabase
          .from('transactions')
          .update({
            status: 'completed',
            toss_payment_key: paymentKey,
            escrow_released_at: new Date().toISOString()
          })
          .eq('id', transactionId)

        if (updateError) {
          throw new Error('거래 상태 업데이트에 실패했습니다.')
        }

        // 판매자에게 알림 발송
        if (transaction.ideas && Array.isArray(transaction.ideas) && transaction.ideas[0]) {
          await fetch('/api/notifications/purchase', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              sellerId: transaction.ideas[0].seller_id,
              ideaId: transaction.idea_id,
              transactionId: transaction.id,
              amount: transaction.amount
            })
          })
        }

        const idea = Array.isArray(transaction.ideas) ? transaction.ideas[0] : transaction.ideas
        setPaymentData({
          transactionId: transaction.id,
          ideaTitle: idea?.title || '아이디어',
          amount: transaction.amount,
          orderId: transaction.toss_order_id || orderId,
          paymentKey: paymentKey || undefined
        })

      } catch (err) {
        console.error('Payment verification error:', err)
        setError(err instanceof Error ? err.message : '결제 확인 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    verifyPayment()
  }, [searchParams, supabase])

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">결제를 확인하는 중입니다...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-red-600">결제 확인 실패</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">{error}</p>
            <div className="space-y-2">
              <Button onClick={() => router.back()} className="w-full">
                이전 페이지로 돌아가기
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/dashboard">대시보드로 이동</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-green-600">결제가 완료되었습니다!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {paymentData && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">주문번호</span>
                <span className="text-sm font-mono">{paymentData.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">상품명</span>
                <span className="text-sm font-medium">{paymentData.ideaTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">결제금액</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatPrice(paymentData.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">결제방법</span>
                <span className="text-sm">토스페이먼츠</span>
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Download className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">파일 다운로드 안내</span>
            </div>
            <p className="text-sm text-blue-700">
              구매하신 아이디어의 모든 파일이 즉시 다운로드 가능합니다. 
              대시보드의 &apos;내 구매&apos; 섹션에서 확인하세요.
            </p>
          </div>

          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/dashboard/purchases">
                <Download className="w-4 h-4 mr-2" />
                파일 다운로드하기
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/ideas">
                다른 아이디어 둘러보기
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              결제 관련 문의는 고객센터로 연락해 주세요.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}