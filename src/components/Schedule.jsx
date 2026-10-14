// src/components/Schedule.jsx
import { useState } from 'react'                      
import Panel from './Panel'
import SpotsStepper from './SpotsStepper'        
import { CLASSES, CATEGORIES, DAYS } from '../data'

export default function Schedule() {
  const [category, setCategory] = useState('All')     
  const [booked, setBooked] = useState({})            

  const visible = category === 'All' ? CLASSES : CLASSES.filter((c) => c.category === category) 
  const total = Object.values(booked).reduce((sum, n) => sum + n, 0)                     
  const setSpots = (id, n) => setBooked((prev) => ({ ...prev, [id]: n }))                

  return (
    <Panel id="schedule" tone="bg-panel-alt" kicker="Class Schedule" title={<>This week on <span className="text-brand">the floor</span></>}>

      <div role="group" aria-label="Filter classes by type" className="mt-8 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)}
            className={`rounded-full px-4 py-2 text-[0.85rem] font-semibold transition ${category === c ? 'bg-brand text-ink' : 'bg-card text-soft hover:text-white'}`}>
            {c}
          </button>
        ))}
      </div>
      <p aria-live="polite" className="mt-4 text-[0.85rem] text-muted">
        {visible.length} classes &middot; {total} {total === 1 ? 'spot' : 'spots'} booked
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
    </Panel>
  )
}