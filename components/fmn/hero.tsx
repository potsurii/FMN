import { Booklet } from './booklet'
import { SignUpCta } from './cta'
import { DateStamp, Drift, HandNote, Photo, Receipt, Scribble } from './paper'

const contents = [
  ['01', 'Archive', '#archive'],
  ['02', 'Records', '#records'],
  ['03', 'Discovery', '#discovery'],
  ['04', 'Todo', '#todo'],
  ['05', 'Companion', '#companion'],
]

function HeroTicket() {
  return (
    <div className="drop-paper">
      <div className="ticket-shape paper-hi flex w-52 text-ink sm:w-60">
        <div className="flex w-9 items-center justify-center border-r border-dashed border-ink/40 bg-vermilion/10">
          <span className="font-mono text-[0.55rem] tracking-[0.25em] whitespace-nowrap uppercase [writing-mode:vertical-rl] rotate-180">
            Sample ticket
          </span>
        </div>
        <div className="flex-1 px-3 py-2.5">
          <p className="font-mono text-[0.55rem] tracking-[0.2em] text-ink/60 uppercase">Local line · Demo</p>
          <p className="font-display mt-1 text-lg leading-none font-bold">Asakusa → Ginza</p>
          <div className="mt-2 flex items-end justify-between gap-2">
            <div className="barcode h-6 flex-1 opacity-80" />
            <span className="font-mono text-sm font-medium">¥190</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Hero() {
  return (
    <section id="top" aria-labelledby="hero-title" className="relative overflow-x-clip pt-24 pb-8 sm:pt-32">
      {/* Cut-paper backdrop shapes */}
      <div
        aria-hidden="true"
        className="bg-ink-2 absolute top-24 -left-20 h-[38rem] w-[34rem] -rotate-3 opacity-80"
        style={{ clipPath: 'polygon(4% 0, 100% 6%, 94% 100%, 0 92%)' }}
      />

      <div className="relative mx-auto grid max-w-7xl gap-x-10 gap-y-14 px-4 sm:px-8 lg:grid-cols-12 lg:items-center">
        {/* Stage with the booklet */}
        <div className="relative order-2 mx-auto flex min-h-[34rem] w-full max-w-xl items-center justify-center sm:min-h-[42rem] lg:order-1 lg:col-span-7 lg:max-w-none">
          <Drift speed={0.04} className="relative z-10">
            <div className="-rotate-2">
              <Booklet />
            </div>
          </Drift>

          <Drift speed={-0.06} float="a" className="absolute top-2 -left-1 z-20 sm:top-6 sm:left-2 lg:left-4">
            <Receipt seed={3} className="-rotate-6" innerClassName="w-32 p-3 pt-4 text-ink sm:w-40">
              <p className="text-center text-[0.6rem] tracking-[0.25em] uppercase">Sample receipt</p>
              <p className="mt-1 border-y border-dashed border-ink/40 py-1 text-center font-medium">Tea counter</p>
              <p className="mt-1 flex justify-between">
                <span>Matcha 30g</span>
                <span>¥1,680</span>
              </p>
              <p className="flex justify-between text-ink/60">
                <span>2026.03.15</span>
                <span>JPY</span>
              </p>
              <div className="barcode mt-2 h-4 opacity-70" />
            </Receipt>
          </Drift>

          <Drift speed={0.1} float="b" className="absolute top-0 right-0 z-0 sm:right-2 lg:right-0">
            <Photo
              src="/photos/trip-kyoto.png"
              alt="Film photograph of a Kyoto street in autumn"
              className="w-28 rotate-6 sm:w-36"
              sizes="9rem"
              caption="Kyoto, last Nov"
            />
          </Drift>

          <Drift speed={-0.1} float="a" className="absolute right-0 bottom-10 z-20 sm:right-2 sm:bottom-14 lg:right-0">
            <Photo
              src="/photos/trip-osaka.png"
              alt="Film photograph of an Osaka shopping arcade"
              className="w-24 -rotate-6 sm:w-32"
              sizes="8rem"
              aspect="aspect-square"
            />
          </Drift>

          <Drift speed={0.07} float="b" className="absolute bottom-0 left-0 z-20 sm:bottom-6 sm:left-0 lg:-left-2">
            <div className="rotate-3">
              <HeroTicket />
            </div>
          </Drift>

          <Drift speed={-0.03} className="absolute top-[44%] right-[2%] z-30 sm:right-[6%]">
            <DateStamp top="2026" middle="14.03" bottom="Tokyo" className="rotate-12" tone="light" />
          </Drift>

          <Drift speed={0.05} className="absolute top-[40%] left-0 z-30 hidden sm:block lg:-left-6">
            <div className="flex -rotate-6 items-start gap-1 text-vermilion-hi">
              <HandNote tone="light" className="w-28">
                the tin I almost forgot!
              </HandNote>
              <Scribble className="mt-3 h-10 w-14 rotate-12" />
            </div>
          </Drift>
        </div>

        {/* Intro */}
        <div className="relative order-1 lg:order-2 lg:col-span-5">
          <p className="flex items-center gap-3 font-mono text-[0.7rem] tracking-[0.22em] text-vermilion-hi uppercase">
            <span>Forget Me Not</span>
            <span aria-hidden="true" className="h-px w-8 bg-current" />
            <span lang="ja" className="font-display text-sm tracking-[0.3em]">
              勿忘草
            </span>
          </p>

          <h1
            id="hero-title"
            className="font-display text-paper-hi mt-5 text-[2.35rem] leading-[1.12] font-extrabold tracking-tight text-balance sm:text-5xl xl:text-[3.35rem]"
          >
            Record what you bought, and help the next traveler know{' '}
            <span className="text-vermilion-hi">where to buy it</span> and{' '}
            <span className="text-vermilion-hi">how much it costs.</span>
          </h1>

          <p className="text-muted-ivory mt-6 max-w-md text-base leading-relaxed text-pretty sm:text-lg">
            FMN keeps every souvenir as a small, tactile entry — photo, price, currency, shop, date — then lets you pass
            on the ones worth finding.
          </p>

          <div className="mt-9">
            <SignUpCta />
          </div>

          <nav aria-label="In this issue" className="mt-12 max-w-md">
            <p className="font-mono text-[0.62rem] tracking-[0.25em] text-muted-ivory uppercase">In this issue</p>
            <ol className="border-paper/15 mt-3 divide-y divide-dashed divide-paper/15 border-y border-dashed">
              {contents.map(([no, label, href]) => (
                <li key={no}>
                  <a
                    href={href}
                    className="group flex items-baseline justify-between py-2 text-paper/85 transition-colors hover:text-vermilion-hi"
                  >
                    <span className="font-display text-lg">{label}</span>
                    <span className="font-mono text-xs text-muted-ivory group-hover:text-vermilion-hi">p.{no}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <p className="text-muted-ivory mt-6 font-mono text-[0.68rem] leading-relaxed tracking-wide">
            Prototype page. Every trip, shop, price and note shown here is demo content.
          </p>
        </div>
      </div>
    </section>
  )
}
