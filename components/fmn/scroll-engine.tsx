'use client'

import { useEffect } from 'react'

/**
 * One scroll listener drives three decorative effects, all declared with data attributes
 * so the sections themselves can stay server components:
 *  - [data-reveal]   fades paper in when it scrolls into view
 *  - [data-parallax] drifts an element by `data-speed` (fraction of scroll distance)
 *  - [data-turn]     sets --turn (0..1) for the decorative page-turn dividers
 */
export function ScrollEngine() {
  useEffect(() => {
    const root = document.documentElement
    root.classList.add('js')

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')

    const revealables = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-in', '')
            io.unobserve(entry.target)
          }
        }
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.06 },
    )
    revealables.forEach((el) => io.observe(el))

    const parallax = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'))
    const turns = Array.from(document.querySelectorAll<HTMLElement>('[data-turn]'))
    const centers = new Map<HTMLElement, number>()

    const measure = () => {
      const scrollY = window.scrollY
      for (const el of parallax) {
        const current = Number.parseFloat(el.style.getPropertyValue('--py')) || 0
        const rect = el.getBoundingClientRect()
        centers.set(el, rect.top + scrollY + rect.height / 2 - current)
      }
    }

    let frame = 0
    const update = () => {
      frame = 0
      const vh = window.innerHeight
      const scrollY = window.scrollY

      if (reduced.matches) {
        turns.forEach((el) => el.style.setProperty('--turn', '1'))
        return
      }

      for (const el of parallax) {
        const center = centers.get(el)
        if (center === undefined) continue
        const speed = Number.parseFloat(el.dataset.speed ?? '0.1')
        const offset = (scrollY + vh / 2 - center) * speed
        el.style.setProperty('--py', offset.toFixed(1))
      }

      for (const el of turns) {
        const top = el.getBoundingClientRect().top
        const progress = Math.min(1, Math.max(0, (vh * 0.92 - top) / (vh * 0.55)))
        el.style.setProperty('--turn', progress.toFixed(3))
      }
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    const remeasure = () => {
      measure()
      schedule()
    }

    measure()
    update()

    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', remeasure)
    window.addEventListener('load', remeasure)
    const ro = new ResizeObserver(remeasure)
    ro.observe(document.body)
    reduced.addEventListener('change', remeasure)

    return () => {
      io.disconnect()
      ro.disconnect()
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', remeasure)
      window.removeEventListener('load', remeasure)
      reduced.removeEventListener('change', remeasure)
    }
  }, [])

  return null
}
