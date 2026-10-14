import Image from 'next/image'
import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import { tripById, type Trip } from '@/lib/demo-data'
import { HandNote, Scribble, Staples } from './paper'
import { SectionHeading } from './section-heading'

function TripCover({
  trip,
  big,
  className,
  delay = 0,
}: {
  trip: Trip
  big?: boolean
  className?: string
  delay?: number
}) {
  return (
    <article data-reveal style={{ '--d': `${delay}ms` } as CSSProperties} className={cn('group', className)}>
      <div className="paper-hi shadow-paper relative p-3 pl-7 transition-[translate,rotate] duration-500 group-hover:-translate-y-2 group-hover:-rotate-1">
        <Staples />
        <div className="mb-2 flex items-center justify-between font-mono text-[0.58rem] tracking-[0.2em] text-ink/60 uppercase">
          <span>FMN · Trip booklet</span>
          <span>{trip.currency}</span>
        </div>

        <div className={cn('relative overflow-hidden bg-ink-3', big ? 'aspect-[4/5]' : 'aspect-[5/6]')}>
          <Image
            src={trip.photo}
            alt={trip.alt}
            fill
            sizes={big ? '(min-width: 1024px) 30rem, 90vw' : '(min-width: 1024px) 18rem, 45vw'}
            className="object-cover saturate-[0.85] transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
          <p
            lang="ja"
            className="font-display bg-paper-hi/90 absolute top-0 right-3 px-1.5 py-2 text-sm font-bold text-ink [writing-mode:vertical-rl]"
          >
            {trip.kanji}
          </p>
          <h3
            className={cn(
              'font-display text-paper-hi absolute bottom-3 left-3 leading-none font-extrabold tracking-tight',
              big ? 'text-6xl sm:text-7xl' : 'text-4xl sm:text-5xl',
            )}
          >
            {trip.city}
          </h3>
        </div>

        <p className="mt-2.5 font-mono text-[0.72rem] tracking-wide text-ink/70">{trip.dates}</p>

        <dl className="mt-2 grid grid-cols-3 divide-x divide-dashed divide-ink/30 border-t border-ink/70 pt-2 text-ink">
          <div className="pr-2">
            <dt className="font-mono text-[0.55rem] tracking-[0.18em] text-ink/55 uppercase">Spent</dt>
            <dd className={cn('font-display leading-tight font-bold', big ? 'text-xl' : 'text-base')}>{trip.total}</dd>
          </div>
          <div className="px-2">
            <dt className="font-mono text-[0.55rem] tracking-[0.18em] text-ink/55 uppercase">Items</dt>
            <dd className={cn('font-display leading-tight font-bold', big ? 'text-xl' : 'text-base')}>{trip.items}</dd>
          </div>
          <div className="pl-2">
            <dt className="font-mono text-[0.55rem] tracking-[0.18em] text-ink/55 uppercase">Types</dt>
            <dd className={cn('font-display leading-tight font-bold', big ? 'text-xl' : 'text-base')}>
              {trip.categories}
            </dd>
          </div>
        </dl>
      </div>
    </article>
  )
}

export function Archive() {
  return (
    <section id="archive" aria-labelledby="archive-title" className="relative px-4 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <SectionHeading
            id="archive-title"
            folio="p.01"
            label="Personal archive"
            className="lg:col-span-7"
            title={
              <>
                Every trip becomes <span className="text-vermilion-hi">a small booklet.</span>
              </>
            }
          >
            <p>
              A cover holds the destination, the dates and one photograph. Underneath, a quiet ledger: what you spent,
              how many things came home, and in how many kinds.
            </p>
          </SectionHeading>
          <div className="relative lg:col-span-4 lg:col-start-9" data-reveal>
            <HandNote tone="light" className="max-w-[16rem] -rotate-2">
              totals stay in the currency you paid in — nothing is converted
            </HandNote>
            <Scribble variant="down" className="text-vermilion-hi ml-6 hidden h-14 w-14 lg:block" />
          </div>
        </div>

        <div className="mt-14 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:mt-20 lg:grid-cols-12">
          <TripCover trip={tripById('tokyo')} big className="sm:col-span-2 sm:mx-auto sm:w-[26rem] lg:col-span-5 lg:mx-0 lg:w-auto lg:-rotate-1" />

          <div className="grid gap-x-8 gap-y-14 sm:col-span-2 sm:grid-cols-2 lg:col-span-7">
            <TripCover trip={tripById('kyoto')} delay={80} className="lg:mt-16 lg:rotate-2" />
            <TripCover trip={tripById('seoul')} delay={160} className="lg:-rotate-1" />
            <TripCover trip={tripById('osaka')} delay={240} className="sm:col-start-2 lg:col-start-1 lg:-mt-6 lg:-rotate-2" />
            <div
              data-reveal
              style={{ '--d': '320ms' } as CSSProperties}
              className="border-paper/25 hidden items-center justify-center border-2 border-dashed p-6 text-center lg:flex lg:rotate-1"
            >
              <div>
                <p className="font-display text-paper-hi text-2xl font-bold">Next trip</p>
                <p className="font-hand text-vermilion-hi mt-1 text-lg">an empty cover, waiting</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
