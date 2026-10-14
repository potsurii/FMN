import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function SectionHeading({
  id,
  folio,
  label,
  title,
  children,
  tone = 'dark',
  className,
}: {
  id?: string
  folio: string
  label: string
  title: ReactNode
  children?: ReactNode
  tone?: 'dark' | 'paper'
  className?: string
}) {
  const onPaper = tone === 'paper'
  return (
    <header className={cn('max-w-2xl', className)} data-reveal>
      <p
        className={cn(
          'flex items-center gap-3 font-mono text-[0.7rem] tracking-[0.22em] uppercase',
          onPaper ? 'text-vermilion' : 'text-vermilion-hi',
        )}
      >
        <span>{folio}</span>
        <span aria-hidden="true" className="h-px w-10 bg-current" />
        <span>{label}</span>
      </p>
      <h2
        id={id}
        className={cn(
          'font-display mt-4 text-4xl leading-[1.08] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl',
          onPaper ? 'text-ink' : 'text-paper-hi',
        )}
      >
        {title}
      </h2>
      {children && (
        <div
          className={cn(
            'mt-5 max-w-xl text-base leading-relaxed text-pretty sm:text-lg',
            onPaper ? 'text-ink/75' : 'text-muted-ivory',
          )}
        >
          {children}
        </div>
      )}
    </header>
  )
}
