// src/components/Schedule.jsx
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Panel from './Panel'
import SpotsStepper from './SpotsStepper'
import { CLASSES, DAYS } from '../data'

export default function Schedule() {
  // Open on today's tab (Mon-first index); Sunday has no tab, so fall back to Mon
  const [day, setDay] = useState(() => DAYS[(new Date().getDay() + 6) % 7] ?? 'Mon')
  const [booked, setBooked] = useState({})             // { [classId]: spots }
  const [confirmedAt, setConfirmedAt] = useState(null) // null, or the Date it was confirmed
  const [view, setView] = useState(null)               // null (closed) | 'review' | 'confirmed'
  const dialogRef = useRef(null)

  // Derived values: calculated every render, never stored
  const confirmed = confirmedAt !== null
  const visible = CLASSES.filter((c) => c.day === day)
  const bookedClasses = CLASSES.filter((c) => (booked[c.id] ?? 0) > 0)
  const total = Object.values(booked).reduce((sum, n) => sum + n, 0)
  const plural = total === 1 ? 'spot' : 'spots'
  const picksOn = (d) =>
    CLASSES.filter((c) => c.day === d).reduce((sum, c) => sum + (booked[c.id] ?? 0), 0)

  // Keep the native <dialog> in sync with the `view` state
  useEffect(() => {
    const d = dialogRef.current
    if (!d) return        
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

  const ghost = 'rounded-full border border-line px-5 py-2 text-[0.85rem] transition hover:border-brand'

  return (
    <Panel id="schedule" tone="bg-panel-alt" kicker="Class Schedule"
      title={<>This week on <span className="text-brand">the floor</span></>}>

      {/* Day tabs: this is the filter */}
      <div role="group" aria-label="Choose a day" className="mt-8 grid grid-cols-6 gap-1.5 sm:max-w-md">
        {DAYS.map((d) => {
          const picks = picksOn(d)
          return (
            <button key={d} type="button" aria-pressed={day === d} onClick={() => setDay(d)}
              className={`relative rounded-xl py-2.5 text-[0.85rem] font-semibold transition ${day === d ? 'bg-brand text-ink' : 'bg-card text-soft hover:text-white'}`}>
              {d}
              {picks > 0 && (
                <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-white text-[0.65rem] font-bold text-ink">
                  <span className="sr-only">booked: </span>{picks}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <p aria-live="polite" className="mt-4 text-[0.85rem] text-muted">
        {visible.length} classes on {day} &middot; {total} {plural} booked in total
      </p>

      {/* Class cards for the chosen day */}
      <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {visible.map((c) => {
          const mine = booked[c.id] ?? 0
          const left = c.spots - mine // spots still open after your picks
          return (
            <li key={c.id}
              className={`flex min-w-0 flex-col gap-4 rounded-3xl border bg-card p-5 transition hover:-translate-y-1 hover:shadow-2xl ${mine > 0 ? 'border-brand' : 'border-transparent'}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="rounded-full bg-brand/15 px-3 py-1 text-[0.75rem] font-bold text-brand">{c.time}</p>
                <span className="text-[0.75rem] text-muted">{c.category}</span>
              </div>

              <div>
                <h3 className="text-[1.2rem] font-bold">{c.name}</h3>
                <p className="mt-1 text-[0.85rem] text-muted">{c.coach}</p>
              </div>

              <div className="mt-auto">
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                  <div className="h-full rounded-full bg-brand transition-all duration-300"
                    style={{ width: `${(left / c.spots) * 100}%` }} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-[0.8rem] text-muted">{left} of {c.spots} spots left</span>
                  <SpotsStepper label={`Spots for ${c.name} on ${c.day}`} max={c.spots}
                    value={mine} onChange={(n) => setSpots(c.id, n)} />
                </div>
              </div>
            </li>
          )
        })}
      </ul>

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

          <ul className="mt-3 space-y-1 text-[0.9rem] text-soft">
            {bookedClasses.map((c) => (
              <li key={c.id}>{c.day} {c.time} &middot; {c.name} &times; {booked[c.id]}</li>
            ))}
          </ul>

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
                <button type="button" onClick={clearBooking} className={ghost}>
                  Clear booking
                </button>
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