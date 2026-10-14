import { FmnMark } from './paper'

/**
 * Decorative open-book spread. The right leaf turns onto the left as the divider scrolls
 * into view (progress is written to --turn by ScrollEngine). Purely ornamental.
 */
export function PageTurn({
  from,
  chapter,
  title,
  teaser,
}: {
  from: string
  chapter: string
  title: string
  teaser: string
}) {
  return (
    <div aria-hidden="true" className="px-4 py-10 sm:px-8 sm:py-14">
      <div
        data-turn
        className="relative mx-auto grid h-[8.5rem] max-w-4xl grid-cols-2 sm:h-[11rem] md:h-[13rem]"
        style={{ perspective: '1800px' }}
      >
        {/* Left page: the chapter we just closed */}
        <div className="paper shadow-paper relative flex flex-col justify-between overflow-hidden rounded-l-[3px] p-3 sm:p-5">
          <span className="font-mono text-[0.6rem] tracking-[0.2em] text-pen uppercase">{from}</span>
          <FmnMark className="size-5 text-paper-lo sm:size-7" />
          <span className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/25 to-transparent" />
        </div>

        {/* Right page: the chapter that opens */}
        <div className="paper shadow-paper relative flex flex-col justify-between overflow-hidden rounded-r-[3px] p-3 sm:p-5">
          <span className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/25 to-transparent" />
          <span className="font-mono text-[0.6rem] tracking-[0.2em] text-vermilion uppercase">{chapter}</span>
          <div>
            <p className="font-display text-xl leading-none font-extrabold sm:text-3xl md:text-4xl">{title}</p>
            <p className="font-hand mt-1.5 text-xs text-pen sm:text-base">{teaser}</p>
          </div>
        </div>

        {/* The turning leaf */}
        <div className="turn-leaf absolute inset-y-0 right-0 w-1/2">
          <div className="turn-face paper paper-lined absolute inset-0 rounded-r-[3px]">
            <span className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/20 to-transparent" />
            <span className="turn-shade absolute inset-0 bg-gradient-to-r from-transparent to-black/60" />
            <span className="absolute right-3 bottom-2 font-mono text-[0.6rem] tracking-[0.2em] text-pen uppercase sm:right-5">
              turn →
            </span>
          </div>
          <div
            className="turn-face paper absolute inset-0 rounded-l-[3px]"
            style={{ transform: 'rotateY(180deg)' }}
          >
            <span className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/20 to-transparent" />
            <span className="turn-shade absolute inset-0 bg-gradient-to-l from-transparent to-black/60" />
            <FmnMark className="absolute bottom-3 left-3 size-5 text-paper-lo sm:left-5 sm:size-7" />
          </div>
        </div>
      </div>
    </div>
  )
}
