import useFetch from '../../hooks/useFetch'
import AnimatedNumber from '../../components/AnimatedNumber'
import { cardClass } from './styles'

function BarChart({ data }) {
  if (!data?.length) return <p className="mt-4 text-sm text-muted">No booking activity yet.</p>
  const max = Math.max(...data.map((d) => Number(d.bookings) || 0), 1)
  return (
    <div className="mt-4 flex items-end gap-2">
      {data.map((d) => {
        const height = (Number(d.bookings) / max) * 100
        return (
          <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-40 w-full items-end rounded-xl bg-white/5 light:bg-black/5">
              <div className="w-full rounded-t-xl bg-brand" style={{ height: `${height}%` }} />
            </div>
            <span className="text-xs text-muted">{d.date.slice(5)}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function OverviewPanel({ onNavigate }) {
  const { data, loading, error } = useFetch('/api/dashboard')
  const dashboard = data

  if (loading && !dashboard) {
    return <p className="mt-6 text-muted">Loading dashboard...</p>
  }
  if (error && !dashboard) {
    return <p className="mt-6 text-red-300 light:text-red-700">Could not load dashboard: {error}</p>
  }
  if (!dashboard) return null

  const { totals, trend = [], recentBookings = [], topClasses = [], todayClasses = [] } = dashboard

  return (
    <div className="mt-6 grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-3xl border border-line bg-gradient-to-br from-card to-panel p-6 shadow-lg shadow-black/5">
          <p className="text-sm text-muted">Total Bookings</p>
          <p className="mt-2 text-4xl font-bold"><AnimatedNumber value={totals.bookings} /></p>
          <p className="mt-1 text-sm text-muted"><AnimatedNumber value={totals.bookingSpots} /> spots reserved</p>
        </div>
        <div className="rounded-3xl border border-line bg-gradient-to-br from-card to-panel p-6 shadow-lg shadow-black/5">
          <p className="text-sm text-muted">Occupancy</p>
          <p className="mt-2 text-4xl font-bold"><AnimatedNumber value={totals.occupancy} suffix="%" /></p>
          <p className="mt-1 text-sm text-muted"><AnimatedNumber value={totals.bookedSpots} /> / <AnimatedNumber value={totals.capacity} /> spots</p>
        </div>
        <div className="rounded-3xl border border-line bg-gradient-to-br from-card to-panel p-6 shadow-lg shadow-black/5">
          <p className="text-sm text-muted">Open Spots</p>
          <p className="mt-2 text-4xl font-bold"><AnimatedNumber value={totals.openSpots} /></p>
          <p className="mt-1 text-sm text-muted"><AnimatedNumber value={totals.classes} /> active classes</p>
        </div>
        <div className="rounded-3xl border border-line bg-gradient-to-br from-card to-panel p-6 shadow-lg shadow-black/5">
          <p className="text-sm text-muted">Resources</p>
          <p className="mt-2 text-4xl font-bold"><AnimatedNumber value={totals.trainers} /> / <AnimatedNumber value={totals.plans} /></p>
          <p className="mt-1 text-sm text-muted">
            {totals.users !== null ? <><AnimatedNumber value={totals.users} /> registered users</> : 'User stats restricted'}
          </p>
        </div>
        <div className="rounded-3xl border border-line bg-gradient-to-br from-card to-panel p-6 shadow-lg shadow-black/5">
          <p className="text-sm text-muted">Payments</p>
          <p className="mt-2 text-4xl font-bold"><AnimatedNumber value={totals.paidOrders} /></p>
          <p className="mt-1 text-sm text-muted">
            members paid{totals.pendingOrders > 0 ? <> · <AnimatedNumber value={totals.pendingOrders} /> pending</> : ''}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={cardClass}>
          <h2 className="text-xl font-bold">7-day booking trend</h2>
          <BarChart data={trend} />
        </div>
        <div className={cardClass}>
          <h2 className="text-xl font-bold">Top classes by fill</h2>
          <ul className="mt-4 grid gap-3">
            {topClasses.map((cls) => (
              <li key={cls.id} className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
                <div>
                  <p className="font-semibold">{cls.name}</p>
                  <p className="text-sm text-muted">{cls.day} {cls.time} · {cls.coach}</p>
                </div>
                <span className="rounded-full bg-brand/15 px-3 py-1 text-sm font-semibold text-brand">{cls.fill}%</span>
              </li>
            ))}
            {topClasses.length === 0 && <p className="text-sm text-muted">No classes yet.</p>}
          </ul>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Today's classes</h2>
            <button type="button" onClick={() => onNavigate?.('classes')} className="text-sm text-brand">Manage</button>
          </div>
          <ul className="mt-4 grid gap-2">
            {todayClasses.map((cls) => (
              <li key={cls.id} className="flex items-center justify-between rounded-xl border border-line px-4 py-2">
                <span>{cls.time} · {cls.name}</span>
                <span className="text-sm text-muted">{cls.spots} / {cls.capacity} left</span>
              </li>
            ))}
            {todayClasses.length === 0 && <p className="text-sm text-muted">No classes scheduled today.</p>}
          </ul>
        </div>
        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Recent bookings</h2>
            <button type="button" onClick={() => onNavigate?.('bookings')} className="text-sm text-brand">View all</button>
          </div>
          <ul className="mt-4 grid gap-2">
            {recentBookings.map((booking) => (
              <li key={booking.id} className="flex items-center justify-between rounded-xl border border-line px-4 py-2">
                <div>
                  <p className="font-semibold">{booking.reference}</p>
                  <p className="text-sm text-muted">{booking.name}</p>
                </div>
                <span className="text-sm text-muted">{booking.spots} spots</span>
              </li>
            ))}
            {recentBookings.length === 0 && <p className="text-sm text-muted">No bookings yet.</p>}
          </ul>
        </div>
      </div>
    </div>
  )
}
