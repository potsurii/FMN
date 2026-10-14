'use client'

import { useState } from 'react'

export function EditableDates() {
  const [start, setStart] = useState('2026.03.14')
  const [end, setEnd] = useState('2026.03.21')

  const field =
    'w-[6.4rem] border-b border-dashed border-vermilion bg-transparent px-0.5 text-center font-mono text-[0.78rem] text-ink outline-none placeholder:text-ink/40 focus:border-solid focus:bg-vermilion/10 sm:text-[0.82rem]'

  return (
    <div className="flex items-center justify-center gap-1.5">
      <label className="sr-only" htmlFor="trip-start">
        Trip start date
      </label>
      <input
        id="trip-start"
        value={start}
        onChange={(e) => setStart(e.target.value)}
        maxLength={10}
        inputMode="numeric"
        autoComplete="off"
        className={field}
      />
      <span aria-hidden="true" className="font-mono text-ink/50">
        —
      </span>
      <label className="sr-only" htmlFor="trip-end">
        Trip end date
      </label>
      <input
        id="trip-end"
        value={end}
        onChange={(e) => setEnd(e.target.value)}
        maxLength={10}
        inputMode="numeric"
        autoComplete="off"
        className={field}
      />
    </div>
  )
}
