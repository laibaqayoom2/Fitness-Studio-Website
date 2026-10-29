import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { apiGet } from '../api'
import { useAuth } from '../auth/AuthContext'

// Waiting for the webhook rather than trusting the redirect: a returned URL is
// not proof of payment, but the verified Stripe event usually lands within a
// second or two. Polling stops after a fixed number of attempts either way.
const MAX_POLLS = 10
const POLL_INTERVAL_MS = 3000

const fmt = (cents, currency) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(cents / 100)

export default function CheckoutSuccess() {
  const [params] = useSearchParams()
  const orderId = params.get('orderId')
  const { user, loading: authLoading } = useAuth()
  const [state, setState] = useState({ phase: 'verifying', order: null, error: null })
  const [resume, setResume] = useState({ busy: false, expired: false })
  const attemptsRef = useRef(0)

  // Lets the member go back to Stripe's hosted page for a still-open session.
  // If Stripe meanwhile reports the payment settled, the server reconciles the
  // order and the page reloads into the paid state.
  const returnToPayment = async () => {
    setResume({ busy: true, expired: false })
    try {
      const data = await apiGet(`/api/orders/${orderId}/checkout-url`)
      if (data.status === 'open' && data.checkoutUrl) {
        window.location.assign(data.checkoutUrl)
        return
      }
      if (data.status === 'paid') {
        window.location.reload()
        return
      }
      setResume({ busy: false, expired: true })
    } catch {
      setResume({ busy: false, expired: true })
    }
  }

  useEffect(() => {
    if (authLoading || !user || !orderId) return

    let stopped = false
    let timer = null

    const poll = async () => {
      if (stopped) return
      try {
        const order = await apiGet(`/api/orders/${orderId}`)
        if (stopped) return

        if (order.status === 'paid') {
          setState({ phase: 'paid', order, error: null })
          return // stop; the verified webhook confirmed the payment
        }
        if (order.status === 'canceled') {
          setState({ phase: 'canceled', order, error: null })
          return
        }

        attemptsRef.current += 1
        if (attemptsRef.current >= MAX_POLLS) {
          setState({ phase: 'pending', order, error: null }) // gave up waiting; webhook may still arrive
          return
        }
        timer = setTimeout(poll, POLL_INTERVAL_MS)
      } catch (e) {
        if (!stopped) setState((prev) => ({ ...prev, phase: 'error', error: e.message }))
      }
    }

    poll()
    return () => {
      stopped = true
      clearTimeout(timer)
    }
  }, [orderId, user?.id, authLoading, user])

  if (authLoading) {
    return <section className="pt-32 pb-20 text-center text-muted">Loading...</section>
  }

  if (!user) {
    return (
      <section className="mx-auto w-full max-w-md px-pad pb-20 pt-32">
        <p className="text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-brand">Checkout</p>
        <h1 className="mt-2 text-[clamp(1.8rem,7vw,2.4rem)] font-bold uppercase text-white light:text-gray-900">Your order</h1>
        <p className="mt-4 text-muted">Log in to view this order's status.</p>
        <Link to={`/login?redirect=${encodeURIComponent(`/checkout/success?orderId=${orderId ?? ''}`)}`} className="btn mt-6 inline-block">
          Log in
        </Link>
      </section>
    )
  }

  if (!orderId) {
    return (
      <section className="mx-auto w-full max-w-md px-pad pb-20 pt-32">
        <p className="text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-brand">Checkout</p>
        <h1 className="mt-2 text-[clamp(1.8rem,7vw,2.4rem)] font-bold uppercase text-white light:text-gray-900">No order found</h1>
        <Link to="/" className="btn mt-6 inline-block">Back to home</Link>
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-md px-pad pb-20 pt-32">
      <p className="text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-brand">Checkout</p>
      <h1 className="mt-2 text-[clamp(1.8rem,7vw,2.4rem)] font-bold uppercase text-white light:text-gray-900">
        {state.phase === 'paid' ? <>Payment <span className="text-brand">confirmed</span></> : state.phase === 'canceled' ? 'Order not completed' : 'Finalising your payment'}
      </h1>

      <div className="mt-7 rounded-3xl border border-line bg-card p-6 text-[0.9rem] shadow-xl shadow-black/5">
        {state.phase === 'paid' && (
          <>
            <p role="status" className="text-soft">
              Thank you! Your membership is confirmed. Reference{' '}
              <strong className="font-mono text-white light:text-gray-900">{state.order.reference}</strong>.
            </p>
            <p className="mt-2 text-[0.85rem] text-muted">
              Paid {fmt(state.order.amountTotal, state.order.currency)} &middot; {state.order.items?.[0]?.planName}
              {state.order.items?.[0]?.quantity > 1 ? ` × ${state.order.items[0].quantity}` : ''}
            </p>
            <Link to="/" className="btn mt-6 inline-block">Back to home</Link>
          </>
        )}

        {state.phase === 'pending' && (
          <>
            <p role="status" className="text-soft">
              Your payment confirmation is still arriving from Stripe. It usually only takes a moment.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button type="button" onClick={returnToPayment} disabled={resume.busy} className="btn px-5 py-2 text-[0.85rem] disabled:opacity-50">
                {resume.busy ? 'Checking…' : 'Return to payment page'}
              </button>
              <Link to="/" className="text-[0.85rem] text-brand transition hover:opacity-80">Back to home</Link>
            </div>
            {resume.expired && (
              <p className="mt-3 text-[0.85rem] text-red-300 light:text-red-700">
                This checkout link has expired. Choose a plan again on the{' '}
                <Link to="/#membership" className="text-brand">membership page</Link>.
              </p>
            )}
          </>
        )}

        {state.phase === 'verifying' && (
          <p role="status" className="text-muted">Verifying your payment with Stripe...</p>
        )}

        {state.phase === 'error' && (
          <>
            <p role="alert" className="text-red-300 light:text-red-700">Could not check your order status{state.error ? ` (${state.error})` : ''}.</p>
            <Link to="/" className="btn mt-6 inline-block">Back to home</Link>
          </>
        )}

        {state.phase === 'canceled' && (
          <>
            <p className="text-soft">This checkout was not completed, so nothing was charged.</p>
            <Link to="/" className="btn mt-6 inline-block">Back to plans</Link>
          </>
        )}
      </div>
    </section>
  )
}
