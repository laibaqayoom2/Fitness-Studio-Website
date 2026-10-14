// src/components/Trainers.jsx
import Panel from './Panel'
import { TRAINERS } from '../data'

export default function Trainers() {
  return (
    <Panel id="trainers" kicker="Our Trainers" title={<>Meet the <span className="text-brand">coaches</span> behind your results</>}>
      <div className="mt-10 flex flex-wrap gap-6">
        {TRAINERS.map((t) => (
          <article key={t.id} className="group min-w-0 flex-[1_1_16rem] overflow-hidden rounded-3xl bg-card transition hover:-translate-y-1 hover:shadow-2xl">
            <img src={`/images/${t.img}`} alt={`Coach ${t.name}`} width="520" height="640" loading="lazy"
              className="aspect-[4/4.5] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
            <div className="px-6 pb-6 pt-5">
              <h3 className="text-[1.25rem]">{t.name}</h3>
              <p className="mb-3 mt-1 text-[0.85rem] font-semibold text-brand">{t.role}</p>
              <p className="text-[0.9rem] text-muted">{t.bio}</p>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  )
}