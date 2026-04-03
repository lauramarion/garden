# garden_project — Design System
> Reference document. All decisions here are locked in and must be applied consistently across every screen and component.

---

## 01 — Palette

| Name | Hex | Role |
|---|---|---|
| Seafoam | `#eaf8f6` | Page background |
| Mint | `#d0f0ec` | Inset surfaces, stat cards |
| Aqua | `#30c8b0` | Primary action, focus ring, active nav |
| Deep aqua | `#1a9e8a` | Hover state for aqua, text on light bg |
| Lavender | `#e8e0f8` | Secondary button fill, badges, sprite slots |
| Violet | `#3828a8` | Accent, links, active badge text |
| Neon green | `#58e890` | Healthy / thriving state |
| Hot pink | `#e840a0` | Alert / danger / lost state |
| Electric yellow | `#f0d030` | Caution / warning / struggling state |
| Void | `#080818` | Body text, headings |
| White | `#ffffff` | Card / surface background |

### Colour roles
- **Page background** → Seafoam
- **Card / surface** → White
- **Inset / stat bg** → Mint
- **Primary action** → Aqua
- **Secondary action** → Lavender
- **Accent / links** → Violet
- **Healthy** → Neon green
- **Alert / danger** → Hot pink
- **Caution** → Electric yellow
- **Body text** → Void

Colour carries meaning. Never use accent colours decoratively. If a colour appears somewhere new, its semantic meaning must be consistent with this table.

---

## 02 — Typography

Two fonts only. No others.

### Silkscreen — display / UI chrome
- **Always** `font-weight: 700` and `text-transform: uppercase`
- Never used in sentence case. Never regular weight.
- Used for: logo, section headings, nav labels, button labels, badge text, stat numbers, input labels

| Usage | Size |
|---|---|
| Logo / app name | 13px |
| Section headings | 11px |
| Card titles | 11px |
| Nav items, labels | 9px |
| Badge text | 9px |
| Stat numbers | 16px |
| Small labels | 8px |

```css
font-family: 'Silkscreen', monospace;
font-weight: 700;
text-transform: uppercase;
```

### Inter — body / data
- Used for: body copy, secondary text, input values, hints, descriptions

| Usage | Size | Weight |
|---|---|---|
| Card titles (plant name) | 14px | 500 |
| Body text | 13px | 400 |
| Secondary / metadata | 11px | 400 |
| Hints / captions | 11px | 400 |

```css
font-family: 'Inter', sans-serif;
```

---

## 03 — Spacing Scale

Use multiples of 4px for all spacing.

| Token | Value | Usage |
|---|---|---|
| xs | 4px | Icon gaps, tight padding |
| sm | 8px | Component internal gaps |
| md | 12px | Card internal padding |
| lg | 16px | Section padding |
| xl | 24px | Between sections |
| 2xl | 32px | Major section breaks |
| 3xl | 48px | Page-level margins |

---

## 04 — Border & Radius

| Type | Value |
|---|---|
| Default border | `0.5px solid rgba(48,200,176,0.2)` |
| Interactive border | `1.5px solid rgba(48,200,176,0.4)` |
| Strong border | `2px solid #30c8b0` |
| Accent stripe | `3px solid [colour]` (left side only) |
| Radius small | 4px |
| Radius default | 8px |
| Radius card | 12px |
| Radius pill | 20px (badges only) |

No rounded corners on single-sided borders (`border-left` accent stripes use `border-radius: 0`).

---

## 05 — Buttons

All button labels: **Silkscreen Bold, uppercase**. All buttons use `!important` on colour properties to prevent host stylesheet override.

| Variant | Background | Text | Border | Use for |
|---|---|---|---|---|
| Primary | `#30c8b0` (Aqua) | `#001a16` | none | Main CTA — one per view |
| Secondary | `#e8e0f8` (Lavender) | `#3828a8` (Violet) | none | Supporting actions |
| Outline | transparent | `#1a9e8a` (Deep aqua) | 2px Aqua | Alternative / filter actions |
| Ghost | transparent | `#2a8878` | 0.5px muted | Low-priority, cancel |
| Danger | `#e840a0` (Hot pink) | `#ffffff` | none | Destructive — irreversible actions |
| Danger outline | transparent | `#e840a0` | 2px Hot pink | Softer destructive |

### Sizes

| Size | Padding | Font size |
|---|---|---|
| Small | 5px 10px | 9px |
| Default | 9px 16px | 10px |
| Large | 13px 24px | 11px |

### Rules
- Disabled state: `opacity: 0.35`, `cursor: not-allowed`. Never remove from DOM.
- Full-width on mobile: stack vertically, primary above secondary.
- Never two primaries side by side.
- Button groups: outer buttons get the group's radius, inner buttons `border-radius: 0`.

---

## 06 — Inputs

```css
/* Base input */
font-family: 'Inter', sans-serif;
font-size: 13px;
background: #ffffff;
border: 1.5px solid rgba(48,200,176,0.4);
border-radius: 8px;
padding: 8px 12px;

/* Focus */
border-color: #30c8b0;
box-shadow: 0 0 0 3px rgba(48,200,176,0.18);

/* Error */
border-color: #e840a0;
box-shadow: 0 0 0 3px rgba(232,64,160,0.12);
```

### Input labels
Silkscreen Bold 9px uppercase, above the input, not inside it.

### Hints
Inter 400 11px, `#2a8878`, below the input.

### Error messages
Inter 400 11px, `#e840a0`, below the input. Replace hint when error is active.

### Select
Custom chevron: aqua SVG arrow, `background-position: right 12px center`.

### Search + action group
Input with right border removed + button with left radius removed, flush join.

---

## 07 — Cards & Panels

### Base card
```css
background: #ffffff;
border: 0.5px solid rgba(48,200,176,0.2);
border-radius: 12px;
padding: 14px 16px;
```

### Accent stripe variants
Left border only, `border-radius: 0 12px 12px 0`:

| Stripe colour | Use for |
|---|---|
| Hot pink `#e840a0` | Disturbance / alert |
| Neon green `#58e890` | Completed / success |
| Aqua `#30c8b0` | Info / current week |
| Electric yellow `#f0d030` | Caution / struggling |

### Plant card anatomy
1. **Header row**: 36×36px sprite slot (Lavender bg) + name (Silkscreen 11px) + species (Inter italic 11px) + vitality badge
2. **Stat grid**: 2-column, Mint background cells, Silkscreen label + value
3. **Vitality bar**: 4px height, colour-coded fill, Mint track

### Sprite slot
```css
width: 36px;
height: 36px;
background: #e8e0f8; /* Lavender */
border-radius: 8px;
image-rendering: pixelated;
```

### Stat cards (dashboard)
```css
background: #eaf8f6; /* Seafoam / Mint */
border-radius: 8px;
padding: 10px 12px;
/* no border */
```
Stat label: Silkscreen Bold 8px uppercase, muted.
Stat value: Silkscreen Bold 16px. Colour = semantic only (green for healthy, pink for alert, yellow for caution, Void for neutral).

---

## 08 — Status Badges

All badges: Silkscreen Bold 9px · uppercase · `border-radius: 20px` · `padding: 3px 8px`.

### Vitality states (always show coloured dot)

| Badge | Background | Text | Dot |
|---|---|---|---|
| Thriving | `#e8fff2` | `#1a6030` | `#58e890` Neon green |
| Stable | `#e8e0f8` Lavender | `#3828a8` Violet | `#3828a8` |
| Struggling | `#fff4d0` | `#8a5800` | `#f0d030` Yellow |
| Lost | `#ffe8f4` | `#901040` | `#e840a0` Pink |
| Dormant | `#e8e0f8` Lavender | `#5848b0` | `#5848b0` |
| New | `#eaf8f6` Seafoam | `#1a9e8a` | `#30c8b0` Aqua |

### Context tags

| Badge | Background | Text |
|---|---|---|
| Spring | `#30c8b0` Aqua | `#001a16` |
| Summer | `#f0d030` Yellow | `#3a2800` |
| Autumn | `#e84020` | `#ffffff` |
| Winter | `#e8e0f8` Lavender | `#3828a8` |
| Zone | `#e8e0f8` Lavender | `#3828a8`, outlined |
| Duties | `#fffce8` | `#806000` |
| Disturbance | `#ffe8f4` | `#e840a0` |

Maximum 2 badges per card row.

---

## 09 — Navigation

### Desktop (≥768px) — top nav
```css
background: #ffffff;
border-bottom: 0.5px solid rgba(48,200,176,0.4);
position: sticky;
top: 0;
```
- **Logo**: Silkscreen Bold 13px, Deep aqua
- **Nav items**: Silkscreen Bold 9px uppercase, muted colour
- **Active item**: Deep aqua text, `border-bottom: 2px solid #30c8b0`
- **Right slot**: current season badge always visible
- Max 5 items

### Mobile (<768px) — bottom tab bar
```css
background: #ffffff;
border-top: 0.5px solid rgba(48,200,176,0.4);
position: fixed;
bottom: 0;
```
- **Tab**: pixel icon (20×20) + Silkscreen Bold 7px label
- **Active tab**: `background: #e8e0f8` (Lavender), violet text
- Max 5 tabs
- Screens: Map · Plants · Journal · Tasks · Dashboard

---

## 10 — Icons

All icons are bespoke 24×24 pixel SVGs from the `garden_icons/` set.

**No emoji anywhere in the UI. Ever.**

### Canonical display sizes
| Size | Usage |
|---|---|
| 16px | Inline text, tight UI (scaled down from 24) |
| 24px | Nav tab icons (native grid size) |
| 32px | Card sprite slot |
| 48px | Feature / hero |

Always set:
```css
image-rendering: pixelated;
```

When scaling up, use exact 2× or 3× multiples only (32px, 48px from a 16px source). Never odd sizes.

### Undefined icon
`undefined.svg` (hot pink border + X pattern) is the mandatory placeholder whenever a permanent icon has not yet been drawn. Never use emoji as a temporary substitute.

### Tool
Icons are drawn in **PixelForge** (custom tool — lauramarion.github.io/pixelforge) with the Garden Project palette preset loaded.

### Current icon set
`plant` · `sun` · `water` · `alert` · `zone` · `journal` · `season` · `thriving` · `lost` · `seedling` · `bloom` · `dormant` · `task` · `map` · `add` · `undefined`

---

## 11 — Visual Rules

### No shadows or gradients
Depth comes from background layering only:

```
Seafoam (page) → White (card) → Mint (inset) → Lavender (badge/slot)
```

The only exception: `box-shadow: 0 0 0 3px rgba(48,200,176,0.18)` on focused inputs.

### Colour = meaning
Never use accent colours for decoration. If green appears somewhere, it means healthy. If pink appears, it means danger. Consistent across every screen, always.

### Silkscreen = Bold + Uppercase
```css
font-family: 'Silkscreen', monospace;
font-weight: 700;
text-transform: uppercase;
```
Applied globally to any element using Silkscreen. No exceptions.

### One breakpoint
- **≥768px**: top nav, multi-column layouts
- **<768px**: bottom tab bar, single column, full-width stacked buttons

No tablet-specific breakpoint.

### Pixel art rendering
```css
image-rendering: pixelated;
```
On all sprites and icons, always. Canonical sizes: 24px native · scale to 48px (2×) for feature contexts · scale down to 16px for tight inline use.

---

## 12 — CSS Variables (quick reference)

Add these to `:root` in the global stylesheet:

```css
:root {
  /* Backgrounds */
  --bg-page:    #eaf8f6;
  --bg-mint:    #d0f0ec;
  --bg-lav:     #e8e0f8;
  --bg-lav-dk:  #d4c8f0;
  --surface:    #ffffff;

  /* Brand colours */
  --aqua:       #30c8b0;
  --aqua-dk:    #1a9e8a;
  --violet:     #3828a8;
  --green:      #58e890;
  --pink:       #e840a0;
  --yellow:     #f0d030;
  --void:       #080818;

  /* Borders */
  --border:     rgba(48,200,176,0.2);
  --border-md:  rgba(48,200,176,0.4);

  /* Radius */
  --r-sm:  4px;
  --r-md:  8px;
  --r-lg:  12px;
  --r-pill: 20px;

  /* Fonts */
  --font-display: 'Silkscreen', monospace;
  --font-body:    'Inter', sans-serif;
}
```

---

*Last updated: April 2026 — garden_project v1 design system*
