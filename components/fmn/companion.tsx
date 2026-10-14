import { Folders, ListChecks, Mic, ReceiptText, Search, X, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HandNote, Receipt, Scribble } from './paper'
import { SectionHeading } from './section-heading'

const abilities = [
  { icon: ReceiptText, title: 'Draft from a receipt', body: 'Reads a photographed receipt and fills in a draft record for you to check.' },
  { icon: Mic, title: 'Speak it, get text', body: 'Say what you bought; the words are transcribed into the draft.' },
  { icon: Search, title: 'Search your history', body: 'Ask where you found something or what you paid, across your own booklets.' },
  { icon: Folders, title: 'Tidy your records', body: 'Suggests categories and groupings. You decide what changes.' },
  { icon: ListChecks, title: 'Prepare a todo', body: 'Turns an idea into a planned item with a reference price.' },
]

const bars = [0.4, 0.8, 0.55, 1, 0.7, 0.35, 0.9, 0.6, 0.85, 0.45, 0.75, 0.3, 0.65, 0.5]

function Drawer() {
  return (
    <div className="paper-hi shadow-paper relative w-full max-w-[21rem] text-ink">
      <div className="bg-ink text-paper-hi flex items-center justify-between px-4 py-3">
        <p className="font-display flex items-center gap-2 font-bold">
          <span className="bg-vermilion size-2 rounded-full" aria-hidden="true" />
          FMN Companion
        </p>
        <X className="size-4 text-muted-ivory" aria-hidden="true" />
      </div>

      <div className="space-y-4 p-4">
        <div className="flex justify-end">
          <div className="max-w-[85%] bg-ink/8 px-3 py-2 text-sm">
            <p className="font-mono text-[0.6rem] tracking-wide text-ink/60 uppercase">You · photo attached</p>
            Make a draft from this receipt.
          </div>
        </div>

        <div className="border-2 border-dashed border-vermilion p-3">
          <p className="flex items-center justify-between font-mono text-[0.6rem] tracking-[0.18em] text-vermilion uppercase">
            <span>Draft record</span>
            <span>Not saved</span>
          </p>
          <dl className="mt-2 space-y-1 font-mono text-[0.72rem]">
            {[
              ['Item', 'Matcha tin, 30 g'],
              ['Price', '¥1,680 JPY'],
              ['Shop', 'Nakamise Tea Counter'],
              ['Date', '2026.03.15'],
              ['Type', 'Food & tea'],
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[3rem_1fr] gap-2 border-b border-dotted border-ink/25 pb-1">
                <dt className="text-ink/50 uppercase">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-3 flex gap-2 font-mono text-[0.68rem] tracking-wide uppercase">
            <span className="border-ink/50 flex-1 border py-1.5 text-center">Edit</span>
            <span className="bg-vermilion text-paper-hi flex-1 py-1.5 text-center">Confirm &amp; save</span>
          </div>
        </div>

        <div className="bg-ink/8 px-3 py-2.5">
          <div className="flex items-center gap-3">
            <span className="bg-ink text-paper-hi flex size-8 shrink-0 items-center justify-center rounded-full">
              <Mic className="size-4" aria-hidden="true" />
            </span>
            <div className="flex h-7 flex-1 items-center gap-[3px]" aria-hidden="true">
              {bars.map((h, i) => (
                <span
                  key={i}
                  className="wave-bar bg-vermilion w-[3px] rounded-full"
                  style={{ height: `${h * 100}%`, animationDelay: `${i * 90}ms` }}
                />
              ))}
            </div>
          </div>
          <p className="font-hand mt-2 text-[0.95rem] font-semibold text-pen">
            “…a ceramic cup at Kappabashi, thirty-eight hundred yen.”
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 font-mono text-[0.62rem] tracking-wide uppercase">
          {['Search my history', 'Tidy records', 'Prepare todo'].map((c) => (
            <span key={c} className="border border-ink/40 px-2 py-1">
              {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export function Companion() {
  return (
    <section id="companion" aria-labelledby="companion-title" className="relative px-4 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-6">
            <SectionHeading
              id="companion-title"
              folio="p.05"
              label="Companion · a margin note"
              title={
                <>
                  A quiet helper <span className="text-vermilion-hi">in the margin.</span>
                </>
              }
            >
              <p>
                The main event is your booklet. The companion waits in a corner of the page and only drafts, suggests
                and finds — it never files anything without your say-so.
              </p>
            </SectionHeading>

            <ol className="mt-10 divide-y divide-dashed divide-paper/15 border-y border-dashed border-paper/15">
              {abilities.map(({ icon: Icon, title, body }, i) => (
                <li key={title} data-reveal style={{ ['--d' as string]: `${i * 70}ms` }} className="flex gap-4 py-4">
                  <span className="font-mono text-xs text-vermilion-hi pt-1">0{i + 1}</span>
                  <Icon className="mt-0.5 size-5 shrink-0 text-paper-hi" aria-hidden="true" />
                  <div>
                    <h3 className="font-display text-paper-hi text-lg font-bold">{title}</h3>
                    <p className="text-muted-ivory mt-0.5 text-sm leading-relaxed text-pretty sm:text-base">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Faded page with the drawer open */}
          <div className="relative lg:col-span-6" data-reveal>
            <div className="bg-ink-2 border-paper/10 relative mx-auto max-w-xl border p-4 pb-20 sm:p-6 sm:pb-24">
              <p className="mb-4 font-mono text-[0.6rem] tracking-[0.25em] text-muted-ivory uppercase">
                Illustration · the page behind
              </p>
              <div className="space-y-3 opacity-50" aria-hidden="true">
                <div className="bg-paper/15 h-4 w-2/5" />
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-paper/10 aspect-[4/5]" />
                  <div className="bg-paper/10 aspect-[4/5]" />
                  <div className="bg-paper/10 aspect-[4/5]" />
                </div>
                <div className="bg-paper/10 h-3 w-full" />
                <div className="bg-paper/10 h-3 w-4/5" />
              </div>

              <div className={cn('relative z-10 -mt-44 flex justify-end sm:-mt-52')}>
                <Drawer />
              </div>

              <div className="absolute right-4 bottom-4 sm:right-6 sm:bottom-5">
                <span
                  aria-hidden="true"
                  className="bg-vermilion text-paper-hi shadow-paper flex size-14 items-center justify-center rounded-full transition-transform hover:scale-105"
                >
                  <MessageCircle className="size-6" />
                </span>
              </div>
              <div className="absolute bottom-6 left-6 hidden items-end gap-2 text-vermilion-hi sm:flex">
                <HandNote tone="light" className="max-w-[10rem] -rotate-3">
                  the launcher stays out of the way
                </HandNote>
                <Scribble className="mb-3 h-8 w-14 -rotate-6" />
              </div>
            </div>

            <Receipt
              seed={44}
              className="absolute -top-6 right-2 z-20 hidden w-40 rotate-6 sm:block"
              innerClassName="p-3 pt-4 text-ink"
            >
              <p className="text-[0.58rem] tracking-[0.2em] uppercase text-ink/60">Always</p>
              <p className="font-display mt-1 text-sm leading-snug font-bold text-pretty">
                You review, edit and confirm before anything is saved.
              </p>
            </Receipt>
          </div>
        </div>
      </div>
    </section>
  )
}
