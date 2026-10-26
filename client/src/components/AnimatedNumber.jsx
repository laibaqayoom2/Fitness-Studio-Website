import { useEffect, useRef, useState } from 'react'

// Counts up once the number scrolls into view. Respects reduced motion.
export default function AnimatedNumber({ value, suffix = '', duration = 900, className = '' }) {
  const ref = useRef(null)
  const [display, setDisplay] = useState(0)
  const target = Number(value)

  useEffect(() => {
    const element = ref.current
    if (!element || !Number.isFinite(target)) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()

        if (reduceMotion) {
          setDisplay(target)
          return
        }

        const started = performance.now()
        const tick = (now) => {
          const progress = Math.min((now - started) / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setDisplay(Math.round(target * eased))
          if (progress < 1) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
      },
      { threshold: 0.35 },
    )

    observer.observe(element)
    return () => {
      observer.disconnect()
      if (frame) cancelAnimationFrame(frame)
    }
  }, [target, duration])

  return <span ref={ref} className={className}>{display.toLocaleString()}{suffix}</span>
}
