function seeded(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

type TornOptions = {
  top?: boolean
  bottom?: boolean
  left?: boolean
  right?: boolean
  depth?: number
}

/**
 * Deterministic hand-torn polygon. Seeded so server and client render the same
 * string, and every piece of paper gets a slightly different edge.
 */
export function tornClip(seed: number, { top, bottom, left, right, depth = 6 }: TornOptions = {}) {
  const rand = seeded(seed * 97 + 13)
  const h = 26
  const v = 16
  const pts: string[] = []

  for (let i = 0; i <= h; i++) {
    const y = top ? Math.round(rand() * depth * 10) / 10 : 0
    pts.push(`${((i / h) * 100).toFixed(2)}% ${y}px`)
  }
  for (let j = 1; j <= v; j++) {
    const x = right ? Math.round(rand() * depth * 10) / 10 : 0
    pts.push(`calc(100% - ${x}px) ${((j / v) * 100).toFixed(2)}%`)
  }
  for (let i = h - 1; i >= 0; i--) {
    const y = bottom ? Math.round(rand() * depth * 10) / 10 : 0
    pts.push(`${((i / h) * 100).toFixed(2)}% calc(100% - ${y}px)`)
  }
  for (let j = v - 1; j > 0; j--) {
    const x = left ? Math.round(rand() * depth * 10) / 10 : 0
    pts.push(`${x}px ${((j / v) * 100).toFixed(2)}%`)
  }

  return `polygon(${pts.join(', ')})`
}
