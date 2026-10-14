// src/components/Schedule.jsx
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Panel from './Panel'
import SpotsStepper from './SpotsStepper'
import { CLASSES, CATEGORIES, DAYS } from '../data'

export default function Schedule() {
  const [category, setCategory] = useState('All')      // which filter is active
  const [booked, setBooked] = useState({})             // { [classId]: spots }
  const [confirmedAt, setConfirmedAt] = useState(null) // null, or the Date it was confirmed
  const [view, setView] = useState(null)               // null (closed) | 'review' | 'confirmed'
  const dialogRef = useRef(null)

  const confirmed = confirmedAt !== null
  const visible = category === 'All' ? CLASSES : CLASSES.filter((c) => c.category === category)
  const bookedClasses = CLASSES.filter((c) => (booked[c.id] ?? 0) > 0)
  const total = Object.values(booked).reduce((sum, n) => sum + n, 0)
  const plural = total === 1 ? 'spot' : 'spots'

  // Keep the native <dialog> in sync with the `view` state
  useEffect(() => {
    const d = dialogRef.current
    if (view && !d.open) d.showModal()
    else if (!view && d.open) d.close()
  }, [view])

  // Changing any stepper means the booking is no longer the confirmed one
  const setSpots = (id, n) => {
    setConfirmedAt(null)
    setBooked((prev) => ({ ...prev, [id]: n }))
  }
  const clearBooking = () => {
    setBooked({})
    setConfirmedAt(null)
    setView(null)
  }
  const confirmBooking = () => {
    setConfirmedAt(new Date())
    setView('confirmed')
  }

  const lines = (
    <ul className="mt-3 space-y-1 text-[0.9rem] text-soft">
      {bookedClasses.map((c) => (
        <li key={c.id}>{c.day} {c.time} &middot; {c.name} &times; {booked[c.id]}</li>
      ))}
    </ul>
  )
  const ghost = 'rounded-full border border-line px-5 py-2 text-[0.85rem] transition hover:border-brand'

  return (
    <Panel id="schedule" tone="bg-panel-alt" kicker="Class Schedule"
      title={<>This week on <span className="text-brand">the floor</span></>}>
      <div role="group" aria-label="Filter classes by type" className="mt-8 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)}
            className={`rounded-full px-4 py-2 text-[0.85rem] font-semibold transition ${category === c ? 'bg-brand text-ink' : 'bg-card text-soft hover:text-white'}`}>
            {c}
          </button>
        ))}
      </div>

      <p aria-live="polite" className="mt-4 text-[0.85rem] text-muted">
        {visible.length} classes &middot; {total} {plural} booked
      </p>

      <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(min(100%,19rem),1fr))] gap-3">
        {DAYS.map((day) => {
          const slots = visible.filter((c) => c.day === day)
          if (slots.length === 0) return null
          return (
            <article key={day} className="rounded-2xl bg-card px-4 pb-2 pt-4 transition hover:-translate-y-1 hover:shadow-2xl">
              <h3 className="mb-1 text-[1.1rem] text-brand">{day}</h3>
              <ul>
                {slots.map((c) => (
                  <li key={c.id} className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-x-2.5 border-t border-line py-3 text-[0.9rem] leading-tight">
                    <time className="text-muted tabular-nums">{c.time}</time>
                    <div className="min-w-0">
                      <strong className="block font-semibold">{c.name}</strong>
                      <span className="text-[0.75rem] text-muted">{c.coach}</span>
                    </div>
                    <SpotsStepper label={`Spots for ${c.name} on ${day}`} max={c.spots}
                      value={booked[c.id] ?? 0} onChange={(n) => setSpots(c.id, n)} />
                  </li>
                ))}
              </ul>
            </article>
          )
        })}
      </div>

      {/* Sticky bar: appears once something is selected and the dialog is closed */}
      {total > 0 && view === null && createPortal(
        <div className="fixed inset-x-4 bottom-4 z-30 mx-auto flex max-w-lg items-center justify-between gap-3 rounded-full border border-brand/40 bg-card py-2 pl-5 pr-2 shadow-2xl print:hidden">
          <p className="text-[0.9rem] font-semibold">
            {confirmed ? 'Booking confirmed ✓' : `${total} ${plural} selected`}
          </p>
          <button type="button" onClick={() => setView(confirmed ? 'confirmed' : 'review')}
            className="btn px-5 py-2 text-[0.85rem]">
            {confirmed ? 'View booking' : 'Review booking'}
          </button>
        </div>,
        document.body
      )}

      {/* Modal: closes with the buttons, the Esc key, or a click on the backdrop */}
      <dialog ref={dialogRef} onClose={() => setView(null)}
        onClick={(e) => { if (e.target === e.currentTarget) setView(null) }}
        className="m-auto w-[min(32rem,calc(100%-2rem))] rounded-3xl border border-line bg-card p-0 text-white backdrop:bg-black/70">
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <h3 className={`text-[1.25rem] font-bold ${view === 'confirmed' ? 'text-green-300' : ''}`}>
              {view === 'confirmed' ? 'Booking confirmed!' : 'Your booking'}
            </h3>
            <button type="button" aria-label="Close" onClick={() => setView(null)}
              className="grid size-8 flex-none place-items-center rounded-full hover:bg-white/10">&times;</button>
          </div>

          {view === 'confirmed' && (
            <p role="status" className="mt-2 text-soft">
              You reserved {total} {plural}. See you on the floor.
            </p>
          )}
          {lines}

          <div className="mt-6 flex flex-wrap gap-3">
            {view === 'review' && (
              <>
                <button type="button" onClick={confirmBooking} className="btn px-5 py-2 text-[0.85rem]">
                  Confirm booking ({total})
                </button>
                <button type="button" onClick={clearBooking} className={ghost}>Clear</button>
              </>
            )}
            {view === 'confirmed' && (
              <>
                <button type="button" onClick={() => window.print()} className="btn px-5 py-2 text-[0.85rem]">
                  Print booking
                </button>
                <button type="button" onClick={() => { setConfirmedAt(null); setView(null) }} className={ghost}>
                  Edit booking
                </button>
                <button type="button" onClick={() => setView(null)} className={ghost}>Close</button>
              </>
            )}
          </div>
        </div>
      </dialog>

      {/* Printed page: lives in <body>, only visible when printing */}
      {confirmed && createPortal(
        <div className="hidden p-8 text-black print:block">
          <h1 className="text-2xl font-bold">FFL Fitness Studio</h1>
          <p className="mt-1">Booking confirmation &middot; {confirmedAt.toLocaleString()}</p>
          <ul className="mt-6 space-y-1">
            {bookedClasses.map((c) => (
              <li key={c.id}>{c.day} {c.time} &middot; {c.name} ({c.coach}) &times; {booked[c.id]}</li>
            ))}
          </ul>
          <p className="mt-6 font-bold">Total: {total} {plural}</p>
        </div>,
        document.body
      )}
    </Panel>
  )
}