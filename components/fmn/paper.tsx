import Image from 'next/image'
import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { tornClip } from '@/lib/paper'

/** Floating wrapper: parallax drift on the outside, gentle bob on the inside. */
export function Drift({
  speed = 0.08,
  float,
  className,
  style,
  children,
}: {
  speed?: number
  float?: 'a' | 'b'
  className?: string
  style?: CSSProperties
  children: ReactNode
}) {
  return (
    <div data-parallax data-speed={speed} className={className} style={style}>
      <div className={float === 'a' ? 'float-a' : float === 'b' ? 'float-b' : undefined}>{children}</div>
    </div>
  )
}

export function Tape({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn('tape absolute block h-5 w-16', className)} />
}

export function FmnMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn('size-6', className)}>
      {[0, 72, 144, 216, 288].map((deg) => (
        <ellipse
          key={deg}
          cx="16"
          cy="8.4"
          rx="4.6"
          ry="6"
          transform={`rotate(${deg} 16 16)`}
          fill="currentColor"
        />
      ))}
      <circle cx="16" cy="16" r="3.2" className="fill-vermilion-hi" />
    </svg>
  )
}

/** Hand-drawn style curved arrow, stroked with currentColor. */
export function Scribble({
  className,
  variant = 'curve',
}: {
  className?: string
  variant?: 'curve' | 'loop' | 'down'
}) {
  const paths = {
    curve: 'M4 8 C 30 -2, 58 6, 70 34 M60 30 L70 36 L74 24',
    loop: 'M6 40 C 20 4, 52 4, 46 26 C 42 40, 22 30, 34 16 C 44 6, 66 14, 74 40 M66 34 L75 42 L80 31',
    down: 'M10 4 C 4 24, 26 32, 30 56 M20 50 L30 58 L36 46',
  }
  return (
    <svg
      viewBox="0 0 84 64"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('h-12 w-16', className)}
    >
      <path d={paths[variant]} />
    </svg>
  )
}

export function HandNote({
  children,
  className,
  tone = 'ink',
}: {
  children: ReactNode
  className?: string
  tone?: 'ink' | 'light' | 'pen'
}) {
  return (
    <p
      className={cn(
        'font-hand text-base leading-snug font-semibold sm:text-lg',
        tone === 'ink' && 'text-vermilion',
        tone === 'light' && 'text-vermilion-hi',
        tone === 'pen' && 'text-pen',
        className,
      )}
    >
      {children}
    </p>
  )
}

/** Circular rubber date stamp. */
export function DateStamp({
  top,
  middle,
  bottom,
  className,
  tone = 'dark',
}: {
  top: string
  middle: string
  bottom: string
  className?: string
  tone?: 'dark' | 'light'
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'ink-stamp flex size-24 flex-col items-center justify-center rounded-full border-[3px] p-1 text-center font-mono uppercase',
        tone === 'dark' ? 'border-vermilion text-vermilion' : 'border-vermilion-hi text-vermilion-hi',
        className,
      )}
    >
      <div
        className={cn(
          'flex size-full flex-col items-center justify-center rounded-full border',
          tone === 'dark' ? 'border-vermilion' : 'border-vermilion-hi',
        )}
      >
        <span className="text-[0.55rem] tracking-[0.2em]">{top}</span>
        <span className="font-display text-xl leading-none font-extrabold tracking-tight">{middle}</span>
        <span className="text-[0.55rem] tracking-[0.2em]">{bottom}</span>
      </div>
    </div>
  )
}

/** Torn-edge receipt scrap. The outer wrapper carries the shadow so the clip doesn't eat it. */
export function Receipt({
  seed = 1,
  torn = { top: true, bottom: true },
  className,
  innerClassName,
  style,
  children,
}: {
  seed?: number
  torn?: { top?: boolean; bottom?: boolean; left?: boolean; right?: boolean }
  className?: string
  innerClassName?: string
  style?: CSSProperties
  children: ReactNode
}) {
  return (
    <div className={cn('drop-paper', className)} style={style}>
      <div
        className={cn('paper-hi font-mono text-[0.72rem] leading-relaxed', innerClassName)}
        style={{ clipPath: tornClip(seed, { ...torn, depth: 6 }) }}
      >
        {children}
      </div>
    </div>
  )
}

/** Print with white border and a strip of tape. */
export function Photo({
  src,
  alt,
  className,
  aspect = 'aspect-[4/5]',
  sizes = '(min-width: 1024px) 18rem, 60vw',
  caption,
  tape = true,
  priority,
}: {
  src: string
  alt: string
  className?: string
  aspect?: string
  sizes?: string
  caption?: string
  tape?: boolean
  priority?: boolean
}) {
  return (
    <figure className={cn('paper-hi shadow-paper relative p-2 pb-2', caption && 'pb-7', className)}>
      {tape && <Tape className="-top-2.5 left-1/2 -translate-x-1/2 -rotate-2" />}
      <div className={cn('relative overflow-hidden bg-ink-3', aspect)}>
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      </div>
      {caption && (
        <figcaption className="font-hand absolute inset-x-2 bottom-1.5 text-center text-sm text-pen">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

/** Perforated postage stamp holding a product photo. */
export function PostageStamp({
  src,
  alt,
  price,
  currency,
  className,
  ghost,
  sizes = '12rem',
}: {
  src: string
  alt: string
  price: string
  currency: string
  className?: string
  ghost?: boolean
  sizes?: string
}) {
  return (
    <div className={cn('drop-paper-soft', className)}>
      <div className={cn('stamp-perf', ghost && 'opacity-90')}>
        <div className="relative aspect-[4/5] overflow-hidden bg-paper-lo">
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            className={cn('object-cover', ghost && 'sepia-[0.35] saturate-50')}
          />
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-start bg-gradient-to-t from-black/60 to-transparent px-2 pt-6 pb-1.5 font-mono leading-tight text-paper-hi">
            <span className="text-[0.55rem] tracking-[0.14em] uppercase">{currency}</span>
            <span className="text-xs font-medium sm:text-sm">{price}</span>
          </div>
          {!ghost && (
            <svg
              aria-hidden="true"
              viewBox="0 0 80 40"
              className="ink-stamp absolute -top-1 -right-2 h-10 w-20 -rotate-12 text-vermilion/80"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              {[6, 14, 22, 30].map((y) => (
                <path key={y} d={`M0 ${y} q10 -7 20 0 t20 0 t20 0 t20 0`} />
              ))}
            </svg>
          )}
        </div>
      </div>
    </div>
  )
}

export function Staples({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn('pointer-events-none absolute inset-y-0 left-2.5 z-10', className)}>
      {['22%', '74%'].map((top) => (
        <span
          key={top}
          className="absolute block h-5 w-1.5 rounded-[1px] bg-gradient-to-r from-neutral-300 via-neutral-500 to-neutral-300 shadow-[1px_1px_1px_rgba(0,0,0,0.5)]"
          style={{ top }}
        />
      ))}
    </div>
  )
}
