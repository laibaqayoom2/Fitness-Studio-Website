// src/components/Trainers.jsx
import { useRef } from 'react'
import Panel from './Panel'
import CarouselArrows from './CarouselArrows'
import useFetch from '../hooks/useFetch'
import useCarousel from '../hooks/useCarousel'
import { trainerImageSrc } from '../utils/image'

const title = <>Meet the <span className="text-brand">coaches</span> behind your results</>

export default function Trainers() {
  const { data: trainers, loading, error } = useFetch('/api/trainers')
  const list = trainers ?? []
  const trackRef = useRef(null)
  const {
    atStart,
    atEnd,
    userPaused,
    pauseProps,
    prev,
    next,
    onScroll,
    togglePaused,
  } = useCarousel(trackRef, { itemCount: list.length, autoPlay: true, interval: 5000, })

  if (loading && !trainers) {
    return <Panel id="trainers" kicker="Our Trainers" title={title}><p className="mt-10 text-muted">Loading coaches...</p></Panel>
  }
  if (error && !trainers) {
    return <Panel id="trainers" kicker="Our Trainers" title={title}><p className="mt-10 text-muted">Could not load coaches ({error}).</p></Panel>
  }

  return (
    <Panel id="trainers" kicker="Our Trainers" title={title}>
      {list.length === 0 ? (
        <p className="mt-10 text-muted">No coaches are listed yet.</p>
      ) : (
        <div
          {...pauseProps}
          role="group"
          aria-roledescription="carousel"
          aria-label="Our trainers"
          className="mt-10"
        >
          <ul
            ref={trackRef}
            onScroll={onScroll}
            className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {list.map((t) => (
              <li key={t.id} className="w-[82vw] flex-none snap-start sm:w-[calc((100%-1.5rem)/3)]">
                <article className="group h-full overflow-hidden rounded-3xl bg-card transition hover:-translate-y-1 hover:shadow-2xl">
                  <img src={trainerImageSrc(t.img)} alt={`Coach ${t.name}`} width="520" height="640" loading="lazy"
                    className="aspect-[4/4.5] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                  <div className="px-6 pb-6 pt-5">
                    <h3 className="text-[1.25rem]">{t.name}</h3>
                    <p className="mb-3 mt-1 text-[0.85rem] font-semibold text-brand">{t.role}</p>
                    <p className="text-[0.9rem] text-muted">{t.bio}</p>
                  </div>
                </article>
              </li>
            ))}
          </ul>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={togglePaused}
              aria-pressed={userPaused}
              className="text-[0.8rem] text-muted transition hover:text-white"
            >
              {userPaused ? 'Play autoplay' : 'Pause autoplay'}
            </button>
            <CarouselArrows
              label="trainers"
              onPrev={prev}
              onNext={next}
              atStart={atStart}
              atEnd={atEnd}
            />
          </div>
        </div>
      )}
    </Panel>
  )
}
