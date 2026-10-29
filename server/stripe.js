import Stripe from 'stripe'
import { env } from './config.js'
import { BadRequestError } from './errors.js'

// The client is only usable with a Test/secret key; without one the checkout
// endpoint answers with a clear error instead of failing mysteriously.
export function getStripeClient() {
  if (!env.STRIPE_SECRET_KEY) return null
  return new Stripe(env.STRIPE_SECRET_KEY)
}

export function assertStripeConfigured() {
  const stripe = getStripeClient()
  if (!stripe) {
    throw new BadRequestError('Online payments are not configured on the server yet.')
  }
  return stripe
}

// Creates the hosted Checkout Session for a pending order. `amounts` always
// comes from server-side data (the plans table), never from the request body.
export async function createCheckoutSession({ order, item, origin }) {
  const stripe = assertStripeConfigured()

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: order.currency,
        unit_amount: item.unitAmount,
        // Inline product name must live in `product_data`; `product` is only
        // for an existing Product ID string on current API versions.
        product_data: { name: item.planName },
      },
      quantity: item.quantity,
    }],
    // Recorded on the order and echoed back by Stripe; used to reconcile
    // webhook events without trusting anything the client sends.
    client_reference_id: String(order.id),
    metadata: { orderId: String(order.id) },
    success_url: `${origin}/checkout/success?orderId=${order.id}`,
    cancel_url: `${origin}/checkout/cancelled?orderId=${order.id}`,
  })

  return { id: session.id, url: session.url }
}

// Verifies the webhook signature over the raw request body. Throws when the
// signature is missing, stale, or does not match the webhook secret.
export function constructWebhookEvent(rawBody, signature) {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured.')
  }
  const stripe = assertStripeConfigured()
  return stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET)
}

// Maps a verified Stripe event to an order transition, or decides it is not a
// payment event. An order may only be marked paid when Stripe itself confirms
// `payment_status === 'paid'` — a redirect to the success page proves nothing.
export function resolveCheckoutAction(event) {
  // Card test payments settle immediately; async methods can complete later
  // via this event instead.
  if (event?.type === 'checkout.session.async_payment_succeeded') {
    const sessionId = typeof event.data?.object?.id === 'string' ? event.data.object.id : null
    if (!sessionId) return { action: 'ignored', sessionId: null }
    return { action: 'paid', sessionId }
  }
  if (event?.type === 'checkout.session.expired') {
    const sessionId = typeof event.data?.object?.id === 'string' ? event.data.object.id : null
    if (!sessionId) return { action: 'ignored', sessionId: null }
    return { action: 'canceled', sessionId }
  }
  if (event?.type !== 'checkout.session.completed') return { action: 'ignored', sessionId: null }

  const session = event.data?.object
  const sessionId = typeof session?.id === 'string' ? session.id : null
  if (!sessionId) return { action: 'ignored', sessionId: null }

  // A completed session does not always mean money arrived (async payment
  // methods can complete with `payment_status: 'unpaid'`). Only a settled
  // payment may mark the order paid.
  const paid = session?.payment_status === 'paid'
  if (!paid) return { action: 'unpaid', sessionId }
  return { action: 'paid', sessionId }
}

// Re-reads a Checkout Session straight from Stripe. Used by "return to payment
// page": the pending order's session can still be paid while it is open, and
// if the payment settled without a webhook arrival, this call doubles as the
// reconciliation path.
export async function retrieveCheckoutSession(sessionId) {
  const stripe = assertStripeConfigured()
  return stripe.checkout.sessions.retrieve(sessionId)
}

// Best-effort expire for a session that no longer belongs to a payable order
// (superseded pending checkouts). Fails harmlessly when the session was
// already paid, completed, or expired — Stripe simply returns an error and the
// payment (if any) continues through the normal webhook path.
export async function expireCheckoutSession(sessionId) {
  if (!sessionId) return false
  try {
    const stripe = assertStripeConfigured()
    await stripe.checkout.sessions.expire(sessionId)
    return true
  } catch {
    return false
  }
}

// Pure decision for resuming a pending order from a re-read session:
// - 'paid'    → the payment settled (mark the order paid, like the webhook)
// - 'open'    → the hosted page is still payable; return its url
// - 'expired' → session completed without payment, expired, or missing url
export function resolveResumeAction(session) {
  if (session?.payment_status === 'paid') return 'paid'
  if (session?.status === 'open' && typeof session?.url === 'string' && session.url.length > 0) return 'open'
  return 'expired'
}
