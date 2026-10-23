// src/components/About.jsx
import Panel from './Panel'
import { STATS } from '../data'

export default function About() {
  return (
    <Panel id="about" kicker="About Us" title={<>Your <span className="text-brand">fitness</span> journey starts here</>}>
      <p className="mt-6 max-w-[62ch] text-[0.95rem] text-muted">
        At FFL Gym, we are dedicated to helping you unlock your full fitness potential. With top-tier equipment, expert trainers, and a welcoming community, we provide the perfect environment to push your limits and achieve your goals.
      </p>
      <ul className="my-10 flex flex-wrap gap-x-16 gap-y-6">
        {STATS.map((s) => (
          <li key={s.label} className="text-[0.8rem] text-muted">
            <strong className="block text-[2rem] text-white">{s.value}<span className="text-brand">+</span></strong>
            {s.label}
          </li>
        ))}
      </ul>
      <figure className="overflow-hidden rounded-[1.75rem] bg-[#111]">
        <video autoPlay muted loop playsInline className="aspect-[2.1/1] w-full object-cover">
          <source src="/images/ffl-slowmo.mp4" type="video/mp4" />
        </video>
      </figure>
    </Panel>
  )
}