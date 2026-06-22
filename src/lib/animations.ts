/**
 * Shared animation system — cubic-bezier easings + motion variants + spring presets.
 * Import from here instead of defining inline per-component.
 */

// ─── Easings ──────────────────────────────────────────────────────────────────
// All values are [x1, y1, x2, y2] cubic-bezier control points.

export const ease = {
  /** Expo-out: instant start, long soft landing. Best for element entrances. */
  out: [0.16, 1, 0.3, 1] as const,

  /** Quad-out: natural deceleration. Best for hover and quick exits. */
  snappy: [0.25, 0.46, 0.45, 0.94] as const,

  /** Expo in-out: symmetric acceleration/deceleration. Best for modals & drawers. */
  inOut: [0.87, 0, 0.13, 1] as const,

  /** iOS-style "swift" curve. Best for page-level transitions. */
  swift: [0.4, 0.14, 0.3, 1] as const,
} as const

// ─── Spring presets ───────────────────────────────────────────────────────────

export const spring = {
  /** Tight, responsive. For modals, popovers, cards that appear. */
  popup: { type: 'spring' as const, stiffness: 520, damping: 30, mass: 0.85 },

  /** Smooth slide. For sidebars and drawers. */
  drawer: { type: 'spring' as const, stiffness: 380, damping: 34 },

  /** Gentle. For subtle list-item entrances. */
  gentle: { type: 'spring' as const, stiffness: 280, damping: 28 },
} as const

// ─── Transition shorthands ────────────────────────────────────────────────────

export const t = {
  /** 200 ms expo-out — standard entrance */
  enter: { duration: 0.2, ease: ease.out },
  /** 130 ms quad-out — quick exit */
  exit: { duration: 0.13, ease: ease.snappy },
  /** Page-level: 220 ms swift */
  page: { duration: 0.22, ease: ease.swift },
  /** Fast fade: 150 ms */
  fade: { duration: 0.15, ease: ease.snappy },
} as const

// ─── Motion variants ──────────────────────────────────────────────────────────

/** Full-page route transition: gentle scale + opacity */
export const pageVariants = {
  initial: { opacity: 0, scale: 0.992, y: 4 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit:    { opacity: 0, scale: 1.004, y: -4 },
}

/** Fade + slide-up: cards, list items, panels */
export const fadeUpVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -6 },
}

/** Pure fade: overlays, backdrops */
export const fadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
}

/** Scale pop-in: modals, dropdowns, tooltips */
export const scaleInVariants = {
  initial: { opacity: 0, scale: 0.93 },
  animate: { opacity: 1, scale: 1 },
  exit:    { opacity: 0, scale: 0.96 },
}

/** Slide from left: mobile sidebar drawer */
export const slideLeftVariants = {
  initial: { x: '-100%' },
  animate: { x: 0 },
  exit:    { x: '-100%' },
}

/** Stagger container — wrap a list in this to cascade children */
export const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.045 },
  },
}

/** Stagger child (pair with staggerContainer) */
export const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
}
