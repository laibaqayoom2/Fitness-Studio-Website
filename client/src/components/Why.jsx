
import Panel from './Panel'
import { WHY } from '../data'

export default function Why() {
  return (
    <Panel
      id="why"
      kicker="Preferences"
      title={
        <>
          Why choose us for your{' '}
          <span className="text-brand">fitness</span> journey?
        </>
      }
    >
      <div className="mt-7 grid grid-cols-1 items-center gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
    <figure className="overflow-hidden rounded-2xl sm:rounded-3xl lg:h-full">
          <img
            src="/images/why-trainers.webp"
            alt="Athlete tying battle ropes in the gym"
            width="960"
            height="720"
            loading="lazy"
            className="aspect-16/10 max-h-[40svh] w-full object-cover sm:max-h-[48svh] lg:aspect-auto lg:h-full lg:max-h-none lg:min-h-104"
          />
        </figure>

        <div className="grid content-center gap-3">
          {WHY.map((w) => (
            <details
              key={w.id}
              name="why"
              open={w.open}
              className="group rounded-xl border border-line bg-card px-4 py-4 transition-colors hover:border-brand/50 sm:px-5"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-soft [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 text-sm sm:text-base">
                  <span className="mr-1.5 text-brand">{w.lead}</span>
                  {w.rest}
                </span>

                <span
                  aria-hidden="true"
                  className="flex-none text-lg text-brand transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>

              <p className="mt-3 pr-5 text-sm leading-relaxed text-muted">
                {w.body}
              </p>
            </details>
          ))}
        </div>
      </div>
    </Panel>
  )
}
