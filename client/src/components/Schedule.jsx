import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Panel from './Panel'
import SpotsStepper from './SpotsStepper'
import CarouselArrows from './CarouselArrows'
import useCarousel from '../hooks/useCarousel'
import useFetch from '../hooks/useFetch'
import { apiPost } from '../api'
import { useAuth } from '../auth/AuthContext'
import { DAYS } from '../data'

const inputClass = 'w-full rounded-xl border border-line bg-ink/50 px-4 py-2.5 text-[0.9rem] text-white placeholder:text-muted focus:border-brand focus:outline-none'

export default function Schedule() {
  const { data, loading, error, refetch } = useFetch('/api/classes')
  const { user } = useAuth()
  const classes = data ?? []
  // Open on today's tab (Mon-first index); Sunday has no tab, so fall back to Mon
  const [day, setDay] = useState(() => DAYS[(new Date().getDay() + 6) % 7] ?? 'Mon')
  const [booked, setBooked] = useState({})                  // { [classId]: spots }
  const [confirmedBooking, setConfirmedBooking] = useState(null) // server response
  const [view, setView] = useState(null)                    // null | 'review' | 'confirmed'
  const [details, setDetails] = useState({ name: null, email: null })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const dialogRef = useRef(null)
  const classesTrackRef = useRef(null)

  // Derived values: calculated every render, never stored
  const confirmed = confirmedBooking !== null
  const visible = classes.filter((c) => c.day === day)
  const bookedClasses = classes.filter((c) => (booked[c.id] ?? 0) > 0)
  const selectedTotal = Object.values(booked).reduce((sum, n) => sum + n, 0)
  const total = confirmedBooking?.totalSpots ?? selectedTotal
  const plural = total === 1 ? 'spot' : 'spots'
  const picksOn = (d) =>
    classes.filter((c) => c.day === d).reduce((sum, c) => sum + (booked[c.id] ?? 0), 0)

  // Days with three or more classes become a slider; one or two stay in the grid.
  const slider = visible.length > 2
  const {
    atStart: classesAtStart,
    atEnd: classesAtEnd,
    prev: showPreviousClasses,
    next: showNextClasses,
    onScroll: measureClasses,
  } = useCarousel(classesTrackRef, { itemCount: visible.length, resetKey: day })

  // Keep the native <dialog> in sync with the `view` state
  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    if (view && !d.open) d.showModal()
    else if (!view && d.open) d.close()
  }, [view])

  const setSpots = (id, n) => {
    if (confirmedBooking) return
    setSubmitError(null)
    setBooked((prev) => ({ ...prev, [id]: n }))
  }

  const resetSelection = () => {
    setBooked({})
    setConfirmedBooking(null)
    setSubmitError(null)
    setView(null)
  }

  const confirmBooking = async () => {
    if (submitting) return
    setSubmitError(null)

    const name = (details.name ?? user?.name ?? '').trim()
    const email = (details.email ?? user?.email ?? '').trim()

    if (!name) {
      setSubmitError('Please enter your name.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setSubmitError('Please enter a valid email address.')
      return
    }

    const items = Object.entries(booked)
      .filter(([, spots]) => spots > 0)
      .map(([classId, spots]) => ({ classId: Number(classId), spots }))

    if (items.length === 0) {
      setSubmitError('Choose at least one class.')
      return
    }

    setSubmitting(true)
    try {
      const booking = await apiPost('/api/bookings', {
        name,
        email,
        items,
      })
      setConfirmedBooking(booking)
      setBooked({})
      setView('confirmed')
      refetch()
      window.dispatchEvent(new Event('ffl:booking-created'))
    } catch (e) {
      setSubmitError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const ghost = 'rounded-full border border-line px-5 py-2 text-[0.85rem] transition hover:border-brand'

  const renderClass = (c) => {
    const mine = booked[c.id] ?? 0
    const left = Math.max(c.spots - mine, 0) // spots still open after your picks
    const capacity = c.capacity || c.spots
    const fill = capacity > 0 ? (left / capacity) * 100 : 0
    return (
      <li key={c.id}
        className={`flex min-w-0 flex-col gap-4 rounded-3xl border bg-card p-5 transition hover:-translate-y-1 hover:shadow-2xl ${mine > 0 ? 'border-brand' : 'border-transparent'}${slider ? ' w-[85vw] flex-none snap-start sm:w-[calc((100%-1rem)/2)]' : ''}`}>
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
              style={{ width: `${fill}%` }} />
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[0.8rem] text-muted">
              {left === 0 ? 'Fully booked' : `${left} of ${capacity} spots left`}
            </span>
            <SpotsStepper label={`Spots for ${c.name} on ${c.day}`} max={c.spots}
              value={mine} disabled={confirmed} onChange={(n) => setSpots(c.id, n)} />
          </div>
        </div>
      </li>
    )
  }

  if (loading && !data) {
    return <Panel id="schedule" tone="bg-panel-alt" kicker="Class Schedule" title="This week"><p className="mt-8 text-muted">Loading classes...</p></Panel>
  }
  if (error && !data) {
    return <Panel id="schedule" tone="bg-panel-alt" kicker="Class Schedule" title="This week"><p className="mt-8 text-muted">Could not load classes ({error}).</p></Panel>
  }

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
        {visible.length} classes on {day} &middot; {selectedTotal} {selectedTotal === 1 ? 'spot' : 'spots'} selected
        {user && <span className="ml-1 text-soft">· Signed in as {user.name}</span>}
      </p>
      {error && <p role="alert" className="mt-2 text-[0.85rem] text-red-300">Could not refresh availability ({error}).</p>}

      {/* Class cards for the chosen day: grid for one or two, slider for more */}
      {visible.length === 0 && (
        <p className="mt-4 text-muted">No classes are scheduled on {day}.</p>
      )}
      {visible.length > 0 && (slider ? (
        <div role="group" aria-roledescription="carousel" aria-label={`Classes on ${day}`} className="mt-4">
          <ul ref={classesTrackRef} onScroll={measureClasses}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {visible.map(renderClass)}
          </ul>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[0.8rem] text-muted">Swipe or use the arrows to see all {visible.length} classes.</p>
            <CarouselArrows label="classes" onPrev={showPreviousClasses} onNext={showNextClasses}
              atStart={classesAtStart} atEnd={classesAtEnd} />
          </div>
        </div>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map(renderClass)}
        </ul>
      ))}

      {/* Sticky bar: appears once something is selected or booked and the dialog is closed */}
      {(confirmed || selectedTotal > 0) && view === null && createPortal(
        <div className="fixed inset-x-4 bottom-4 z-30 mx-auto flex max-w-lg items-center justify-between gap-3 rounded-full border border-brand/40 bg-card py-2 pl-5 pr-2 shadow-2xl print:hidden">
          <p className="text-[0.9rem] font-semibold">
            {confirmed ? 'Booking confirmed ✓' : `${selectedTotal} ${selectedTotal === 1 ? 'spot' : 'spots'} selected`}
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
        onCancel={(e) => { if (submitting) e.preventDefault() }}
        onClick={(e) => { if (e.target === e.currentTarget && !submitting) setView(null) }}
        className="m-auto w-[min(32rem,calc(100%-2rem))] rounded-3xl border border-line bg-card p-0 text-white backdrop:bg-black/70">
        <form className="p-6" onSubmit={(e) => { e.preventDefault(); if (view === 'review') confirmBooking() }}>
          <div className="flex items-start justify-between gap-4">
            <h3 className={`text-[1.25rem] font-bold ${view === 'confirmed' ? 'text-green-300' : ''}`}>
              {view === 'confirmed' ? 'Booking confirmed!' : 'Your booking'}
            </h3>
            <button type="button" aria-label="Close" disabled={submitting} onClick={() => setView(null)}
              className="grid size-8 flex-none place-items-center rounded-full hover:bg-white/10 disabled:opacity-30">&times;</button>
          </div>

          {view === 'review' && (
            <>
              <p className="mt-2 text-[0.9rem] text-soft">
                {total} {plural} across {bookedClasses.length} {bookedClasses.length === 1 ? 'class' : 'classes'}.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="text-[0.8rem] font-semibold text-soft">
                  Name
                  <input type="text" required autoComplete="name" value={details.name ?? user?.name ?? ''}
                    onChange={(e) => setDetails((prev) => ({ ...prev, name: e.target.value }))}
                    className={`mt-1.5 ${inputClass}`} placeholder="Your name" />
                </label>
                <label className="text-[0.8rem] font-semibold text-soft">
                  Email
                  <input type="email" required autoComplete="email" value={details.email ?? user?.email ?? ''}
                    onChange={(e) => setDetails((prev) => ({ ...prev, email: e.target.value }))}
                    className={`mt-1.5 ${inputClass}`} placeholder="you@example.com" />
                </label>
              </div>

              {submitError && <p role="alert" className="mt-3 text-[0.85rem] text-red-300">{submitError}</p>}
            </>
          )}

          {view === 'confirmed' && (
            <>
              <p role="status" className="mt-2 text-soft">
                You reserved {total} {plural}. Reference <strong className="text-white">{confirmedBooking.reference}</strong>.
              </p>
              <p className="mt-1 text-[0.85rem] text-muted">
                Saved under {confirmedBooking.email}.
              </p>
            </>
          )}

          <ul className="mt-3 space-y-1 text-[0.9rem] text-soft">
            {confirmedBooking
              ? confirmedBooking.items.map((c) => (
                  <li key={c.classId}>
                    {c.day} {c.time} &middot; {c.name} &times; {c.spots}
                  </li>
                ))
              : bookedClasses.map((c) => (
                  <li key={c.id}>
                    {c.day} {c.time} &middot; {c.name} &times; {booked[c.id]}
                  </li>
                ))}
          </ul>

          <div className="mt-6 flex flex-wrap gap-3">
            {view === 'review' && (
              <>
                <button type="submit" disabled={submitting} className="btn px-5 py-2 text-[0.85rem] disabled:opacity-50">
                  {submitting ? 'Booking...' : `Confirm booking (${total})`}
                </button>
                <button type="button" onClick={resetSelection} disabled={submitting} className={`${ghost} disabled:opacity-50`}>Clear</button>
              </>
            )}
            {view === 'confirmed' && (
              <>
                <button type="button" onClick={() => window.print()} className="btn px-5 py-2 text-[0.85rem]">
                  Print booking
                </button>
                <button type="button" onClick={resetSelection} className={ghost}>
                  Book another
                </button>
              </>
            )}
          </div>
        </form>
      </dialog>

      {/* Printed page: lives in <body>, only visible when printing */}
      {confirmedBooking && createPortal(
        <div className="hidden p-8 text-black print:block">
          <h1 className="text-2xl font-bold">FFL Fitness Studio</h1>
          <p className="mt-1">Booking confirmation &middot; {new Date(confirmedBooking.createdAt).toLocaleString()}</p>
          <p className="mt-1">Reference: {confirmedBooking.reference}</p>
          <p className="mt-1">{confirmedBooking.name} &middot; {confirmedBooking.email}</p>
          <ul className="mt-6 space-y-1">
            {confirmedBooking.items.map((c) => (
              <li key={c.classId}>{c.day} {c.time} &middot; {c.name} &times; {c.spots}</li>
            ))}
          </ul>
          <p className="mt-6 font-bold">Total: {confirmedBooking.totalSpots} {confirmedBooking.totalSpots === 1 ? 'spot' : 'spots'}</p>
        </div>,
        document.body
      )}
    </Panel>
  )
}
