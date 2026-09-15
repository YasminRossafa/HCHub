/**
 * Adaptive layout for the Dashboard's category-card grid. A category with a
 * goal of 0 is hidden (see getActiveCategories), so the visible count varies
 * from 1 to 5 — a plain "2 or 3 per row" responsive grid leaves an
 * awkward orphan card on several of those counts (e.g. 2-then-1, or
 * 3-then-1). This instead picks a layout for the *exact* count so the grid
 * always reads as a complete rectangle.
 *
 * Only applies at the `md` breakpoint and up — below that every count still
 * stacks as a single column, unchanged.
 *
 * Tailwind's build only includes classes it can find written out literally
 * in source, so every combination below is a complete class name rather
 * than one assembled from interpolated fragments (`md:grid-cols-${n}` would
 * silently fail to generate the CSS for any `n` Tailwind didn't see spelled
 * out somewhere in the codebase).
 */
export function getCategoryGridClassName(count) {
  switch (count) {
    case 1:
      return 'grid-cols-1'
    case 2:
      return 'grid-cols-1 md:grid-cols-2'
    case 4:
      return 'grid-cols-1 md:grid-cols-2'
    case 5:
      // 6-column grid: 3 cards spanning 2 columns each (row 1), 2 cards
      // spanning 3 columns each (row 2) — both rows total 6, so they align
      // to the same width instead of the second row looking under-filled.
      return 'grid-cols-1 md:grid-cols-6'
    case 3:
    default:
      return 'grid-cols-1 md:grid-cols-3'
  }
}

/** Column span for the card at `index` — only the 5-category layout needs one; every other count returns ''. */
export function getCategoryCardSpanClassName(count, index) {
  if (count !== 5) return ''
  return index < 3 ? 'md:col-span-2' : 'md:col-span-3'
}
