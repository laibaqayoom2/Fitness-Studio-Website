
import Panel from './Panel'
import { SERVICES } from '../data'

export default function Services() {
  return (
    <Panel
      id="services"
      tone="bg-panel-alt"
      kicker="Our Services"
      title={
        <>
          <span className="text-brand">premium fitness,</span> tailored for you
        </>
      }
    >
      <p className="mt-4 max-w-[62ch] text-sm text-muted sm:text-base">
        From one-on-one training to high-energy classes and recovery sessions,
        we provide everything you need to succeed in your fitness journey.
      </p>

      <ul className="mt-7 grid grid-cols-2 gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
        {SERVICES.map((s) => (
          <li key={s.id} className="min-w-0">
            <a
              href="#schedule"
              className="group relative block overflow-hidden rounded-xl bg-card transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:rounded-2xl"
            >
              <img
                src={`/images/${s.img}`}
                alt={s.alt}
                width="520"
                height="520"
                loading="lazy"
                className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:aspect-[3/4]"
              />

              <span
                className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 via-black/40 to-transparent px-3 pb-3 pt-12 text-sm font-semibold text-white transition-colors group-hover:text-brand sm:px-5 sm:pb-5 sm:text-base"
              >
                {s.label}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
