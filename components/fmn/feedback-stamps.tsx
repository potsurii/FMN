'use client'

import { ThumbsDown, ThumbsUp } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

type Choice = 'up' | 'down' | null

/** Visual preview of the recommend / not-recommend stamps. Nothing is stored. */
export function FeedbackStamps({ name }: { name: string }) {
  const [choice, setChoice] = useState<Choice>(null)

  const toggle = (next: Exclude<Choice, null>) => setChoice((c) => (c === next ? null : next))

  const base =
    'inline-flex flex-1 items-center justify-center gap-1.5 border-2 px-2.5 py-2 font-mono text-[0.68rem] tracking-wide uppercase transition-all duration-200 active:scale-95'

  return (
    <div className="mt-3">
      <div role="group" aria-label={`Feedback on ${name} (preview)`} className="flex gap-2">
        <button
          type="button"
          aria-pressed={choice === 'up'}
          onClick={() => toggle('up')}
          className={cn(
            base,
            choice === 'up'
              ? 'border-vermilion bg-vermilion text-paper-hi -rotate-2'
              : 'border-ink/40 text-ink hover:border-vermilion hover:text-vermilion',
          )}
        >
          <ThumbsUp className="size-3.5" aria-hidden="true" />
          Recommend
        </button>
        <button
          type="button"
          aria-pressed={choice === 'down'}
          onClick={() => toggle('down')}
          className={cn(
            base,
            choice === 'down'
              ? 'border-ink bg-ink text-paper-hi rotate-2'
              : 'border-ink/40 text-ink hover:border-ink hover:bg-ink/5',
          )}
        >
          <ThumbsDown className="size-3.5" aria-hidden="true" />
          Not for me
        </button>
      </div>
      <p className="mt-1.5 font-mono text-[0.58rem] tracking-wide text-ink/50" aria-live="polite">
        {choice === 'up' ? 'Stamped “recommend” — preview only.' : choice === 'down' ? 'Stamped “not for me” — preview only.' : 'Preview — tap a stamp. Nothing is saved.'}
      </p>
    </div>
  )
}
