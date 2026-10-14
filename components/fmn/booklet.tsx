import Image from 'next/image'
import { FmnMark } from './paper'
import { EditableDates } from './editable-dates'

/**
 * The hero booklet. The cover swings open on hover / focus to hint at the pages inside —
 * it's a motif only, there is no reader behind it.
 */
export function Booklet() {
  return (
    <div className="group relative aspect-[3/4] w-[min(76vw,21.5rem)] sm:w-[23rem]" style={{ perspective: '2000px' }}>
      {/* Inside first page + stacked page edges */}
      <div
        className="paper-hi absolute inset-0 overflow-hidden"
        style={{
          boxShadow:
            '1px 1px 0 #d8cbb0, 2px 2px 0 #f6efde, 3px 3px 0 #cfc2a5, 4px 4px 0 #f1e9d6, 5px 5px 0 #c9bc9f, 6px 6px 0 #ece2cb, 7px 7px 0 #bfb295, 14px 24px 36px -10px rgba(0,0,0,0.65), 0 2px 4px rgba(0,0,0,0.4)',
        }}
      >
        <div className="flex h-full flex-col justify-between p-5 pl-8 text-ink">
          <div>
            <p className="font-mono text-[0.6rem] tracking-[0.22em] text-vermilion uppercase">Page 01 · Ledger</p>
            <p className="font-display mt-3 text-2xl leading-tight font-extrabold">What came home</p>
            <p className="font-hand mt-1 text-sm text-pen">tap to peek — nothing is saved</p>
          </div>
          <dl className="font-mono text-[0.72rem] leading-loose">
            {[
              ['Spent', '¥48,600'],
              ['Items', '14'],
              ['Categories', '5'],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between border-b border-dashed border-ink/30">
                <dt className="text-ink/60 uppercase">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="font-mono text-[0.58rem] tracking-widest text-ink/50 uppercase">Demo content</p>
        </div>
        <span className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-black/25 to-transparent" />
      </div>

      {/* Cover */}
      <div
        className="booklet-cover absolute inset-0 origin-left transition-transform duration-[900ms] ease-[cubic-bezier(0.3,0.7,0.2,1)] group-focus-within:[transform:rotateY(-34deg)] group-hover:[transform:rotateY(-34deg)]"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div
          className="paper-hi absolute inset-0 overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            boxShadow: '0 1px 0 rgba(255,255,255,0.5) inset, 0 3px 6px rgba(0,0,0,0.3)',
          }}
        >
          {/* spine crease */}
          <span className="absolute inset-y-0 left-0 z-20 w-5 bg-gradient-to-r from-black/30 via-black/5 to-transparent" />
          <span className="absolute inset-y-0 left-5 z-20 w-px bg-black/20" />

          {/* top strip */}
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 pt-4 pl-8 font-mono text-[0.58rem] tracking-[0.2em] text-ink uppercase">
            <span className="flex items-center gap-1.5">
              <FmnMark className="size-4 text-ink" />
              FMN · Forget Me Not
            </span>
            <span>Vol. 01</span>
          </div>

          {/* cut-paper block + photo */}
          <div
            className="absolute top-[11%] right-[7%] h-[52%] w-[72%] bg-vermilion"
            style={{ clipPath: 'polygon(3% 0, 100% 4%, 97% 100%, 0 96%)', transform: 'rotate(2.5deg)' }}
          />
          <div
            className="absolute top-[13%] right-[11%] h-[50%] w-[70%] overflow-hidden"
            style={{
              clipPath: 'polygon(0 2%, 96% 0, 100% 97%, 4% 100%)',
              transform: 'rotate(-1.5deg)',
              boxShadow: '0 6px 12px rgba(0,0,0,0.4)',
            }}
          >
            <Image
              src="/photos/trip-tokyo.png"
              alt="Film photograph of a Tokyo backstreet at dusk"
              fill
              priority
              sizes="(min-width: 640px) 16rem, 55vw"
              className="object-cover saturate-[0.85] contrast-[1.05]"
            />
          </div>

          {/* vertical kanji */}
          <p
            lang="ja"
            className="font-display absolute top-[15%] left-[9%] z-10 text-xl leading-tight font-bold text-ink [writing-mode:vertical-rl]"
          >
            東京
            <span className="text-vermilion">・買い物</span>
          </p>

          {/* title */}
          <p className="font-display absolute bottom-[19%] -left-1 z-10 w-full pl-8 text-[4.2rem] leading-none font-extrabold tracking-[-0.03em] text-ink mix-blend-multiply sm:text-[5rem]">
            TOKYO
          </p>

          {/* bottom ledger line */}
          <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-4 pl-8">
            <div className="border-t border-ink/70 pt-2">
              <EditableDates />
              <p className="mt-1.5 text-center font-mono text-[0.55rem] tracking-[0.22em] text-ink/60 uppercase">
                A shopping record · dates are editable
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
