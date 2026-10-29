import { Link, useSearchParams } from 'react-router-dom'

export default function CheckoutCancelled() {
  const [params] = useSearchParams()
  const orderId = params.get('orderId')

  return (
    <section className="mx-auto w-full max-w-md px-pad pb-20 pt-32">
      <p className="text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-brand">Checkout</p>
      <h1 className="mt-2 text-[clamp(1.8rem,7vw,2.4rem)] font-bold uppercase text-white light:text-gray-900">
        Payment <span className="text-brand">cancelled</span>
      </h1>
      <p className="mt-4 text-muted">
        You left the checkout page, so nothing was charged. You can pick a plan again whenever you're ready.
      </p>
      {orderId && <p className="mt-2 font-mono text-[0.8rem] text-muted">Order #{orderId}</p>}
      <Link to="/" className="btn mt-6 inline-block">Back to home</Link>
    </section>
  )
}
