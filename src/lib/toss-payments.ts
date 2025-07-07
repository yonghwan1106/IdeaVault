interface TossPaymentsConfig {
  clientKey: string
  secretKey: string
  isTest: boolean
}

interface PaymentRequest {
  amount: number
  orderId: string
  orderName: string
  customerName?: string
  customerEmail?: string
  successUrl: string
  failUrl: string
}

interface PaymentResponse {
  paymentKey: string
  orderId: string
  amount: number
  status: 'WAITING_FOR_DEPOSIT' | 'DONE' | 'CANCELED' | 'PARTIAL_CANCELED' | 'ABORTED' | 'EXPIRED'
  requestedAt: string
  approvedAt?: string
}

export class TossPayments {
  private config: TossPaymentsConfig
  private baseUrl: string

  constructor() {
    this.config = {
      clientKey: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!,
      secretKey: process.env.TOSS_SECRET_KEY!,
      isTest: process.env.NODE_ENV !== 'production'
    }
    
    this.baseUrl = this.config.isTest 
      ? 'https://api.tosspayments.com/v1'
      : 'https://api.tosspayments.com/v1'
  }

  // 클라이언트에서 사용할 Toss Payments 위젯 설정
  getClientConfig() {
    return {
      clientKey: this.config.clientKey,
      isTest: this.config.isTest
    }
  }

  // 결제 승인 (서버에서만 사용)
  async confirmPayment(paymentKey: string, orderId: string, amount: number): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.config.secretKey}:`).toString('base64')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Payment confirmation failed: ${errorData.message}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Toss payment confirmation error:', error)
      throw error
    }
  }

  // 결제 조회
  async getPayment(paymentKey: string): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${paymentKey}`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.config.secretKey}:`).toString('base64')}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Payment inquiry failed: ${errorData.message}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Toss payment inquiry error:', error)
      throw error
    }
  }

  // 결제 취소
  async cancelPayment(paymentKey: string, cancelReason: string, cancelAmount?: number): Promise<PaymentResponse> {
    try {
      const requestBody: any = {
        cancelReason
      }

      if (cancelAmount) {
        requestBody.cancelAmount = cancelAmount
      }

      const response = await fetch(`${this.baseUrl}/payments/${paymentKey}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.config.secretKey}:`).toString('base64')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Payment cancellation failed: ${errorData.message}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Toss payment cancellation error:', error)
      throw error
    }
  }

  // 주문 ID 생성 (유니크한 ID)
  generateOrderId(): string {
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    return `order_${timestamp}_${randomString}`
  }

  // 금액 포맷팅 (Toss는 원화 기준)
  formatAmount(amount: number): number {
    return Math.round(amount)
  }

  // 결제 URL 생성
  getPaymentUrl(request: PaymentRequest): string {
    const params = new URLSearchParams({
      amount: request.amount.toString(),
      orderId: request.orderId,
      orderName: request.orderName,
      successUrl: request.successUrl,
      failUrl: request.failUrl
    })

    if (request.customerName) {
      params.append('customerName', request.customerName)
    }

    if (request.customerEmail) {
      params.append('customerEmail', request.customerEmail)
    }

    return `https://pay.toss.im/web/checkout?${params.toString()}`
  }

  // 웹훅 검증 (Toss에서 전송하는 데이터의 무결성 확인)
  verifyWebhook(signature: string, body: string): boolean {
    try {
      const crypto = require('crypto')
      const expectedSignature = crypto
        .createHmac('sha256', this.config.secretKey)
        .update(body)
        .digest('base64')

      return signature === expectedSignature
    } catch (error) {
      console.error('Webhook verification error:', error)
      return false
    }
  }
}

export const tossPayments = new TossPayments()