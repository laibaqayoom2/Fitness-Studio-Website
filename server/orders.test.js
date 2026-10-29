import { describe, expect, it } from 'vitest'
import {
  parseCheckoutInput,
  calculateTotals,
  shouldMarkOrderPaid,
} from './orders.js'

const paidCompletedEvent = {
  type: 'checkout.session.completed',
  data: { object: { id: 'cs_test_123', payment_status: 'paid', status: 'complete' } },
}
const unpaidCompletedEvent = {
  type: 'checkout.session.completed',
  data: { object: { id: 'cs_test_456', payment_status: 'unpaid', status: 'open' } },
}

describe('parseCheckoutInput', () => {
  it('accepts a valid plan id and defaults the quantity to 1', () => {
    const parsed = parseCheckoutInput({ planId: 2 })
    expect(parsed).toEqual({ value: { planId: 2, quantity: 1 } })
  })

  it('accepts a sane explicit quantity', () => {
    expect(parseCheckoutInput({ planId: 2, quantity: 3 })).toEqual({ value: { planId: 2, quantity: 3 } })
  })

  it('rejects invalid product ids', () => {
    for (const bad of [null, undefined, 'abc', '2', 0, -5, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
      expect(parseCheckoutInput({ planId: bad }).error).toBeTruthy()
    }
  })

  it('rejects invalid quantities', () => {
    for (const bad of [0, -3, 1.5, 'two', 101, true]) {
      expect(parseCheckoutInput({ planId: 2, quantity: bad }).error).toBeTruthy()
    }
  })

  it('ignores client-supplied price data (tamper attempt)', () => {
    // The hacker payload: fake price, fake total, fake user id. None of these
    // may reach the order — the server loads price and user from its own stores.
    const parsed = parseCheckoutInput({
      planId: 3,
      quantity: 2,
      price: 1,
      amountTotal: 1,
      total: 1,
      unitAmount: 1,
      userId: 999,
      user_id: 999,
    })
    expect(parsed.error).toBeUndefined()
    expect(parsed.value).toEqual({ planId: 3, quantity: 2 })
  })
})

describe('calculateTotals', () => {
  it('prices the order from the database plan row, converting dollars to cents', () => {
    const plan = { id: 3, name: 'Premium', price: 45 }
    expect(calculateTotals(plan, 1)).toEqual({ unitAmount: 4500, quantity: 1, total: 4500 })
    expect(calculateTotals(plan, 3)).toEqual({ unitAmount: 4500, quantity: 3, total: 13500 })
  })

  it('never reflects a client-sent price', () => {
    const serverPlan = { id: 2, name: 'Standard', price: 35 }
    expect(calculateTotals(serverPlan, 2).total).toBe(7000) // not 2 * some "price: 1"
  })
})

describe('shouldMarkOrderPaid (idempotent payment transitions)', () => {
  it('transitions a pending order when Stripe confirms the payment', () => {
    expect(shouldMarkOrderPaid('pending', paidCompletedEvent)).toBe(true)
  })

  it('no-ops on duplicate success deliveries (order already paid)', () => {
    expect(shouldMarkOrderPaid('paid', paidCompletedEvent)).toBe(false)
  })

  it('lets a verified settled payment record a superseded-canceled order', () => {
    // Supersede race: canceled as re-purchased, but the member paid the old
    // session before it expired. The verified webhook still records it.
    expect(shouldMarkOrderPaid('canceled', paidCompletedEvent)).toBe(true)
  })

  it('never marks anything paid when the payment itself is not settled', () => {
    expect(shouldMarkOrderPaid('pending', unpaidCompletedEvent)).toBe(false)
    expect(shouldMarkOrderPaid('canceled', unpaidCompletedEvent)).toBe(false)
  })

  it('ignores unrelated Stripe events', () => {
    expect(shouldMarkOrderPaid('pending', { type: 'payment_intent.succeeded', data: { object: {} } })).toBe(false)
    expect(shouldMarkOrderPaid('pending', null)).toBe(false)
  })
})
