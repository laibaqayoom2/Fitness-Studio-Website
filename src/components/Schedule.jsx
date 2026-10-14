// src/components/Schedule.jsx
import Panel from './Panel'
import { CLASSES, CATEGORIES, DAYS } from '../data'

export default function Schedule() {

  return (
    <Panel id="schedule" tone="bg-panel-alt" kicker="Class Schedule" title={<>This week on <span className="text-brand">the floor</span></>}>
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