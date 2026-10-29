import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

// Notifications are derived from the member's own bookings and plan orders —
// a confirmed class booking or a completed (or pending) plan payment appears
// here automatically. "Clear all" records the timestamp up to which items are
// considered read, per signed-in user, in localStorage. No database changes.
//
// datasets: [{ id, bookings?, orders?, loading, error }]
const clearedKey = (userId) => `ffl-notifications-cleared-${userId}`

function buildNotifications({ bookings, orders }) {
  const items = []
  for (const booking of bookings ?? []) {
    const first = booking.items?.[0]
    const extra = booking.items?.length > 1 ? ` +${booking.items.length - 1} more` : ''
    items.push({
      key: `booking-${booking.id}`,
      at: new Date(booking.createdAt).getTime(),
      title: `Booking ${booking.reference}`,
      detail: first
        ? `${first.day} ${first.time} · ${first.name} × ${first.spots}${extra}`
        : 'Class booking confirmed',
      to: '/account',
      icon: '✓',
    })
  }
  for (const order of orders ?? []) {
    const first = order.items?.[0]
    const plan = first ? `${first.planName}${first.quantity > 1 ? ` × ${first.quantity}` : ''}` : 'Membership plan'
    const amount = new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency || 'USD' })
      .format((order.amountTotal ?? 0) / 100)
    if (order.status === 'paid') {
      items.push({
        key: `order-${order.id}`,
        at: new Date(order.paidAt ?? order.createdAt).getTime(),
        title: 'Membership purchased',
        detail: `${plan} — ${amount}`,
        to: '/account',
        icon: '★',
      })
    } else if (order.status === 'pending') {
      items.push({
        key: `order-${order.id}`,
        at: new Date(order.createdAt).getTime(),
        title: 'Payment pending',
        detail: `${plan} — waiting for confirmation`,
        to: '/account',
        icon: '…',
      })
    }
  }
  return items.sort((a, b) => b.at - a.at).slice(0, 8)
}

export default function Notifications({datasets = [], userId}) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  // "Cleared up to" comes from per-user localStorage via a lazy initializer so
  // the unread badge is correct on the very first render.
  const [clearedAt, setClearedAt] = useState(() =>
    userId ? Number(localStorage.getItem(clearedKey(userId)) ?? 0) : null)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onPointerDown = (e) => {
      if (!menuRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  const items = datasets.flatMap(buildNotifications)
    .sort((a, b) => b.at - a.at)
    .slice(0, 8)
  const unread = clearedAt === null ? [] : items.filter((item) => item.at > clearedAt)
  const badgeCount = clearedAt === null ? 0 : unread.length

  const clearAll = () => {
    const until = Date.now()
    localStorage.setItem(clearedKey(userId), String(until))
    setClearedAt(until)
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="member-notifications"
        aria-label={`Notifications${badgeCount > 0 ? `, ${badgeCount} new` : ''}`}
        onClick={() => {
          const stored = Number(localStorage.getItem(clearedKey(userId)) ?? 0)
          setClearedAt(stored)
          setOpen((value) => !value)
        }}
        className="relative grid size-9 place-items-center rounded-full border border-line text-soft transition hover:border-brand light:text-gray-700"
      >
        <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {badgeCount > 0 && (
          <span aria-hidden="true" className="absolute -right-1 -top-1 grid size-4.5 place-items-center rounded-full bg-brand text-[0.6rem] font-bold text-ink">
            {badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div
          id="member-notifications"
          className="absolute right-0 top-full z-30 mt-3 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-line bg-card p-4 text-white shadow-2xl light:text-gray-900"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[0.9rem] font-bold">Notifications</h2>
            {badgeCount > 0 ? (
              <button type="button" onClick={clearAll} className="text-[0.7rem] text-brand transition hover:opacity-80">
                Clear all ({badgeCount})
              </button>
            ) : (
              <span className="text-[0.7rem] text-muted">All caught up</span>
            )}
          </div>

          <div className="mt-3 max-h-80 overflow-y-auto pr-1">
            {datasets.some((d) => d.loading) && <p className="text-[0.8rem] text-muted">Loading…</p>}
            {datasets.some((d) => d.error) && (
              <p role="alert" className="text-[0.8rem] text-red-300 light:text-red-700">Could not load notifications.</p>
            )}
            {!datasets.some((d) => d.loading || d.error) && items.length === 0 && (
              <p className="text-[0.8rem] text-muted">
                Nothing yet. Book a class or grab a plan and updates land here.
              </p>
            )}
            <ul className="grid gap-2">
              {items.map((item) => {
                const isNew = clearedAt !== null && item.at > clearedAt
                return (
                  <li key={item.key}>
                    <Link
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className={`flex items-start gap-3 rounded-xl px-3 py-2.5 transition hover:bg-white/5 light:hover:bg-black/5 ${isNew ? 'bg-white/5 light:bg-black/5' : ''}`}
                    >
                      <span aria-hidden="true" className={`mt-0.5 grid size-6 flex-none place-items-center rounded-full text-[0.7rem] font-bold ${isNew ? 'bg-brand/15 text-brand' : 'bg-white/5 text-muted light:bg-black/5'}`}>
                        {item.icon}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[0.8rem] font-semibold">{item.title}</span>
                        <span className="block truncate text-[0.72rem] text-muted">{item.detail}</span>
                        <time className="block text-[0.65rem] text-muted">
                          {new Date(item.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </time>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
          <Link to="/account" onClick={() => setOpen(false)} className="mt-3 block text-center text-[0.75rem] text-brand transition hover:opacity-80">
            View my account →
          </Link>
        </div>
      )}
    </div>
  )
}
