// src/components/About.jsx
import Panel from "./Panel";
import AnimatedNumber from "./AnimatedNumber";
import { STATS } from "../data";

function splitStat(value) {
  const match = /^(\d+)(.*)$/.exec(value);

  return match
    ? { number: Number(match[1]), suffix: match[2] }
    : { number: 0, suffix: value };
}

export default function About() {
  return (
    <Panel
      id="about"
      kicker="ABOUT FFL"
      title={
        <>
          Built for your
          <br className="hidden sm:block" /> next{" "}
          <span className="text-brand">level.</span>
        </>
      }
    >
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">
        {/* Left content */}
        <div className="flex h-full flex-col justify-center py-2 lg:py-6">
          <p className="max-w-[48ch] text-sm leading-7 text-muted sm:text-base sm:leading-8">
            At FFL Gym, we bring together expert coaching, top-tier equipment,
            and a supportive community to help you reach your full potential.
            Whatever your goal, this is where the work begins.
          </p>

          <div className="mt-5 flex items-center gap-3">
            <span className="h-10 w-1 shrink-0 rounded-full bg-brand" />
            <p className="text-sm font-semibold sm:text-base">
              Show up. Put in the work. Get stronger.
            </p>
          </div>

          <ul className="mt-7 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4">
            {STATS.map((s) => {
              const stat = splitStat(s.value);

              return (
                <li
                  key={s.label}
                  className="rounded-xl border border-[var(--border)] p-4 sm:p-5"
                >
                  <strong className="block text-2xl font-bold tracking-tight sm:text-3xl">
                    <AnimatedNumber value={stat.number} suffix={stat.suffix} />
                    <span className="text-brand">+</span>
                  </strong>

                  <span className="mt-2 block text-xs leading-relaxed text-muted sm:text-sm">
                    {s.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Shorter, landscape video */}
        <figure className="group relative isolate h-[260px] overflow-hidden rounded-2xl bg-[#111] sm:h-[320px] lg:h-[350px] xl:h-[380px]">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          >
            <source src="/images/ffl-slowmo.mp4" type="video/mp4" />
          </video>

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

          <figcaption className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/70">
              The FFL experience
            </span>
            <p className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
              More than a workout.
            </p>
            <p className="mt-1 text-sm text-white/70">
              A stronger version of you.
            </p>
          </figcaption>
        </figure>
      </div>
    </Panel>
  );
}
