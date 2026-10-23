import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

function totals(bookings) {
  const list = bookings ?? []
  return {
    count: list.length,
    spots: list.reduce((sum, booking) => sum + (booking.totalSpots ?? 0), 0),
  }
}

function BookingList({ bookings, loading, error, onNavigate }) {
  if (loading) return <p className="text-[0.8rem] text-muted">Loading bookings...</p>
  if (error) return <p role="alert" className="text-[0.8rem] text-red-300">Could not load your bookings.</p>
  if (!bookings?.length) {
    return (
      <div className="text-[0.8rem] text-muted">
        <p>No bookings yet.</p>
        <Link to="/#schedule" onClick={onNavigate} className="mt-2 inline-block text-brand transition hover:text-white">
          Browse the schedule
        </Link>
      </div>
    )
  }

  return (
    <ul className="grid gap-3">
      {bookings.map((booking) => (
        <li key={booking.id} className="rounded-2xl border border-line bg-ink/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-[0.75rem] font-semibold text-white">{booking.reference}</p>
            <p className="text-[0.7rem] text-muted">{booking.totalSpots} {booking.totalSpots === 1 ? 'spot' : 'spots'}</p>
          </div>
          <ul className="mt-1.5 grid gap-1 text-[0.75rem] text-soft">
            {booking.items.map((item) => (
              <li key={item.classId}>
                {item.day} {item.time} &middot; {item.name} <span className="text-white">&times; {item.spots}</span>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-[0.7rem] text-muted">
            Booked {new Date(booking.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </p>
        </li>
      ))}
    </ul>
  )
}

export function MemberBookingsMenu({ bookings, loading, error }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const { count, spots } = totals(bookings)
  const close = () => setOpen(false)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e) => { if (e.key === 'Escape') setOpen(false) }
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

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="member-bookings"
        aria-label={`My bookings${count > 0 ? `, ${count} reservations` : ''}`}
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-full border border-line px-4 py-2 text-[0.8rem] text-white transition hover:border-brand"
      >
        My bookings
        {count > 0 && (
          <span aria-hidden="true" className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-brand text-[0.65rem] font-bold text-ink">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div
          id="member-bookings"
          className="absolute right-0 top-full z-30 mt-3 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-line bg-card p-4 shadow-2xl"
        >
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-[0.9rem] font-bold">Your bookings</h2>
            {count > 0 && (
              <p className="text-[0.7rem] text-muted">{spots} {spots === 1 ? 'spot' : 'spots'}</p>
            )}
          </div>
          <div className="mt-3 max-h-72 overflow-y-auto pr-1">
            <BookingList bookings={bookings} loading={loading} error={error} onNavigate={close} />
          </div>
        </div>
      )}
    </div>
  )
}

export function MemberBookingsInline({ bookings, loading, error, onNavigate }) {
  const { count, spots } = totals(bookings)

  return (
    <details className="rounded-2xl border border-line">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-2 text-[0.85rem] text-white [&::-webkit-details-marker]:hidden">
        <span>
          My bookings{count > 0 && <span className="ml-1 text-brand">({count})</span>}
        </span>
        {count > 0 && (
          <span className="text-[0.75rem] text-muted">{spots} {spots === 1 ? 'spot' : 'spots'}</span>
        )}
      </summary>
      <div className="px-4 pb-4 pt-1">
        <BookingList bookings={bookings} loading={loading} error={error} onNavigate={onNavigate} />
      </div>
    </details>
  )
}
