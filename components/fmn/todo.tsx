import { Check } from 'lucide-react'
import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import { tornClip } from '@/lib/paper'
import { recordById } from '@/lib/demo-data'
import { HandNote, PostageStamp, Receipt, Scribble } from './paper'
import { SectionHeading } from './section-heading'

const planned = [
  {
    name: 'Ash-glaze tea cup',
    image: '/products/ceramic-cup.png',
    alt: 'Speckled ceramic tea cup, shown faded because it is still planned',
    ref: '¥3,800',
    currency: 'JPY',
    source: 'from a shared record',
    place: 'Kappabashi, if the stall is open',
    note: 'maybe two — one is for mum',
    tilt: '-rotate-1',
  },
  {
    name: 'Hanji paper pouch',
    image: '/products/hanji-pouch.png',
    alt: 'Hanji paper pouch, shown faded because it is still planned',
    ref: '₩12,000',
    currency: 'KRW',
    source: 'from a shared record',
    place: 'Insadong paper shop',
    note: 'check size before buying',
    tilt: 'rotate-[0.8deg]',
  },
  {
    name: 'Incense, small box',
    image: '/products/incense.png',
    alt: 'Small box of incense sticks, shown faded because it is still planned',
    ref: '¥2,200',
    currency: 'JPY',
    source: 'my own guess',
    place: 'Somewhere near Nishijin, Kyoto',
    note: 'smell it first!',
    tilt: '-rotate-[0.6deg]',
  },
]

const bought = [
  { id: 'matcha', ref: '¥1,500', seed: 21, tilt: 'rotate-2' },
  { id: 'notebook', ref: '¥1,000', seed: 24, tilt: '-rotate-2' },
]

function PlannedSlip({ item, delay }: { item: (typeof planned)[number]; delay: number }) {
  return (
    <li
      data-reveal
      style={{ '--d': `${delay}ms` } as CSSProperties}
      className={cn(
        'border-ink/50 relative flex gap-4 border-2 border-dashed bg-paper-hi/55 p-3 pr-4 text-ink',
        item.tilt,
      )}
    >
      <span
        aria-hidden="true"
        className="border-ink/70 mt-1 size-6 shrink-0 rounded-[2px] border-2 bg-paper-hi/70"
      />
      <PostageStamp
        ghost
        src={item.image}
        alt={item.alt}
        price={item.ref}
        currency={item.currency}
        className="hidden w-24 shrink-0 sm:block"
        sizes="6rem"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg leading-tight font-bold">{item.name}</h3>
          <span className="border-ink/60 shrink-0 border px-1.5 py-0.5 font-mono text-[0.58rem] tracking-[0.18em] uppercase">
            Planned
          </span>
        </div>
        <p className="mt-1.5 font-mono text-[0.72rem] leading-relaxed">
          <span className="text-ink/55 uppercase">Reference price </span>
          <span className="border-b border-dotted border-ink/60 font-medium">
            {item.ref} {item.currency}
          </span>
          <span className="text-ink/55"> · {item.source}</span>
        </p>
        <p className="font-mono text-[0.72rem] text-ink/75">
          <span className="text-ink/55 uppercase">Plan </span>
          {item.place}
        </p>
        <p className="font-hand mt-1 text-[0.95rem] font-semibold text-pen">“{item.note}”</p>
      </div>
    </li>
  )
}

export function Todo() {
  const sheetClip = tornClip(29, { top: true, bottom: true, left: true, right: true, depth: 9 })

  return (
    <section id="todo" aria-labelledby="todo-title" className="relative px-2 py-10 sm:px-6 sm:py-16">
      <div className="drop-paper mx-auto max-w-[90rem]">
        <div className="paper-kraft relative px-5 py-16 sm:px-12 sm:py-24 xl:px-20" style={{ clipPath: sheetClip }}>
          <SectionHeading
            id="todo-title"
            folio="p.04"
            label="Shopping todo"
            tone="paper"
            title={
              <>
                Plan the buying. <span className="text-vermilion">Then watch it become a record.</span>
              </>
            }
          >
            <p>
              Before the trip, a todo slip carries a reference price someone else paid. Once it is bought, the slip is
              replaced by a record with the price you actually paid.
            </p>
          </SectionHeading>

          <div className="mt-14 grid gap-12 lg:grid-cols-12 lg:gap-10">
            {/* Planned */}
            <div className="lg:col-span-7">
              <div className="paper-hi paper-lined shadow-paper relative px-4 pt-5 pb-6 sm:px-7">
                <div className="mb-4 flex items-center justify-between font-mono text-[0.65rem] tracking-[0.2em] text-ink/70 uppercase">
                  <span>Still to buy · 3</span>
                  <span className="text-vermilion">Dashed = not yet bought</span>
                </div>
                <ul className="space-y-5">
                  {planned.map((item, i) => (
                    <PlannedSlip key={item.name} item={item} delay={i * 100} />
                  ))}
                </ul>
              </div>
            </div>

            {/* Bought */}
            <div className="relative lg:col-span-5">
              <div className="mb-4 flex items-center justify-between font-mono text-[0.65rem] tracking-[0.2em] text-ink/70 uppercase">
                <span>Bought · 2</span>
                <span className="text-vermilion">Solid = now a record</span>
              </div>

              <div className="space-y-8">
                {bought.map(({ id, ref, seed, tilt }, i) => {
                  const r = recordById(id)
                  return (
                    <div key={id} data-reveal style={{ '--d': `${i * 120}ms` } as CSSProperties} className={cn('relative', tilt)}>
                      <Receipt seed={seed} innerClassName="relative p-4 text-ink">
                        <div className="flex gap-4">
                          <PostageStamp
                            src={r.image}
                            alt={r.alt}
                            price={r.price}
                            currency={r.currency}
                            className="w-24 shrink-0"
                            sizes="6rem"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="bg-vermilion text-paper-hi flex size-6 shrink-0 items-center justify-center rounded-[2px]">
                                <Check className="size-4" strokeWidth={3} aria-hidden="true" />
                              </span>
                              <h3 className="font-display text-lg leading-tight font-bold">{r.name}</h3>
                            </div>
                            <p className="mt-2 text-ink/60 line-through decoration-ink/50">
                              Reference {ref} {r.currency}
                            </p>
                            <p className="mt-0.5 text-sm font-medium">
                              Paid {r.price} {r.currency}
                            </p>
                            <p className="text-ink/65">
                              {r.place} · {r.date}
                            </p>
                          </div>
                        </div>
                        <span
                          aria-hidden="true"
                          className="ink-stamp border-vermilion text-vermilion absolute right-3 bottom-3 -rotate-12 border-[3px] px-2 py-0.5 font-display text-xl font-extrabold tracking-[0.12em] uppercase"
                        >
                          Bought
                        </span>
                      </Receipt>
                    </div>
                  )
                })}
              </div>

              <div className="mt-8 flex items-center gap-3 text-pen">
                <Scribble variant="curve" className="h-10 w-14 shrink-0 rotate-[100deg]" />
                <HandNote tone="pen" className="max-w-[14rem]">
                  ticked off, then filed as a record with the real price
                </HandNote>
              </div>
            </div>
          </div>

          <p className="mt-14 max-w-xl font-mono text-[0.68rem] leading-relaxed tracking-wide text-ink/65">
            Reference prices are what other travelers recorded and may not match what you pay. Items and prices are demo
            content.
          </p>
        </div>
      </div>
    </section>
  )
}
