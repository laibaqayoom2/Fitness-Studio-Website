// Integration tests for the order persistence layer. They touch a real
// PostgreSQL database and are therefore SKIPPED unless TEST_DATABASE_URL is
// set. The database only needs product/user tables; the suite creates its own
// users and orders and removes them afterwards (no demo data is touched).
import crypto from 'node:crypto'
import fs from 'node:fs'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Pool } from 'pg'

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL
const runIfDatabase = Boolean(TEST_DATABASE_URL)

describe.skipIf(!runIfDatabase)('orders persistence (integration)', () => {
  let pool
  let ordersModule
  const suffix = crypto.randomUUID().slice(0, 8)
  let userA
  let userB
  let plan

  beforeAll(async () => {
    // Point the app's own pool (db.js → config.js) at the integration database
    // before any module that reads DATABASE_URL is imported.
    process.env.DATABASE_URL = TEST_DATABASE_URL
    ordersModule = await import('./orders.js')

    pool = new Pool({ connectionString: TEST_DATABASE_URL, ssl: { rejectUnauthorized: false } })
    // Apply the idempotent schema so the migration itself is also exercised.
    await pool.query(fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'))

    const { rows: [a] } = await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,'scrypt:0:0','member') RETURNING id",
      [`Test User A ${suffix}`, `a-${suffix}@orders.test`])
    const { rows: [b] } = await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,'scrypt:0:0','member') RETURNING id",
      [`Test User B ${suffix}`, `b-${suffix}@orders.test`])
    userA = a
    userB = b

    const { rows: [p] } = await pool.query('SELECT id, name, price FROM plans ORDER BY id LIMIT 1')
    if (!p) throw new Error('Integration database has no plans; run the seed first.')
    plan = p
  })

  afterAll(async () => {
    // Remove everything the suite created (orders cascade from users).
    if (pool) {
      await pool.query('DELETE FROM users WHERE id = ANY($1::int[])',
        [userA && userB ? [userA.id, userB.id] : []]).catch(() => {})
      await pool.end().catch(() => {})
    }
  })

  it('creates a pending order snapshotting the product and price at purchase time', async () => {
    const order = await ordersModule.createOrder({ userId: userA.id, plan, quantity: 2 })
    expect(order.status).toBe('pending')
    expect(order.amount_total).toBe(plan.price * 2 * 100)
    expect(order.items[0].unitAmount).toBe(plan.price * 100)
    expect(order.items[0].quantity).toBe(2)
    expect(order.stripe_session_id).toBeUndefined() // set later, when Stripe is contacted
  })

  it('lets a user read their own order', async () => {
    const created = await ordersModule.createOrder({ userId: userA.id, plan, quantity: 1 })
    const fetched = await ordersModule.getOrderForUser(created.id, userA.id)
    expect(fetched?.id).toBe(created.id)
    expect(fetched.items[0].planName).toBe(plan.name)
  })

  it('hides another user\'s order behind a 404, never exposing it', async () => {
    const created = await ordersModule.createOrder({ userId: userA.id, plan, quantity: 1 })
    const fetchedByOwner = await ordersModule.getOrderForUser(created.id, userA.id)
    expect(fetchedByOwner).not.toBeNull()

    const fetchedByStranger = await ordersModule.getOrderForUser(created.id, userB.id)
    expect(fetchedByStranger).toBeNull() // treated as "not found" for this caller
  })

  it('marks an order paid exactly once (duplicate webhook deliveries are idempotent)', async () => {
    const created = await ordersModule.createOrder({ userId: userA.id, plan, quantity: 1 })
    await pool.query('UPDATE orders SET stripe_session_id = $1 WHERE id = $2', ['cs_test_idem_1', created.id])

    const event = {
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_test_idem_1', payment_status: 'paid', status: 'complete' } },
    }

    const first = await ordersModule.markOrderPaid('cs_test_idem_1')
    expect(first.status).toBe('paid')

    const second = await ordersModule.markOrderPaid('cs_test_idem_1') // duplicate delivery
    expect(second).toBeNull() // no second transition

    const shouldMark = ordersModule.shouldMarkOrderPaid('paid', event)
    expect(shouldMark).toBe(false) // idempotency guard also refuses already-paid orders

    const { rows: [finalOrder] } = await pool.query('SELECT status, paid_at FROM orders WHERE id = $1', [created.id])
    expect(finalOrder.status).toBe('paid')
    expect(finalOrder.paid_at).not.toBeNull()
  })

  it('cancels a pending same-plan checkout superseded by a fresh one (and never touches paid orders)', async () => {
    const old = await ordersModule.createOrder({ userId: userA.id, plan, quantity: 1 })
    const fresh = await ordersModule.createOrder({ userId: userA.id, plan, quantity: 1 })
    await pool.query('UPDATE orders SET stripe_session_id = $1 WHERE id = $2', ['cs_test_supersede_old', old.id])
    await pool.query('UPDATE orders SET stripe_session_id = $1 WHERE id = $2', ['cs_test_supersede_fresh', fresh.id])

    // No Stripe client misuse: expire is best-effort and succeeds or is skipped.
    // Every other pending same-plan order of this member is superseded (the
    // suite's earlier tests may have left several), the fresh one never is.
    const { rows: [{ n: pendingBefore }] } = await pool.query(
      `SELECT COUNT(*)::int AS n FROM orders o
       JOIN order_items i ON i.order_id = o.id
       WHERE o.user_id = $1 AND o.status = 'pending' AND o.id <> $2 AND i.plan_id = $3`,
      [userA.id, fresh.id, plan.id])
    const canceled = await ordersModule.cancelSupersededCheckouts({
      userId: userA.id, keepOrderId: fresh.id, planId: plan.id,
    })

    expect(canceled).toBe(pendingBefore)
    const { rows } = await pool.query(
      'SELECT id, status FROM orders WHERE id = ANY($1::int[]) ORDER BY id', [[old.id, fresh.id]])
    expect(rows.map((r) => `${r.id}:${r.status}`)).toEqual([`${old.id}:canceled`, `${fresh.id}:pending`])
  })

  it('records a real payment for an order already canceled as superseded', async () => {
    const created = await ordersModule.createOrder({ userId: userA.id, plan, quantity: 1 })
    await pool.query('UPDATE orders SET stripe_session_id = $1, status = $2 WHERE id = $3',
      ['cs_test_canceled_paid', 'canceled', created.id])

    const marked = await ordersModule.markOrderPaid('cs_test_canceled_paid')
    expect(marked?.status).toBe('paid') // the verified webhook recorded the real payment

    const second = await ordersModule.markOrderPaid('cs_test_canceled_paid')
    expect(second).toBeNull() // duplicate delivery no-op
  })

  it('refuses to mark an order paid without a settled Stripe payment', async () => {
    const created = await ordersModule.createOrder({ userId: userB.id, plan, quantity: 1 })
    await pool.query('UPDATE orders SET stripe_session_id = $1 WHERE id = $2', ['cs_test_unpaid_1', created.id])

    // A session that completed without settled money: the same guard logic the
    // webhook endpoint runs before it would ever call markOrderPaid.
    const event = {
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_test_unpaid_1', payment_status: 'unpaid', status: 'complete' } },
    }
    expect(ordersModule.shouldMarkOrderPaid('pending', event)).toBe(false)

    // Simulating the endpoint: no 'paid' action → the handler never calls
    // markOrderPaid. The order must still be pending afterwards.
    const { rows: [stillPending] } = await pool.query('SELECT status FROM orders WHERE id = $1', [created.id])
    expect(stillPending.status).toBe('pending')
  })
})
