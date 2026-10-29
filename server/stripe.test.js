import crypto from 'node:crypto'
import { afterEach, describe, expect, it } from 'vitest'
import { constructWebhookEvent, resolveCheckoutAction } from './stripe.js'
import { env } from './config.js'

const secret = env.STRIPE_WEBHOOK_SECRET

function sign(payload, timestampSeconds = Math.floor(Date.now() / 1000)) {
  const hmac = crypto.createHmac('sha256', secret).update(`${timestampSeconds}.${payload}`).digest('hex')
  return `t=${timestampSeconds},v1=${hmac}`
}

const completedEvent = {
  id: 'evt_test_1',
  type: 'checkout.session.completed',
  data: { object: { id: 'cs_test_123', payment_status: 'paid', status: 'complete' } },
}

describe('constructWebhookEvent signature verification', () => {
  it('accepts a correctly signed payload', () => {
    const payload = Buffer.from(JSON.stringify(completedEvent))
    const event = constructWebhookEvent(payload, sign(payload))
    expect(event.type).toBe('checkout.session.completed')
    expect(event.data.object.id).toBe('cs_test_123')
  })

  it('rejects a tampered payload (signature no longer matches the body)', () => {
    const payload = Buffer.from(JSON.stringify(completedEvent))
    const tampered = Buffer.from(JSON.stringify({ ...completedEvent, id: 'evt_tampered' }))
    expect(() => constructWebhookEvent(tampered, sign(payload))).toThrow()
  })

  it('rejects a wrong signature', () => {
    const payload = Buffer.from(JSON.stringify(completedEvent))
    expect(() => constructWebhookEvent(payload, 't=1,v1=deadbeef')).toThrow()
  })

  it('rejects a missing signature header', () => {
    const payload = Buffer.from(JSON.stringify(completedEvent))
    expect(() => constructWebhookEvent(payload, undefined)).toThrow()
  })
})

describe('resolveCheckoutAction', () => {
  it('marks paid on a confirmed completed session', () => {
    expect(resolveCheckoutAction(completedEvent)).toEqual({ action: 'paid', sessionId: 'cs_test_123' })
  })

  it('does not mark paid when the session completed without a settled payment', () => {
    const event = {
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_test_9', payment_status: 'unpaid', status: 'complete' } },
    }
    expect(resolveCheckoutAction(event).action).toBe('unpaid')
  })

  it('marks paid when an async payment settles later', () => {
    const event = { type: 'checkout.session.async_payment_succeeded', data: { object: { id: 'cs_test_8' } } }
    expect(resolveCheckoutAction(event)).toEqual({ action: 'paid', sessionId: 'cs_test_8' })
  })

  it('treats expired sessions as canceled', () => {
    const event = { type: 'checkout.session.expired', data: { object: { id: 'cs_test_7' } } }
    expect(resolveCheckoutAction(event)).toEqual({ action: 'canceled', sessionId: 'cs_test_7' })
  })

  it('ignores unrelated events', () => {
    expect(resolveCheckoutAction({ type: 'payment_intent.created', data: { object: {} } }).action).toBe('ignored')
    expect(resolveCheckoutAction(null).action).toBe('ignored')
  })
})

afterEach(() => {
  // no global mutation; kept for future server-level tests
})
