import { NextRequest, NextResponse } from 'next/server'
import { tossPayments } from '@/lib/toss-payments'
import { createRouteHandlerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { paymentKey, orderId, amount } = await request.json()

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { error: 'Missing required payment information' },
        { status: 400 }
      )
    }

    // Supabase 서버 클라이언트 생성
    const supabase = createRouteHandlerClient(request)

    // 주문 정보 확인
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .eq('toss_order_id', orderId)
      .eq('amount', amount)
      .eq('status', 'pending')
      .single()

    if (transactionError || !transaction) {
      console.error('Transaction not found:', transactionError)
      return NextResponse.json(
        { error: 'Invalid transaction' },
        { status: 404 }
      )
    }

    // Toss Payments에 결제 승인 요청
    try {
      const paymentResult = await tossPayments.confirmPayment(
        paymentKey,
        orderId,
        amount
      )

      // 결제 승인 성공 시 트랜잭션 상태 업데이트
      if (paymentResult.status === 'DONE') {
        const { error: updateError } = await supabase
          .from('transactions')
          .update({
            status: 'paid',
            toss_payment_key: paymentKey,
            updated_at: new Date().toISOString()
          })
          .eq('id', transaction.id)

        if (updateError) {
          console.error('Failed to update transaction:', updateError)
          // 결제는 성공했지만 DB 업데이트 실패 - 수동 처리 필요
          return NextResponse.json(
            { error: 'Payment succeeded but failed to update database' },
            { status: 500 }
          )
        }

        // 성공 응답
        return NextResponse.json({
          success: true,
          paymentKey: paymentResult.paymentKey,
          orderId: paymentResult.orderId,
          status: paymentResult.status,
          approvedAt: paymentResult.approvedAt,
          transactionId: transaction.id
        })
      } else {
        // 결제 상태가 DONE이 아닌 경우
        return NextResponse.json(
          { error: `Payment status is ${paymentResult.status}` },
          { status: 400 }
        )
      }

    } catch (tossError) {
      console.error('Toss payment confirmation failed:', tossError)
      
      // 트랜잭션 상태를 실패로 업데이트
      await supabase
        .from('transactions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.id)

      return NextResponse.json(
        { 
          error: 'Payment confirmation failed',
          details: tossError instanceof Error ? tossError.message : 'Unknown error'
        },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Payment confirmation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}