import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Cut-paper sign-up button. */
export function SignUpCta({ href = '/register', className }: { href?: string; className?: string }) {
  return (
    <span className={cn('drop-paper inline-block', className)}>
      <a
        href={href}
        className="group bg-vermilion text-paper-hi hover:bg-vermilion-hi hover:text-ink font-display inline-flex items-center gap-3 px-8 py-4 text-lg font-bold transition-colors"
        style={{ clipPath: 'polygon(0 8%, 3% 0, 52% 4%, 100% 0, 98% 52%, 100% 100%, 46% 96%, 2% 100%, 0 50%)' }}
      >
        Sign up
        <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </a>
    </span>
  )
}
