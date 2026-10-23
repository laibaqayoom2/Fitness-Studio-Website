// src/components/Why.jsx
import Panel from './Panel'
import { WHY } from '../data'

export default function Why() {
  return (
    <Panel id="why" kicker="Preferences" title={<>Why choose us for your <span className="text-brand">fitness</span> journey?</>}>
      <div className="mt-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <figure className="overflow-hidden rounded-3xl">
          <img src="/images/why-trainers.webp" alt="Athlete tying battle ropes in the gym" width="960" height="720" loading="lazy"
            className="aspect-square w-full object-cover" />
        </figure>
        <div className="grid gap-4">
          {WHY.map((w) => (
            <details key={w.id} name="why" open={w.open} className="group rounded-2xl bg-card px-6 py-5">
              <summary className="flex cursor-pointer list-none justify-between gap-4 text-[1.15rem] after:text-muted after:content-['↘'] group-open:after:text-brand group-open:after:content-['↗'] [&::-webkit-details-marker]:hidden">
                <span><span className="mr-1.5 text-brand">{w.lead}</span>{w.rest}</span>
              </summary>
              <p className="mt-4 text-[0.85rem] text-muted">{w.body}</p>
            </details>
          ))}
        </div>
      </div>
    </Panel>
  )
}