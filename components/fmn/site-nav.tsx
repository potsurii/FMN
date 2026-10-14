import Link from 'next/link'
import { FmnMark } from './paper'

export function SiteNav({ homeHref = '/' }: { homeHref?: string }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-paper/10 bg-ink/80 backdrop-blur-md">
      <nav
        aria-label="Primary"
        className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-8"
      >
        <Link href={homeHref} className="flex items-center gap-2.5 text-paper-hi" aria-label="FMN — Forget Me Not">
          <FmnMark className="size-6" />
          <span className="font-display text-xl leading-none font-extrabold tracking-[0.08em]">FMN</span>
        </Link>

        <ul className="flex items-center gap-1 text-sm sm:gap-3">
          <li>
            <Link
              href={homeHref}
              className="rounded-sm px-2.5 py-2 text-paper/80 transition-colors hover:text-paper-hi sm:px-3"
            >
              我的旅行
            </Link>
          </li>
          <li>
            <Link
              href="/login"
              className="rounded-sm px-2.5 py-2 text-paper/80 transition-colors hover:text-paper-hi sm:px-3"
            >
              Log in
            </Link>
          </li>
          <li>
            <Link
              href="/register"
              className="bg-vermilion text-paper-hi hover:bg-vermilion-hi hover:text-ink ml-1 inline-block px-3.5 py-2 font-medium transition-colors"
              style={{ clipPath: 'polygon(0 6%, 4% 0, 100% 3%, 98% 100%, 3% 96%)' }}
            >
              Sign up
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  )
}
