export type ThemeMode = 'light' | 'dark'
export type AccentPreset = 'green' | 'emerald' | 'forest' | 'teal'

export type AppearanceConfig = {
  themeMode: ThemeMode
  accentPreset: AccentPreset
  customPrimary?: string
}

export const DEFAULT_APPEARANCE: AppearanceConfig = {
  themeMode: 'light',
  accentPreset: 'green',
}

export type BrandPalette = {
  brand: string
  brandForeground: string
  brandMuted: string
  brandSubtle: string
  brandRing: string
  sidebar: string
  sidebarForeground: string
  sidebarAccent: string
  sidebarBorder: string
}

export const ACCENT_PRESETS: Record<AccentPreset, { label: string; base: string }> = {
  green: {
    label: 'Verde',
    base: '#166534',
  },
  emerald: {
    label: 'Esmeralda',
    base: '#047857',
  },
  forest: {
    label: 'Bosque',
    base: '#14532d',
  },
  teal: {
    label: 'Teal',
    base: '#0f766e',
  },
}

/** Fallback map for legacy preset values stored in DB */
const LEGACY_PRESET_MAP: Record<string, AccentPreset> = {
  orange: 'green',
  blue: 'teal',
  red: 'forest',
}

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const match = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim())
  if (!match) return null
  return {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16),
  }
}

const relativeLuminance = (r: number, g: number, b: number): number => {
  const toLinear = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

const isDark = (hex: string): boolean => {
  const rgb = hexToRgb(hex)
  if (!rgb) return false
  return relativeLuminance(rgb.r, rgb.g, rgb.b) < 0.35
}

/**
 * Derives the full brand palette from a single base hex color.
 * Generates light muted/subtle tints and a dark sidebar variant.
 */
export const deriveBrandPalette = (baseHex: string, mode: ThemeMode): BrandPalette => {
  const rgb = hexToRgb(baseHex)
  if (!rgb) {
    return deriveBrandPalette('#166534', mode)
  }
  const { r, g, b } = rgb

  // Light tints by blending with white
  const tint = (factor: number) => {
    const tr = Math.round(r + (255 - r) * factor)
    const tg = Math.round(g + (255 - g) * factor)
    const tb = Math.round(b + (255 - b) * factor)
    return `#${tr.toString(16).padStart(2, '0')}${tg.toString(16).padStart(2, '0')}${tb.toString(16).padStart(2, '0')}`
  }

  // Dark shade for sidebar by blending with black
  const shade = (factor: number) => {
    const sr = Math.round(r * (1 - factor))
    const sg = Math.round(g * (1 - factor))
    const sb = Math.round(b * (1 - factor))
    return `#${sr.toString(16).padStart(2, '0')}${sg.toString(16).padStart(2, '0')}${sb.toString(16).padStart(2, '0')}`
  }

  if (mode === 'dark') {
    // In dark mode: brand becomes a light tint of the base for contrast
    const darkBrand = tint(0.5)
    return {
      brand: darkBrand,
      brandForeground: shade(0.9),
      brandMuted: shade(0.65),
      brandSubtle: shade(0.8),
      brandRing: `rgba(${Math.round(r + (255 - r) * 0.5)}, ${Math.round(g + (255 - g) * 0.5)}, ${Math.round(b + (255 - b) * 0.5)}, 0.25)`,
      sidebar: shade(0.9),
      sidebarForeground: tint(0.9),
      sidebarAccent: `rgba(${Math.round(r + (255 - r) * 0.5)}, ${Math.round(g + (255 - g) * 0.5)}, ${Math.round(b + (255 - b) * 0.5)}, 0.15)`,
      sidebarBorder: 'rgba(255, 255, 255, 0.06)',
    }
  }

  return {
    brand: baseHex,
    brandForeground: isDark(baseHex) ? '#ffffff' : '#052e16',
    brandMuted: tint(0.82),
    brandSubtle: tint(0.92),
    brandRing: `rgba(${r}, ${g}, ${b}, 0.2)`,
    sidebar: shade(0.72),
    sidebarForeground: tint(0.9),
    sidebarAccent: `rgba(${r}, ${g}, ${b}, 0.2)`,
    sidebarBorder: 'rgba(255, 255, 255, 0.08)',
  }
}

export const parseAppearanceConfig = (
  raw: unknown,
  colorPrimario?: string | null
): AppearanceConfig => {
  const base = { ...DEFAULT_APPEARANCE }
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>
    if (o.themeMode === 'light' || o.themeMode === 'dark') {
      base.themeMode = o.themeMode
    }
    const preset = o.accentPreset as string | undefined
    if (preset) {
      if (preset in ACCENT_PRESETS) {
        base.accentPreset = preset as AccentPreset
      } else if (preset in LEGACY_PRESET_MAP) {
        base.accentPreset = LEGACY_PRESET_MAP[preset]
      }
    }
    if (typeof o.customPrimary === 'string' && o.customPrimary.startsWith('#')) {
      base.customPrimary = o.customPrimary
    }
  }
  if (colorPrimario && !base.customPrimary) {
    base.customPrimary = colorPrimario
  }
  return base
}

export const applyAppearanceToDocument = (config: AppearanceConfig) => {
  const root = document.documentElement
  const preset = ACCENT_PRESETS[config.accentPreset]
  const baseHex = config.customPrimary ?? preset.base
  const palette = deriveBrandPalette(baseHex, config.themeMode)

  if (config.themeMode === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }

  root.style.setProperty('--brand', palette.brand)
  root.style.setProperty('--brand-foreground', palette.brandForeground)
  root.style.setProperty('--brand-muted', palette.brandMuted)
  root.style.setProperty('--brand-subtle', palette.brandSubtle)
  root.style.setProperty('--brand-ring', palette.brandRing)
  root.style.setProperty('--primary', palette.brand)
  root.style.setProperty('--primary-foreground', palette.brandForeground)
  root.style.setProperty('--sidebar', palette.sidebar)
  root.style.setProperty('--sidebar-foreground', palette.sidebarForeground)
  root.style.setProperty('--sidebar-primary', palette.brand)
  root.style.setProperty('--sidebar-primary-foreground', palette.brandForeground)
  root.style.setProperty('--sidebar-accent', palette.sidebarAccent)
  root.style.setProperty('--sidebar-border', palette.sidebarBorder)
}

/** Returns the current brand color from CSS custom properties (for use in JS/charts) */
export const getBrandColor = (): string => {
  if (typeof document === 'undefined') return '#166534'
  return getComputedStyle(document.documentElement).getPropertyValue('--brand').trim() || '#166534'
}
