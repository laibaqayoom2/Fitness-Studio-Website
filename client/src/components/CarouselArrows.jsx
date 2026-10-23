const button = 'grid size-9 place-items-center rounded-full border border-line text-white transition hover:border-brand disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-line'

export default function CarouselArrows({ label = 'items', onPrev, onNext, atStart, atEnd }) {
  return (
    <div className="flex gap-2">
      <button type="button" aria-label={`Previous ${label}`} onClick={onPrev} disabled={atStart} className={button}>
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button type="button" aria-label={`Next ${label}`} onClick={onNext} disabled={atEnd} className={button}>
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>
    </div>
  )
}
