'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CreditCard } from 'lucide-react'
import { tossPayments } from '@/lib/toss-payments'

// Toss Payments SDK 타입 정의
declare global {
  interface Window {
    TossPayments: any
  }
}

interface TossPaymentProps {
  ideaId: string
  amount: number
  title: string
  onSuccess?: (paymentData: any) => void
  onError?: (error: string) => void
}

export default function TossPayment({ 
  ideaId, 
  amount, 
  title, 
  onSuccess, 
  onError 
}: TossPaymentProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [tossPaymentsInstance, setTossPaymentsInstance] = useState<any>(null)
  const [orderId] = useState(() => tossPayments.generateOrderId())
  const supabase = createClient()

  useEffect(() => {
    // Toss Payments SDK 로드
    const loadTossPayments = async () => {
      try {
        // SDK가 이미 로드되어 있는지 확인
        if (window.TossPayments) {
          const config = tossPayments.getClientConfig()
          const instance = window.TossPayments(config.clientKey)
          setTossPaymentsInstance(instance)
          return
        }

        // SDK 스크립트 동적 로드
        const script = document.createElement('script')
        script.src = 'https://js.tosspayments.com/v1/payment-widget'
        script.async = true
        
        script.onload = () => {
          const config = tossPayments.getClientConfig()
          const instance = window.TossPayments(config.clientKey)
          setTossPaymentsInstance(instance)
        }

        script.onerror = () => {
          console.error('Failed to load Toss Payments SDK')
          onError?.('결제 시스템을 불러오는데 실패했습니다.')
        }

        document.head.appendChild(script)

        // 컴포넌트 언마운트 시 스크립트 제거
        return () => {
          if (document.head.contains(script)) {
            document.head.removeChild(script)
          }
        }
      } catch (error) {
        console.error('Error loading Toss Payments:', error)
        onError?.('결제 시스템 초기화에 실패했습니다.')
      }
    }

    loadTossPayments()
  }, [onError])

  const handlePayment = async () => {
    if (!user) {
      onError?.('로그인이 필요합니다.')
      return
    }

    if (!tossPaymentsInstance) {
      onError?.('결제 시스템이 준비되지 않았습니다.')
      return
    }

    setLoading(true)

    try {
      // 트랜잭션 레코드 생성
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          idea_id: ideaId,
          buyer_id: user.id,
          amount: tossPayments.formatAmount(amount),
          platform_commission: Math.round(amount * 0.12), // 12% 수수료
          seller_amount: Math.round(amount * 0.88),
          payment_method: 'toss',
          status: 'pending',
          toss_order_id: orderId
        })
        .select()
        .single()

      if (transactionError) {
        throw new Error('거래 생성에 실패했습니다.')
      }

      // 성공/실패 URL 설정
      const baseUrl = window.location.origin
      const successUrl = `${baseUrl}/payment/success?orderId=${orderId}&transactionId=${transaction.id}`
      const failUrl = `${baseUrl}/payment/fail?orderId=${orderId}&transactionId=${transaction.id}`

      // Toss Payments 결제 요청
      await tossPaymentsInstance.requestPayment('카드', {
        amount: tossPayments.formatAmount(amount),
        orderId: orderId,
        orderName: title,
        customerName: user.user_metadata?.full_name || user.email,
        customerEmail: user.email,
        successUrl: successUrl,
        failUrl: failUrl,
        flowMode: 'DEFAULT', // 기본 결제 플로우
        easyPay: {
          useApplePay: true,
          useGooglePay: true,
          useSamsungPay: true
        }
      })

    } catch (error: unknown) {
      console.error('Payment error:', error)
      let errorMessage = '결제 중 오류가 발생했습니다.'
      
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as any).message
      }
      
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // 카카오페이 결제
  const handleKakaoPayment = async () => {
    if (!user || !tossPaymentsInstance) {
      onError?.('결제 시스템이 준비되지 않았습니다.')
      return
    }

    setLoading(true)

    try {
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          idea_id: ideaId,
          buyer_id: user.id,
          amount: tossPayments.formatAmount(amount),
          platform_commission: Math.round(amount * 0.12),
          seller_amount: Math.round(amount * 0.88),
          payment_method: 'toss',
          status: 'pending',
          toss_order_id: orderId
        })
        .select()
        .single()

      if (transactionError) {
        throw new Error('거래 생성에 실패했습니다.')
      }

      const baseUrl = window.location.origin
      const successUrl = `${baseUrl}/payment/success?orderId=${orderId}&transactionId=${transaction.id}`
      const failUrl = `${baseUrl}/payment/fail?orderId=${orderId}&transactionId=${transaction.id}`

      await tossPaymentsInstance.requestPayment('카카오페이', {
        amount: tossPayments.formatAmount(amount),
        orderId: orderId,
        orderName: title,
        customerName: user.user_metadata?.full_name || user.email,
        customerEmail: user.email,
        successUrl: successUrl,
        failUrl: failUrl
      })

    } catch (error: unknown) {
      console.error('KakaoPay error:', error)
      let errorMessage = '카카오페이 결제 중 오류가 발생했습니다.'
      
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0
    }).format(price)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          토스페이먼츠로 결제
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">상품명</span>
            <span className="font-medium">{title}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">결제 금액</span>
            <span className="text-xl font-bold text-blue-600">
              {formatPrice(amount)}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Button
            onClick={handlePayment}
            disabled={loading || !tossPaymentsInstance}
            className="w-full h-12 text-base font-medium"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                결제 진행 중...
              </div>
            ) : (
              '신용카드로 결제하기'
            )}
          </Button>

          <Button
            onClick={handleKakaoPayment}
            disabled={loading || !tossPaymentsInstance}
            variant="outline"
            className="w-full h-12 text-base font-medium bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-400"
          >
            {loading ? (
              '결제 진행 중...'
            ) : (
              '카카오페이로 결제하기'
            )}
          </Button>
        </div>

        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">안전한 결제</p>
            <p>토스페이먼츠의 보안 시스템으로 안전하게 결제됩니다. 카드 정보는 저장되지 않습니다.</p>
          </div>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• 결제 완료 후 즉시 파일 다운로드가 가능합니다.</p>
          <p>• 구매 후 7일 내 사유가 있을 경우 환불 가능합니다.</p>
          <p>• 플랫폼 수수료 12%가 포함된 금액입니다.</p>
        </div>
      </CardContent>
    </Card>
  )
}