import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import { tornClip } from '@/lib/paper'
import { records, tripById, type ShopRecord } from '@/lib/demo-data'
import { DateStamp, Drift, HandNote, PostageStamp, Receipt, Scribble } from './paper'
import { SectionHeading } from './section-heading'

function RecordPair({
  record,
  seed,
  flip,
  className,
  delay = 0,
  visibility = 'Private',
}: {
  record: ShopRecord
  seed: number
  flip?: boolean
  className?: string
  delay?: number
  visibility?: 'Private' | 'Public'
}) {
  const trip = tripById(record.tripId)
  const rows: [string, string][] = [
    ['Where', record.place],
    ['When', record.date],
    ['Type', record.category],
  ]

  return (
    <article
      data-reveal
      style={{ '--d': `${delay}ms` } as CSSProperties}
      aria-label={`${record.name}, ${record.price} ${record.currency}`}
      className={cn('relative', className)}
    >
      <div className={cn('flex items-start', flip && 'flex-row-reverse')}>
        <PostageStamp
          src={record.image}
          alt={record.alt}
          price={record.price}
          currency={record.currency}
          className={cn('relative z-10 w-36 shrink-0 sm:w-40', flip ? 'rotate-3' : '-rotate-3')}
        />
        <Receipt
          seed={seed}
          className={cn('mt-8 min-w-0 flex-1', flip ? '-mr-6' : '-ml-6')}
          innerClassName={cn('p-4 pt-5 text-ink', flip ? 'pr-8' : 'pl-8')}
        >
          <p className="flex items-center justify-between text-[0.58rem] tracking-[0.2em] text-ink/55 uppercase">
            <span>{trip.city}</span>
            <span className="border-ink/40 border px-1 py-px">{visibility}</span>
          </p>
          <h3 className="font-display mt-1.5 text-lg leading-tight font-bold">{record.name}</h3>
          <p className="mt-1 flex items-baseline gap-2 border-y border-dashed border-ink/40 py-1.5">
            <span className="text-base font-medium">{record.price}</span>
            <span className="text-[0.62rem] tracking-[0.18em] text-ink/60 uppercase">{record.currency} · as paid</span>
          </p>
          <dl className="mt-2 space-y-1">
            {rows.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[3rem_1fr] gap-2">
                <dt className="text-[0.6rem] tracking-[0.15em] text-ink/50 uppercase">{k}</dt>
                <dd className="text-pretty">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="font-hand mt-2.5 text-[0.95rem] leading-snug font-semibold text-pen">“{record.note}”</p>
        </Receipt>
      </div>
    </article>
  )
}

export function Records() {
  const sheetClip = tornClip(11, { top: true, bottom: true, left: true, right: true, depth: 10 })
  const layout: { id: string; flip?: boolean; className?: string; visibility?: 'Private' | 'Public' }[] = [
    { id: 'matcha', visibility: 'Public' },
    { id: 'cup', flip: true, className: 'xl:mt-16', visibility: 'Public' },
    { id: 'notebook', className: 'xl:mt-6' },
    { id: 'tenugui', flip: true, className: 'xl:-mt-4' },
    { id: 'hanji', className: 'xl:mt-10', visibility: 'Public' },
    { id: 'sweets', flip: true, className: 'xl:mt-2' },
  ]

  return (
    <section id="records" aria-labelledby="records-title" className="relative px-2 py-10 sm:px-6 sm:py-16">
      <div className="drop-paper mx-auto max-w-[90rem]">
        <div className="paper relative px-5 py-16 sm:px-12 sm:py-24 xl:px-20" style={{ clipPath: sheetClip }}>
          <div className="relative">
            <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
              <SectionHeading
                id="records-title"
                folio="p.02"
                label="Shopping records"
                tone="paper"
                className="lg:col-span-7"
                title={
                  <>
                    Each purchase, <span className="text-vermilion">pinned to its proof.</span>
                  </>
                }
              >
                <p>
                  A stamp for what it looked like, a receipt scrap for the facts: price and currency exactly as paid,
                  the shop, the day, the kind of thing it is — and one line only you would write.
                </p>
              </SectionHeading>

              <div className="relative flex items-center gap-4 lg:col-span-4 lg:col-start-9">
                <Drift speed={-0.05}>
                  <DateStamp top="Kept" middle="No.06" bottom="Pages" className="-rotate-6" />
                </Drift>
                <div>
                  <HandNote tone="pen" className="max-w-[13rem] rotate-1">
                    keep the receipt — future you will thank you
                  </HandNote>
                  <Scribble className="text-pen -mt-1 ml-2 h-8 w-12 -scale-x-100 rotate-[200deg]" />
                </div>
              </div>
            </div>

            <div className="mt-16 grid gap-x-14 gap-y-16 md:grid-cols-2 xl:grid-cols-3">
              {layout.map((item, i) => (
                <RecordPair
                  key={item.id}
                  record={records.find((r) => r.id === item.id) as ShopRecord}
                  seed={i + 2}
                  flip={item.flip}
                  className={item.className}
                  delay={(i % 3) * 90}
                  visibility={item.visibility}
                />
              ))}
            </div>

            <p className="mt-16 max-w-xl font-mono text-[0.68rem] leading-relaxed tracking-wide text-ink/60">
              Six pages from three trips. Public records can be found by others; private ones stay in your booklet. Shops,
              prices and notes are demo content.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
