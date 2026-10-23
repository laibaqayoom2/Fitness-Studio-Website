// src/components/Plans.jsx
import Panel from './Panel'
import { PLANS } from '../data'

const CARD = {
  normal: 'border-line bg-[linear-gradient(180deg,#25272d,#1d1f24)]',
  featured: 'border-brand/60 bg-[radial-gradient(120%_60%_at_50%_0%,rgb(255_90_31/0.22),transparent_65%),linear-gradient(180deg,#2a2523,#1d1f24)]',
}
const BUTTON = {
  dark: 'border border-line bg-linear-to-b from-[#373a42] to-[#26282e] text-white',
  primary: 'bg-linear-to-b from-[#ff8a4d] to-brand text-ink',
  light: 'bg-white text-[#14100d] hover:bg-[#e9eaec]',
}

export default function Plans() {
  return (
    <Panel id="membership" tone="bg-panel-alt" kicker="Subscriptions" title={<>Flexible <span className="text-brand">plans</span> for every goal</>}>
      <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
        {PLANS.map((p) => (
          <article key={p.id} className={`flex flex-col rounded-[1.25rem] border p-7 transition hover:-translate-y-1 hover:shadow-2xl lg:min-h-108 ${p.featured ? CARD.featured : CARD.normal}`}>
            <h3 className={`mb-6 self-start rounded-full border px-3.5 py-1 text-[0.72rem] font-semibold ${p.featured ? 'border-brand/40 bg-brand/15 text-[#ffb08f]' : 'border-line bg-white/10 text-[#d7d9de]'}`}>{p.name}</h3>
            <p className="text-[clamp(2.6rem,4vw,3.4rem)] font-bold leading-none tracking-tight">
              ${p.price} <small className="ml-1 text-[0.8rem] font-normal tracking-normal text-muted">/ month</small>
            </p>
            <p className={`mt-3.5 text-[0.8rem] ${p.featured ? 'text-[#cdb9ae]' : 'text-muted'}`}>{p.note}</p>
            <ul className="mb-8 mt-7 grid gap-3.5">
              {p.perks.map((perk) => (
                <li key={perk} className={`flex items-center gap-3 text-[0.85rem] text-soft before:grid before:size-[1.15rem] before:flex-none before:place-items-center before:rounded-full before:border-[1.5px] before:text-[0.6rem] before:content-['✓'] ${p.featured ? 'before:border-brand before:text-brand' : 'before:border-[#6b6f78] before:text-[#9a9ea7]'}`}>
                  {perk}
                </li>
              ))}
            </ul>
            <a href="#join" className={`btn mt-auto rounded-lg px-4 text-center text-[0.85rem] ${BUTTON[p.button]}`}>Get started</a>
          </article>
        ))}
      </div>
    </Panel>
  )
}