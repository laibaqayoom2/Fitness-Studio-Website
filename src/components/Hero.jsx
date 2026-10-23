// src/components/Hero.jsx
import { TAGS, AVATARS } from '../data'

export default function Hero() {
  return (
    <section id="top" aria-labelledby="hero-title"
      className="bg-hero mb-10 grid grid-cols-1 items-end gap-x-8 gap-y-4 px-pad pb-10 pt-38 lg:min-h-184 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:pt-34">
      <div className="self-center">
        <h1 id="hero-title" className="mb-5 text-[clamp(2.25rem,11vw,2.8rem)] font-extrabold sm:text-[clamp(2.6rem,6.4vw,4.9rem)]">
          Push Your<br />Limits with Us
        </h1>
        <p className="mb-4 max-w-[34ch] text-[0.95rem] text-[#e3d9d3]">
          From beginner to advanced, experience workouts designed to help you achieve peak performance and exceed your fitness goals.
        </p>
        <p className="my-7 flex flex-wrap items-center gap-x-6 gap-y-4">
          <a className="btn" href="#join">Join Now &raquo;</a>
          <a className="flex items-center gap-3 font-semibold" href="#about">
            <span className="grid size-11 flex-none place-items-center rounded-full bg-brand text-[0.8rem] motion-safe:animate-pulse-ring">&#9654;</span>
            Watch Video
          </a>
        </p>
        <div className="flex items-center gap-3 text-[0.8rem]">
          <ul aria-hidden="true" className="flex items-center">
            {AVATARS.map((file) => (
              <li key={file} className="-ml-2 size-8 overflow-hidden rounded-full border-2 border-[#2b140a] first:ml-0">
                <img src={`/images/${file}`} alt="" className="size-full object-cover" />
              </li>
            ))}
            <li className="-ml-2 grid size-8 place-items-center rounded-full border-2 border-muted">+</li>
          </ul>
          <p className="leading-snug">
            <span aria-hidden="true" className="text-brand">&#9733;&#9733;&#9733;&#9733;&#9733;</span><br />
            <small className="text-muted">1.7k reviews</small>
          </p>
        </div>
      </div>

      <figure className="fade-mask hidden max-w-96 justify-self-center md:block lg:col-start-2 lg:row-start-1 lg:max-w-136 lg:justify-self-end">
        <img src="/images/hero-athlete.png" alt="Athlete in an orange tank top running" width="640" height="760" />
      </figure>

      <ul aria-label="What we offer" className="mt-6 flex max-w-176 flex-wrap gap-3 lg:col-span-2">
        {TAGS.map((t) => (
          <li key={t} className="rounded-full border border-white/30 bg-white/5 px-5 py-2 text-[0.72rem]">{t}</li>
        ))}
      </ul>
    </section>
  )
}
