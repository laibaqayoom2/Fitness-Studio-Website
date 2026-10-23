// src/components/Services.jsx
import Panel from './Panel'
import { SERVICES } from '../data'

export default function Services() {
  return (
    <Panel id="services" tone="bg-panel-alt" kicker="Our Services" title={<><span className="text-brand">premium fitness,</span> tailored for you</>}>
      <p className="mt-6 max-w-[62ch] text-[0.95rem] text-muted">
        From one-on-one training to high-energy classes and recovery sessions, we provide everything you need to succeed in your fitness journey.
      </p>
      <ul className="mt-10 grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] gap-5">
        {SERVICES.map((s) => (
          <li key={s.id}>
            <a href="#schedule" className="group relative block overflow-hidden rounded-2xl transition hover:-translate-y-1 hover:shadow-2xl">
              <img src={`/images/${s.img}`} alt={s.alt} width="520" height="300" loading="lazy"
                className="aspect-[1/1.1] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
              <span className="absolute inset-x-0 bottom-0 bg-linear-to-b from-transparent to-black px-5 pb-4 pt-10 font-semibold group-hover:text-brand">{s.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </Panel>
  )
}