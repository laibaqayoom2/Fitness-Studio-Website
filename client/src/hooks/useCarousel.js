import { useCallback, useEffect, useRef, useState } from 'react'

const EDGE = 4

function reducedMotion() {
  return typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Horizontal scroll-snap carousel behaviour shared by the schedule and the
// trainers section: arrow state, autoplay with hover/focus pausing, and a reset
// when the underlying list changes (for example when switching day tabs).
// The track ref is owned by the caller so this hook never returns a ref.
export default function useCarousel(
  trackRef,
  { itemCount = 0, resetKey, autoPlay = false, interval = 5000 } = {},
) {
  const resetRef = useRef(resetKey)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(true)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [userPaused, setUserPaused] = useState(false)

 const measure = useCallback(() => {
  const el = trackRef.current
  if (!el) return

  const max = Math.max(0, el.scrollWidth - el.clientWidth)
  const hasOverflow = max > EDGE

  setAtStart(!hasOverflow || el.scrollLeft <= EDGE)
  setAtEnd(!hasOverflow || el.scrollLeft >= max - EDGE)
}, [trackRef])

  const stepSize = useCallback(() => {
    const el = trackRef.current
    if (!el) return 0
    const first = el.firstElementChild
    if (!first) return el.clientWidth
    const gap = Number.parseFloat(getComputedStyle(el).columnGap) || 0
    return first.getBoundingClientRect().width + gap
  }, [trackRef])

  const scrollByCards = useCallback((direction) => {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({ left: direction * stepSize(), behavior: reducedMotion() ? 'auto' : 'smooth' })
  }, [stepSize, trackRef])

  const prev = useCallback(() => scrollByCards(-1), [scrollByCards])
  const next = useCallback(() => scrollByCards(1), [scrollByCards])

  const nextWrapping = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    if (el.scrollLeft >= max - EDGE) {
      el.scrollTo({ left: 0, behavior: reducedMotion() ? 'auto' : 'smooth' })
    } else {
      el.scrollBy({ left: stepSize(), behavior: reducedMotion() ? 'auto' : 'smooth' })
    }
  }, [stepSize, trackRef])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return

    if (resetRef.current !== resetKey) {
      resetRef.current = resetKey
      el.scrollTo({ left: 0, behavior: 'auto' })
    }
    measure()

    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [measure, itemCount, resetKey, trackRef])

  const paused = userPaused || hovered || focused

  useEffect(() => {
    if (!autoPlay || paused || reducedMotion()) return
    const id = window.setInterval(nextWrapping, interval)
    return () => window.clearInterval(id)
  }, [autoPlay, paused, interval, nextWrapping])

  // Pause autoplay while the user is reading or tabbing through the cards.
  const pauseProps = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    onFocus: () => setFocused(true),
    onBlur: (e) => {
      if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false)
    },
  }

  return {
    atStart,
    atEnd,
    paused,
    userPaused,
    pauseProps,
    prev,
    next,
    onScroll: measure,
    togglePaused: () => setUserPaused((value) => !value),
  }
}
