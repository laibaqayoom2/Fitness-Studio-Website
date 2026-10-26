// src/components/About.jsx
import Panel from './Panel'
import AnimatedNumber from './AnimatedNumber'
import { STATS } from '../data'

function splitStat(value) {
  const match = /^(\d+)(.*)$/.exec(value)

  return match
    ? { number: Number(match[1]), suffix: match[2] }
    : { number: 0, suffix: value }
}

export default function About() {
  return (
    <Panel
      id="about"
      kicker="ABOUT FFL"
      title={
        <>
          Built for your
          <br className="hidden sm:block" /> next{' '}
          <span className="text-brand">level.</span>
        </>
      }
    >
      <div className="grid gap-9 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-14">
        {/* Intro */}
        <div className="flex flex-col items-start justify-center">
          <p className="max-w-[48ch] text-[0.95rem] leading-7 text-muted sm:text-base sm:leading-8">
            At FFL Gym, we bring together expert coaching, top-tier
            equipment, and a supportive community to help you reach
            your full potential. Whatever your goal, this is where
            the work begins.
          </p>

          <div className="mt-6 flex items-center gap-3">
            <span className="h-10 w-1 rounded-full bg-brand" />
            <p className="text-sm font-semibold tracking-wide">
              Show up. Put in the work. Get stronger.
            </p>
          </div>

          {/* Stats */}
          <ul className="mt-8 grid w-full grid-cols-2 gap-3 sm:mt-10 sm:gap-4">
            {STATS.map((s) => {
              const stat = splitStat(s.value)

              return (
                <li
                  key={s.label}
                  className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-brand/50 sm:p-5"
                >
                  <strong className="block text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
                    <AnimatedNumber
                      value={stat.number}
                      suffix={stat.suffix}
                    />
                    <span className="text-brand">+</span>
                  </strong>

                  <span className="mt-2 block text-xs leading-relaxed text-muted sm:text-sm">
                    {s.label}
                  </span>

                  <span className="mt-4 block h-1 w-7 rounded-full bg-brand transition-all duration-300 group-hover:w-12" />
                </li>
              )
            })}
          </ul>
        </div>

        {/* Gym footage */}
        <figure className="group relative isolate min-w-0 overflow-hidden rounded-2xl bg-[#111] sm:rounded-3xl">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-label="Slow-motion footage of the FFL fitness experience"
            className="aspect-[4/3] max-h-[55svh] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03] sm:aspect-[5/4] sm:max-h-none lg:aspect-[4/5]"
          >
            <source
              src="/images/ffl-slowmo.mp4"
              type="video/mp4"
            />
          </video>

          {/* Contrast overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

          {/* Video label */}
          <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-white sm:p-7">
            <div>
              <span className="mb-2 inline-flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/75">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                The FFL experience
              </span>

              <p className="text-xl font-bold tracking-tight sm:text-2xl">
                More than a workout.
              </p>
              <p className="mt-1 text-sm text-white/70">
                A stronger version of you.
              </p>
            </div>

            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/10 text-lg backdrop-blur-sm"
            >
              ↗
            </span>
          </figcaption>
        </figure>
      </div>
    </Panel>
  )
}