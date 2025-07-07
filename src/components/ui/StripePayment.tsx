'use client'

import { useState, useEffect, useCallback } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import { CreditCard, Lock, Loader2 } from 'lucide-react'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

interface StripePaymentProps {
  ideaId: string
  amount: number
  ideaTitle: string
  onSuccess: () => void
  onCancel: () => void
}

function PaymentForm({ ideaId, amount, ideaTitle, onSuccess, onCancel }: StripePaymentProps) {
  const stripe = useStripe()
  const elements = useElements()
  const { user } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [clientSecret, setClientSecret] = useState('')

  const createPaymentIntent = useCallback(async () => {
    if (!user) return

    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ideaId,
          userId: user.id
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create payment intent')
      }

      const data = await response.json()
      setClientSecret(data.clientSecret)
    } catch (error: unknown) {
      console.error('Payment intent creation failed:', error)
      toast.error(error instanceof Error ? error.message : '결제 준비 중 오류가 발생했습니다.')
      onCancel()
    }
  }, [user, ideaId, onCancel])

  useEffect(() => {
    // Create payment intent when component mounts
    createPaymentIntent()
  }, [createPaymentIntent])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements || !clientSecret) {
      return
    }

    setLoading(true)

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setLoading(false)
      return
    }

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              email: user?.email,
            },
          },
        }
      )

      if (error) {
        console.error('Payment failed:', error)
        toast.error(error.message || '결제에 실패했습니다.')
      } else if (paymentIntent?.status === 'succeeded') {
        toast.success('결제가 완료되었습니다!')
        onSuccess()
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast.error('결제 처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">결제 준비 중...</span>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          결제 정보
        </h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">아이디어</span>
            <span className="text-sm font-medium text-gray-900 truncate ml-2">
              {ideaTitle}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">결제 금액</span>
            <span className="text-lg font-bold text-green-600">
              {formatPrice(amount)}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <CreditCard className="inline h-4 w-4 mr-1" />
            카드 정보
          </label>
          <div className="border border-gray-300 rounded-lg p-3 bg-white">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                  invalid: {
                    color: '#9e2146',
                  },
                },
                hidePostalCode: false,
              }}
            />
          </div>
        </div>

        <div className="flex items-center text-sm text-gray-500 mb-6">
          <Lock className="h-4 w-4 mr-2" />
          <span>Stripe를 통한 안전한 결제가 보장됩니다</span>
        </div>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            disabled={loading}
          >
            취소
          </button>
          <button
            type="submit"
            disabled={!stripe || loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                처리 중...
              </>
            ) : (
              `${formatPrice(amount)} 결제하기`
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function StripePayment(props: StripePaymentProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  )
}