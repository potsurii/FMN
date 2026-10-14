import { Link2 } from 'lucide-react'
import { SignUpCta } from './cta'
import { DateStamp, Drift, FmnMark, HandNote, Photo, Scribble } from './paper'

function BackCover() {
  return (
    <div
      className="paper relative aspect-[3/4] w-[min(72vw,20rem)] -rotate-3 sm:w-[21rem]"
      style={{
        boxShadow:
          '-1px 1px 0 #d8cbb0, -2px 2px 0 #f6efde, -3px 3px 0 #cfc2a5, -4px 4px 0 #f1e9d6, -5px 5px 0 #c9bc9f, -14px 26px 40px -10px rgba(0,0,0,0.7)',
      }}
    >
      <span className="absolute inset-y-0 right-0 w-5 bg-gradient-to-l from-black/25 to-transparent" />
      <div className="flex h-full flex-col items-center justify-between p-7 text-center text-ink">
        <FmnMark className="size-10 text-ink" />
        <div>
          <p lang="ja" className="font-display text-5xl font-extrabold">
            勿忘草
          </p>
          <p className="font-hand mt-3 text-lg font-semibold text-pen text-balance">
            so the next traveler doesn&apos;t have to guess
          </p>
        </div>
        <div className="w-full">
          <div className="barcode h-8 w-full opacity-75" />
          <p className="mt-1.5 font-mono text-[0.55rem] tracking-[0.25em] uppercase text-ink/60">
            FMN · Forget Me Not · Vol. 01
          </p>
        </div>
      </div>
    </div>
  )
}

export function Closing() {
  return (
    <section id="closing" aria-labelledby="closing-title" className="relative overflow-x-clip px-4 pt-16 pb-10 sm:px-8 sm:pt-24">
      <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-12">
        <div className="relative lg:col-span-7">
          <p className="flex items-center gap-3 font-mono text-[0.7rem] tracking-[0.22em] text-vermilion-hi uppercase">
            <span>Last page</span>
            <span aria-hidden="true" className="h-px w-10 bg-current" />
            <span>Start your first booklet</span>
          </p>
          <h2
            id="closing-title"
            className="font-display text-paper-hi mt-5 text-5xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-6xl lg:text-7xl"
          >
            Keep it. <span className="text-vermilion-hi">Pass it on.</span>
          </h2>
          <p className="text-muted-ivory mt-6 max-w-lg text-lg leading-relaxed text-pretty">
            Begin a booklet for your next trip, pin what you buy, and share the pages that might save someone else a
            wrong turn.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-6">
            <SignUpCta href="/register" />
            <div className="relative">
              <div
                role="img"
                aria-label="Placeholder share link for a trip booklet"
                className="paper-hi shadow-paper flex max-w-full -rotate-1 items-center gap-2.5 px-3.5 py-2.5 text-ink"
              >
                <Link2 className="size-4 shrink-0 text-vermilion" aria-hidden="true" />
                <span className="font-mono text-[0.72rem] break-all sm:text-xs">fmn.example/trip/your-trip</span>
                <span className="border-ink/40 shrink-0 border border-dashed px-1.5 py-0.5 font-mono text-[0.55rem] tracking-[0.18em] uppercase">
                  Placeholder
                </span>
              </div>
              <HandNote tone="light" className="mt-2 ml-3 max-w-[14rem] rotate-1">
                a share link for a whole trip, one day
              </HandNote>
            </div>
          </div>
        </div>

        <div className="relative flex min-h-[26rem] items-center justify-center lg:col-span-5">
          <Drift speed={0.04} className="relative z-10">
            <BackCover />
          </Drift>
          <Drift speed={-0.08} float="a" className="absolute top-0 left-0 z-20 sm:left-4">
            <Photo
              src="/photos/trip-kyoto.png"
              alt="Film photograph of a Kyoto street in autumn"
              className="w-24 -rotate-6 sm:w-28"
              sizes="8rem"
              aspect="aspect-square"
            />
          </Drift>
          <Drift speed={0.1} className="absolute right-0 bottom-6 z-20 sm:right-4">
            <DateStamp top="Fin." middle="Vol.01" bottom="FMN" className="rotate-12" tone="light" />
          </Drift>
          <Scribble variant="loop" className="text-vermilion-hi absolute bottom-2 left-2 hidden h-12 w-16 sm:block" />
        </div>
      </div>

      <footer className="border-paper/15 mx-auto mt-24 flex max-w-7xl flex-col gap-3 border-t border-dashed pt-6 font-mono text-[0.68rem] tracking-wide text-muted-ivory sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2">
          <FmnMark className="size-4 text-paper" />
          FMN — Forget Me Not. A prototype landing page.
        </p>
        <p>All trips, shops, prices and notes are demo content. No data is stored.</p>
      </footer>
    </section>
  )
}
