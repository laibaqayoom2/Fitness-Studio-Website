// src/components/Hero.jsx
import useFetch from "../hooks/useFetch";
import { TAGS, AVATARS, DAYS } from "../data";

function findNextClass(classes) {
  if (!classes.length) return null;
  const now = new Date();
  const today = (now.getDay() + 6) % 7;
  const minutes = now.getHours() * 60 + now.getMinutes();
  const sorted = [...classes].sort(
    (a, b) =>
      DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.time.localeCompare(b.time),
  );

  return (
    sorted.find((item) => {
      const index = DAYS.indexOf(item.day);
      if (index > today) return true;
      if (index < today) return false;
      const [hours, mins] = item.time.split(":").map(Number);
      return hours * 60 + mins > minutes;
    }) ?? sorted[0]
  );
}

export default function Hero() {
  const { data } = useFetch("/api/classes");
  const nextClass = findNextClass(data ?? []);

  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className="bg-hero mb-6 grid grid-cols-1 items-center gap-x-8 gap-y-6 px-pad pb-8 pt-28 sm:mb-10 sm:pt-32 lg:min-h-[min(46rem,100svh)] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:pb-10 lg:pt-34"
    >
      {/* Text column */}
      <div className="flex flex-col gap-5 sm:gap-6">
        <div>
          <h1
            id="hero-title"
            className="mb-3 text-[clamp(2.25rem,9vw,2.8rem)] font-extrabold leading-[1.05] sm:text-[clamp(2.8rem,4.5vw,4.5rem)]"
          >
            Push Your
            <br />
            Limits with Us
          </h1>
          <p className="max-w-[46ch] text-sm text-muted sm:text-base">
            From beginner to advanced, experience workouts designed to help you
            achieve peak performance and exceed your fitness goals.
          </p>
        </div>

        {/* CTAs: always on one row */}
        <div className="flex items-center gap-x-5 gap-y-3">
          <a className="btn flex-none" href="#join">
            Join Now &raquo;
          </a>
          <a
            className="flex items-center gap-2.5 text-sm font-semibold sm:gap-3 sm:text-base"
            href="#about"
          >
            <span className="grid size-10 flex-none place-items-center rounded-full bg-brand text-[0.75rem] motion-safe:animate-pulse-ring sm:size-11 sm:text-[0.8rem]">
              &#9654;
            </span>
            Watch Video
          </a>
        </div>

        {/* Next class + social proof share a row on wider screens */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          {nextClass && (
            <a
              href="#schedule"
              className="group flex min-w-0 basis-full items-center gap-3 rounded-2xl border px-3 py-2.5 transition hover:border-brand/60 sm:max-w-sm sm:flex-1 sm:basis-72"
              style={{
                backgroundColor: "var(--color-card)",
                borderColor: "var(--color-line)",
              }}
            >
              <span
                className="grid size-9 flex-none place-items-center rounded-full bg-brand/20 text-[0.85rem] text-brand motion-safe:animate-pulse-ring sm:size-10 sm:text-[0.95rem]"
                aria-hidden="true"
              >
                &#9654;
              </span>

              <span className="min-w-0 flex-1 leading-snug">
                <span className="block truncate text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand">
                  Up next &middot; {nextClass.day} {nextClass.time}
                </span>

                <span
                  className="block truncate text-[0.9rem] font-semibold"
                  style={{ color: "var(--color-soft)" }}
                >
                  {nextClass.name}
                </span>

                <span
                  className="block truncate text-[0.75rem]"
                  style={{ color: "var(--color-muted)" }}
                >
                  {nextClass.coach} &middot;{" "}
                  {nextClass.spots > 0
                    ? `${nextClass.spots} spots left`
                    : "Waitlist only"}
                </span>
              </span>

              <span className="ml-auto flex-none text-[0.75rem] font-semibold text-brand transition group-hover:translate-x-0.5">
                Book &rarr;
              </span>
            </a>
          )}

          <div className="flex flex-none items-center gap-3 text-[0.8rem]">
            <ul aria-hidden="true" className="flex items-center">
              {AVATARS.map((file) => (
                <li
                  key={file}
                  className="-ml-2 size-8 overflow-hidden rounded-full border-2 border-panel first:ml-0"
                >
                  <img
                    src={`/images/${file}`}
                    alt=""
                    width="160"
                    height="160"
                    className="size-full object-cover"
                  />
                </li>
              ))}
              <li className="-ml-2 grid size-8 place-items-center rounded-full border-2 border-line bg-card text-soft">
                +
              </li>
            </ul>
            <p className="leading-snug">
              <span aria-hidden="true" className="text-brand">
                &#9733;&#9733;&#9733;&#9733;&#9733;
              </span>
              <br />
              <small className="text-muted">1.7k reviews</small>
            </p>
          </div>
        </div>
      </div>

      {/* Image (md and up) */}
      <figure className="fade-mask hidden w-full max-w-72 justify-self-center md:block lg:col-start-2 lg:row-start-1 lg:max-w-[min(100%,28rem)] lg:justify-self-end">
        <img
          src="/images/hero-athlete.png"
          alt="Athlete in an orange tank top running"
          width="640"
          height="760"
          className="h-auto w-full max-h-[60svh] object-contain object-bottom"
        />
      </figure>

      {/* Tags: single swipeable row on mobile, wrapping row on desktop */}
      <ul
        aria-label="What we offer"
        className="-mx-pad flex snap-x gap-2.5 overflow-x-auto px-pad pb-1 scrollbar-none sm:mx-0 sm:max-w-176 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 lg:col-span-2 [&::-webkit-scrollbar]:hidden"
      >
        {TAGS.map((t) => (
          <li
            key={t}
            className="flex-none snap-start whitespace-nowrap rounded-full border border-line bg-card/50 px-4 py-1.5 text-[0.72rem] text-soft sm:px-5 sm:py-2"
          >
            {t}
          </li>
        ))}
      </ul>
    </section>
  );
}