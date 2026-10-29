import crypto from 'node:crypto'
import pool from './db.js'
import { resolveCheckoutAction, expireCheckoutSession } from './stripe.js'

// ---------- Checkout validation (pure, unit-testable) ----------

// The request body is only ever a shopping intent: which plan and how many.
// Anything that looks like state — prices, totals, user ids — is ignored on
// purpose, so a tampered client cannot influence what the server charges.
export function parseCheckoutInput(body) {
  const planId = body?.planId
  if (!Number.isInteger(planId) || planId <= 0 || planId > 1_000_000_000) {
    return { error: 'Choose a valid plan.' }
  }

  // Quantity defaults to 1; when provided it must be a sane whole number.
  let quantity = 1
  if (body?.quantity !== undefined && body?.quantity !== null) {
    quantity = body.quantity
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      return { error: 'Quantity must be a whole number between 1 and 100.' }
    }
  }

  return { value: { planId, quantity } }
}

// Totals are always computed from the plan row loaded from the database.
// `plans.price` stores whole dollars ("$25 / month"), while the Stripe API
// expects minor units, so the conversion happens here — still entirely on the
// server, from data the client never controlled.
export function calculateTotals(plan, quantity) {
  const unitAmount = Math.round(Number(plan.price) * 100)
  return {
    unitAmount,
    quantity,
    total: unitAmount * quantity,
  }
}

// ---------- Order lifecycle (database) ----------

export function generateOrderReference() {
  return `FFL-${crypto.randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`
}

export async function createOrder({ userId, plan, quantity }) {
  const totals = calculateTotals(plan, quantity)
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const { rows: [order] } = await client.query(
      `INSERT INTO orders (reference, user_id, status, amount_total, currency)
       VALUES ($1,$2,'pending',$3,$4) RETURNING id, reference, status, amount_total, currency, created_at`,
      [generateOrderReference(), userId, totals.total, 'usd'])

    await client.query(
      `INSERT INTO order_items (order_id, plan_id, plan_name, quantity, unit_amount)
       VALUES ($1,$2,$3,$4,$5)`,
      [order.id, plan.id, plan.name, quantity, totals.unitAmount])

    await client.query('COMMIT')
    return {
      ...order,
      items: [{ planId: plan.id, planName: plan.name, quantity, unitAmount: totals.unitAmount }],
    }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// Payments are only ever confirmed by a verified Stripe webhook, never by the
// browser landing on the success page. The update applies to orders still
// `pending` and — deliberately — to ones we just canceled as superseded: if
// Stripe reports a settled payment for such an order (the member paid from an
// open checkout tab before it was expired), the payment is real and must be
// recorded. Either way duplicate deliveries are harmless: the second one finds
// no row to transition.
export async function markOrderPaid(sessionId) {
  const { rows: [order] } = await pool.query(
    `UPDATE orders
     SET status = 'paid', paid_at = COALESCE(paid_at, now())
     WHERE stripe_session_id = $1 AND status IN ('pending', 'canceled')
     RETURNING id, status`,
    [sessionId])
  return order ?? null
}

export async function markOrderCanceled(sessionId) {
  const { rows: [order] } = await pool.query(
    `UPDATE orders SET status = 'canceled'
     WHERE stripe_session_id = $1 AND status = 'pending'
     RETURNING id, status`,
    [sessionId])
  return order ?? null
}

// Given the current order status and a verified event, decide whether the
// order should transition. Kept as a pure function so idempotency rules are
// unit-testable without a database.
// Given the current order status and a verified event, decide whether the
// order should transition. Kept as a pure function so idempotency rules are
// unit-testable without a database. `canceled` orders may still be marked
// paid by a verified settled payment (supersede race), but never if the event
// does not itself prove payment.
export function shouldMarkOrderPaid(orderStatus, event) {
  if (orderStatus === 'paid') return false // duplicate delivery
  if (orderStatus !== 'pending' && orderStatus !== 'canceled') return false
  return resolveCheckoutAction(event).action === 'paid'
}

// ---------- Superseding abandoned checkouts ----------

// A re-purchase of the same plan makes the member's older still-pending
// checkout obsolete. Rules:
//  - the new (kept) order is never touched;
//  - earlier pending orders for the SAME plan are canceled, as requested,
//    when the re-purchase happens within 3 DAYS of the pending one;
//  - any membership pending older than 3 days is stale and canceled too;
//  - paid or canceled orders are never modified.
// Because a canceled order must never be paid afterwards, its Stripe session
// is first expired (best-effort: if Stripe cannot expire it — e.g. it was
// already paid — the payment follows the normal webhook path to 'paid').
export async function cancelSupersededCheckouts({ userId, keepOrderId, planId }) {
  const { rows: pending } = await pool.query(
    `SELECT o.id, o.stripe_session_id FROM orders o
     JOIN order_items i ON i.order_id = o.id
     WHERE o.user_id = $1 AND o.status = 'pending' AND o.id <> $2
       AND (i.plan_id = $3
            OR o.created_at < now() - interval '3 days')`,
    [userId, keepOrderId, planId])

  let canceled = 0
  for (const row of pending) {
    await expireCheckoutSession(row.stripe_session_id) // best-effort
    const { rowCount } = await pool.query(
      `UPDATE orders SET status = 'canceled'
       WHERE id = $1 AND status = 'pending'`,
      [row.id])
    canceled += rowCount
  }
  return canceled
}

// ---------- Reads ----------

// Ownership is enforced in SQL: another user's order simply does not exist
// from this caller's perspective (a 404, never a 403 that would leak ids).
export async function getOrderForUser(orderId, userId) {
  const { rows: [order] } = await pool.query(
    `SELECT id, reference, user_id, status, stripe_session_id, amount_total, currency, created_at, paid_at
     FROM orders
     WHERE id = $1 AND user_id = $2`,
    [orderId, userId])
  if (!order) return null

  const { rows: items } = await pool.query(
    `SELECT plan_id, plan_name, quantity, unit_amount
     FROM order_items
     WHERE order_id = $1
     ORDER BY id`,
    [orderId])

  return {
    id: order.id,
    reference: order.reference,
    status: order.status,
    stripeSessionId: order.stripe_session_id,
    amountTotal: order.amount_total,
    currency: order.currency,
    createdAt: order.created_at,
    paidAt: order.paid_at,
    items: items.map((item) => ({
      planId: item.plan_id,
      planName: item.plan_name,
      quantity: item.quantity,
      unitAmount: item.unit_amount,
    })),
  }
}
