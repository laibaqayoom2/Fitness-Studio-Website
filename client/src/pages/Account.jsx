import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import useFetch from '../hooks/useFetch'
import { BookingList } from '../components/MemberBookings'

// A plan is treated as a 30-day membership counted from the moment the webhook
// confirmed the payment. Past that date the card shows "renew" instead of
// "active" — nothing is cancelled server-side, it is just no longer current.
const TERM_DAYS = 30

const fmtMoney = (cents, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100)

function addDays(date, days) {
  const done = new Date(date)
  done.setDate(done.getDate() + days)
  return done
}

// Returns the best "membership": the most recent paid order. `null` means the
// member has not completed a purchase yet.
function currentMembership(orders) {
  return (orders ?? []).find((order) => order.status === 'paid') ?? null
}

function MembershipCard({ orders, loading, error }) {
  if (loading) return <p className="text-[0.85rem] text-muted">Loading membership…</p>
  if (error) {
    return (
      <p role="alert" className="text-[0.85rem] text-red-300 light:text-red-700">
        Could not load your membership ({error}).
      </p>
    )
  }

  const membership = currentMembership(orders)
  if (!membership) {
    return (
      <div className="text-[0.85rem] text-muted">
        <p>You don't have an active membership yet.</p>
        <Link to="/#membership" className="btn mt-4 inline-block px-5 py-2 text-[0.85rem]">
          Browse plans
        </Link>
      </div>
    )
  }

  const item = membership.items?.[0]
  const planName = item?.planName ?? 'Membership plan'
  const price = fmtMoney(item?.unitAmount ?? membership.amountTotal / Math.max(item?.quantity ?? 1, 1), membership.currency)
  const renewal = addDays(membership.paidAt ?? membership.createdAt, TERM_DAYS)
  // Display-only badge: whether the 30-day term from the paid date is still
  // running. No way around reading the wall clock for this comparison.
  // eslint-disable-next-line react-hooks/purity
  const active = renewal.getTime() > Date.now()

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div>
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-muted">Plan</p>
        <p className="mt-1 text-[1.4rem] font-bold text-white light:text-gray-900">{planName}</p>
        <p className="text-[0.8rem] text-muted">{price} / month</p>
      </div>
      <div>
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-muted">Member since</p>
        <p className="mt-1 text-[1.4rem] font-bold text-white light:text-gray-900">
          {new Date(membership.paidAt ?? membership.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
        <p className="text-[0.8rem] text-muted">Ref {membership.reference}</p>
      </div>
      <div>
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-muted">{active ? 'Renews' : 'Renewed'}</p>
        <p className={`mt-1 text-[1.4rem] font-bold ${active ? 'text-white light:text-gray-900' : 'text-brand'}`}>
          {renewal.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </p>
        <p className="text-[0.8rem] text-muted">
          {active ? 'Membership active' : (
            <Link to="/#membership" className="text-brand transition hover:opacity-80">
              Renew your plan →
            </Link>
          )}
        </p>
      </div>
    </div>
  )
}

export default function Account() {
  const { user, loading: authLoading } = useAuth()
  const { data: bookings, loading: bookingsLoading, error: bookingsError } = useFetch('/api/bookings/mine')
  const { data: orders, loading: ordersLoading, error: ordersError } = useFetch('/api/orders/mine')

  if (authLoading) {
    return <section className="pt-32 pb-20 text-center text-muted">Loading…</section>
  }
  if (!user) {
    return (
      <section className="mx-auto w-full max-w-3xl px-pad pb-20 pt-32">
        <h1 className="text-[clamp(1.8rem,7vw,2.4rem)] font-bold uppercase text-white light:text-gray-900">My account</h1>
        <p className="mt-4 text-muted">Log in to see your bookings and membership.</p>
        <Link to="/login?redirect=/account" className="btn mt-6 inline-block">Log in</Link>
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-pad pb-20 pt-32">
      <p className="text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-brand">Account</p>
      <h1 className="mt-2 text-[clamp(1.8rem,7vw,2.4rem)] font-bold uppercase text-white light:text-gray-900">
        Hi, {user.name.split(' ')[0]}
      </h1>

      <div className="mt-8 rounded-3xl border border-line bg-card p-6 shadow-xl shadow-black/5 sm:p-7">
        <h2 className="text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-muted">Membership</h2>
        <div className="mt-4">
          <MembershipCard orders={orders} loading={ordersLoading} error={ordersError} />
        </div>
      </div>

      {(bookingsLoading || bookings?.length) && (
        <div className="mt-6 rounded-3xl border border-line bg-card p-6 shadow-xl shadow-black/5 sm:p-7">
          <h2 className="text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-muted">
            Class bookings {bookings?.length ? `(${bookings.length})` : ''}
          </h2>
          <div className="mt-4">
            <BookingList bookings={bookings} loading={bookingsLoading} error={bookingsError} />
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[0.85rem] text-muted">
        <Link to="/#schedule" className="text-brand transition hover:opacity-80">Book a class →</Link>
        {bookingsError && <span>Bookings could not load right now.</span>}
      </div>
    </section>
  )
}
