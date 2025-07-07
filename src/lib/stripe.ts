import { loadStripe, Stripe as StripeJS } from '@stripe/stripe-js'
import Stripe from 'stripe'

let stripePromise: Promise<StripeJS | null>

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
    )
  }
  return stripePromise
}

// For server-side Stripe operations
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

// Price formatting utility
export const formatPrice = (amount: number, currency = 'KRW') => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount)
}

// Convert KRW to Stripe cents (Stripe uses smallest currency unit)
export const krwToStripeCents = (krw: number) => {
  return Math.round(krw) // KRW doesn't have fractional units
}

// Convert Stripe cents back to KRW
export const stripeCentsToKrw = (cents: number) => {
  return cents // For KRW, cents = actual amount
}
