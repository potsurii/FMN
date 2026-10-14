import Image from 'next/image'
import { Search } from 'lucide-react'
import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import { recordById, tripById, type ShopRecord, type Trip } from '@/lib/demo-data'
import { FeedbackStamps } from './feedback-stamps'
import { HandNote, Tape } from './paper'
import { SectionHeading } from './section-heading'

function SearchPreview() {
  return (
    <div
      data-reveal
      role="img"
      aria-label="Preview of a product search for matcha tin, filtered by trip, currency and category"
      className="paper-hi shadow-paper relative -rotate-1 p-3 text-ink sm:p-4"
    >
      <Tape className="-top-2.5 right-8 rotate-3" />
      <div className="border-ink/60 flex items-center gap-3 border-b-2 px-1 pb-2">
        <Search className="size-5 shrink-0 text-vermilion" aria-hidden="true" />
        <p className="font-display text-xl font-bold sm:text-2xl">
          matcha tin<span className="caret text-vermilion">|</span>
        </p>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[0.65rem] tracking-wide uppercase">
        {['Tokyo', 'JPY', 'Food & tea'].map((chip) => (
          <span key={chip} className="border border-dashed border-ink/50 px-2 py-1">
            {chip}
          </span>
        ))}
        <span className="text-ink/50 ml-auto">Preview only</span>
      </div>
    </div>
  )
}

function SharedTrip({ trip, shared }: { trip: Trip; shared: number }) {
  return (
    <article
      data-reveal
      className="paper-hi shadow-paper relative w-full max-w-xs p-2.5 text-ink lg:max-w-none"
      aria-label={`Shared trip: ${trip.city}`}
    >
      <Tape className="-top-2.5 left-6 -rotate-3" />
      <div className="relative aspect-[4/3] overflow-hidden bg-ink-3">
        <Image
          src={trip.photo}
          alt={trip.alt}
          fill
          sizes="(min-width: 1024px) 20rem, 80vw"
          className="object-cover saturate-[0.85]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
        <h3 className="font-display text-paper-hi absolute bottom-2 left-3 text-4xl leading-none font-extrabold">
          {trip.city}
        </h3>
        <span className="ink-stamp bg-paper-hi/90 absolute top-2 right-2 border-2 border-vermilion px-1.5 py-0.5 font-mono text-[0.6rem] font-medium tracking-[0.18em] text-vermilion uppercase -rotate-3">
          Public trip
        </span>
      </div>
      <div className="mt-2 flex items-baseline justify-between font-mono text-[0.68rem] text-ink/70">
        <span>{trip.dates}</span>
        <span>
          {shared} shared {shared === 1 ? 'record' : 'records'}
        </span>
      </div>
    </article>
  )
}

function Thread() {
  return (
    <>
      <div aria-hidden="true" className="flex flex-col items-center py-1 lg:hidden">
        <span className="bg-vermilion-hi size-2.5 rounded-full" />
        <span className="border-vermilion-hi h-10 border-l-2 border-dashed" />
        <span className="bg-vermilion-hi size-2.5 rounded-full" />
      </div>
      <div aria-hidden="true" className="hidden w-20 shrink-0 items-center xl:w-28 lg:flex">
        <span className="bg-vermilion-hi size-2.5 shrink-0 rounded-full" />
        <span className="border-vermilion-hi flex-1 border-t-2 border-dashed" />
        <span className="bg-vermilion-hi size-2.5 shrink-0 rounded-full" />
      </div>
    </>
  )
}

function PublicRecord({ record, delay = 0, tilt }: { record: ShopRecord; delay?: number; tilt: string }) {
  const trip = tripById(record.tripId)
  return (
    <article
      data-reveal
      style={{ '--d': `${delay}ms` } as CSSProperties}
      aria-label={`${record.name}, ${record.price} ${record.currency}`}
      className={cn('paper-hi shadow-paper relative p-3 text-ink', tilt)}
    >
      <div className="grid grid-cols-[5.5rem_1fr] items-start gap-3">
        <div className="relative aspect-[4/5] overflow-hidden bg-paper-lo">
          <Image src={record.image} alt={record.alt} fill sizes="6rem" className="object-cover" />
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-lg leading-tight font-bold">{record.name}</h3>
          <p className="mt-1 flex items-baseline gap-1.5">
            <span className="font-mono text-base font-medium">{record.price}</span>
            <span className="font-mono text-[0.6rem] tracking-[0.18em] text-ink/60 uppercase">{record.currency}</span>
          </p>
          <p className="mt-1.5 font-mono text-[0.68rem] leading-snug text-ink/75 text-pretty">{record.place}</p>
          <p className="font-mono text-[0.68rem] text-ink/55">
            {record.date} · {record.category}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-dashed border-ink/35 pt-2.5">
        <div className="relative size-7 shrink-0 overflow-hidden rounded-[2px] bg-ink-3">
          <Image src={trip.photo} alt="" fill sizes="2rem" className="object-cover" />
        </div>
        <p className="font-mono text-[0.62rem] tracking-wide text-ink/70 uppercase">
          From the trip <span className="font-medium text-vermilion">{trip.city}</span> · {trip.dates.slice(0, 7)}
        </p>
      </div>

      <FeedbackStamps name={record.name} />
    </article>
  )
}

export function Discovery() {
  return (
    <section id="discovery" aria-labelledby="discovery-title" className="relative px-4 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <SectionHeading
            id="discovery-title"
            folio="p.03"
            label="Shared discovery"
            className="lg:col-span-7"
            title={
              <>
                Find the thing, <span className="text-vermilion-hi">then the trip behind it.</span>
              </>
            }
          >
            <p>
              Search shared records for a product. Every result stays tied to the booklet it came from, so you can see
              the whole trip — and stamp what you would pick up, or leave on the shelf.
            </p>
          </SectionHeading>
          <div className="lg:col-span-5 lg:col-start-8">
            <SearchPreview />
          </div>
        </div>

        <div className="mt-16 space-y-14 lg:mt-24 lg:space-y-20">
          <div className="flex flex-col items-center lg:flex-row lg:items-center">
            <div className="w-full max-w-xs lg:w-[26%] lg:max-w-none lg:-rotate-2">
              <SharedTrip trip={tripById('tokyo')} shared={2} />
            </div>
            <Thread />
            <div className="grid w-full flex-1 gap-6 sm:grid-cols-2">
              <PublicRecord record={recordById('matcha')} tilt="lg:rotate-1" />
              <PublicRecord record={recordById('cup')} delay={100} tilt="lg:-rotate-1 lg:mt-6" />
            </div>
          </div>

          <div className="flex flex-col items-center lg:flex-row lg:items-center">
            <div className="w-full max-w-xs lg:w-[26%] lg:max-w-none lg:rotate-1">
              <SharedTrip trip={tripById('seoul')} shared={1} />
            </div>
            <Thread />
            <div className="grid w-full flex-1 gap-6 sm:grid-cols-2">
              <PublicRecord record={recordById('hanji')} tilt="lg:-rotate-1" />
              <div className="hidden items-center justify-center sm:flex">
                <HandNote tone="light" className="max-w-[15rem] rotate-2 text-center">
                  one thread per record — follow it back to the booklet it was pinned in
                </HandNote>
              </div>
            </div>
          </div>
        </div>

        <p className="text-muted-ivory mt-14 max-w-xl font-mono text-[0.68rem] leading-relaxed tracking-wide">
          Search and stamps are a visual preview. Shared trips and records shown here are demo content.
        </p>
      </div>
    </section>
  )
}
