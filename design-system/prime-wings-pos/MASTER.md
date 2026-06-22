# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Prime Wings POS
**Updated:** 2026-06-21
**Theme:** Modern Green — verde oscuro + verde claro + blanco

---

## Global Rules

### Color Palette

The system uses a single configurable brand color. All surfaces, accents, and sidebar tones derive automatically from it via `deriveBrandPalette()` in `src/lib/appearance.ts`.

| Role | Default Hex | CSS Token | Usage |
|------|-------------|-----------|-------|
| Brand | `#166534` | `--brand` | Buttons, active nav, selections, prices |
| Brand foreground | `#ffffff` | `--brand-foreground` | Text on brand backgrounds |
| Brand muted | `#dcfce7` | `--brand-muted` | Active chips, product cards in cart |
| Brand subtle | `#f0fdf4` | `--brand-subtle` | POS surface, category bar |
| Sidebar bg | `#052e16` | `--sidebar` | Sidebar background (deep green-black) |
| Sidebar text | `#f0fdf4` | `--sidebar-foreground` | Sidebar nav text |
| Success | `#15803d` | `--success` | "Listo para cobrar", positive states |
| Success muted | `#dcfce7` | `--success-muted` | Success chip backgrounds |
| Warning | `#ca8a04` | `--warning` | Low stock, alerts |
| Destructive | `#dc2626` | `--destructive` | Delete, error states |
| Background | `#ffffff` | `--background` | Page background |
| Foreground | `#111827` | `--foreground` | Body text |

**Brand Note:** Verde oscuro con verde claro y blanco — moderno, accesible, legible.

### Typography

- **Font:** Atkinson Hyperlegible (WCAG-friendly, dyslexia-friendly)
- **Mood:** accessible, readable, inclusive, clear
- **Google Fonts:** [Atkinson Hyperlegible](https://fonts.google.com/share?selection.family=Atkinson+Hyperlegible:wght@400;700)

```css
@import url('https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap');
```

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured |

---

## Component Token Usage Conventions

| Role | Class | Example |
|------|-------|---------|
| Primary button | `bg-brand text-brand-foreground` | Completar Venta, Guardar |
| Selected item | `border-brand bg-brand-muted` | Product in cart, active chip |
| POS surface | `bg-brand-subtle` | Cart panel, category bar |
| Price / total | `text-brand` | Total a pagar |
| Sidebar active nav | `bg-sidebar-accent text-brand` | Nav item active |
| Payment ready | `bg-success-muted text-success` | "Listo para cobrar" |
| Error / delete | `text-destructive bg-destructive/10` | Trash button, form errors |
| Avatar / logo | `bg-brand` | Sidebar logo, Header avatar |

---

## Component Specs

### Buttons

Uses `<Button>` component from `src/app/components/ui/button.tsx`.

| Variant | Usage |
|---------|-------|
| `default` | Primary actions — maps to brand color |
| `destructive` | Delete, cancel, dangerous actions |
| `outline` | Secondary actions |
| `secondary` | Tertiary, low-emphasis |
| `ghost` | Icon buttons, inline actions |
| `link` | Text links |

Size `touch` / `touchSm` reserved for POS touch targets (min 44px).

### Cards

```css
.card {
  background: var(--card);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: all 200ms ease;
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: var(--brand);
  outline: none;
  box-shadow: 0 0 0 3px var(--brand-ring);
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: var(--card);
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Available Presets

Presets are configured in `src/lib/appearance.ts` under `ACCENT_PRESETS`.
All presets use the same derivation logic — `deriveBrandPalette(baseHex, mode)`.

| Key | Base Hex | Label |
|-----|----------|-------|
| `green` (default) | `#166534` | Verde |
| `emerald` | `#047857` | Esmeralda |
| `forest` | `#14532d` | Bosque |
| `teal` | `#0f766e` | Teal |

Users can also set a custom hex color in Settings > Apariencia.

---

## Style Guidelines

**Style:** Accessible & Modern Green

**Keywords:** High contrast, large text (16px+), keyboard navigation, screen reader friendly, WCAG compliant, focus state, semantic

**Key Effects:** Clear focus rings (3px using --brand-ring), ARIA labels, responsive design, reduced motion, 44×44px touch targets

---

## Anti-Patterns (Do NOT Use)

- `style={{ background: '#FF5A1F' }}` — use `bg-brand` or `className` with token
- `style={{ background: '#00A859' }}` — eliminated; was pos-primary
- `text-green-*`, `bg-green-*` for brand states — use `text-brand`, `bg-brand-muted`
- `text-orange-*`, `bg-orange-*` for focus/active — use `focus:border-brand`
- `--pos-primary`, `--pos-muted`, `--pos-surface` — removed; use `--brand-*`
- Small text (below 12px for secondary, 16px for body)
- Complex navigation depth
- AI purple/pink gradients
- Emojis as icons — use SVG icons (Heroicons, Lucide)
- Missing `cursor-pointer` on clickable elements
- Low contrast text — maintain 4.5:1 minimum ratio
- Invisible focus states

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No hardcoded hex colors in JSX (`style={{ background: '#...' }}`)
- [ ] No `text-green-*` / `bg-green-*` / `text-orange-*` for brand states — tokens only
- [ ] All icons from Lucide
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
