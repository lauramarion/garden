# garden_project — UI Implementation Instructions
> This document is the handoff from the design/planning session to implementation.
> Read `design_system.md` in full before starting. It is the single source of truth for all visual decisions.
> Work through tasks in the order listed. Each section depends on the previous.

---

## Context

- **Stack**: FastAPI backend + plain HTML/CSS/vanilla JS frontend (no React)
- **DB**: PostgreSQL 16, tables already migrated (zones, plants, journal_entries, tasks, plant_status_history + 5 gamification tables)
- **Existing**: `garden_map.html` is the current prototype — it has the garden SVG map and a side panel. It uses old fonts, old colours, old layout. It will be rebuilt.
- **Live at**: https://garden.lauramarion.eu
- **Repo**: github.com/lauramarion/garden

---

## 0 — Before anything else

### 0.1 Read the design system
Read `design_system.md` completely. Pay special attention to:
- CSS variables (section 12) — use these everywhere, no hardcoded hex values in templates
- Silkscreen rules — always `font-weight: 700` + `text-transform: uppercase`, no exceptions
- Colour roles — aqua = primary action, lavender = secondary, violet = accent, green = healthy, pink = danger/alert, yellow = caution
- Icon rules — no emoji anywhere in UI, always `image-rendering: pixelated`

### 0.2 Set up the icon folder
Place all 15 pixel SVG icons in `static/icons/`:
`plant.svg`, `sprout.svg`, `sun.svg`, `skull.svg`, `task.svg`, `bloom.svg`, `calendar.svg`, `dormant.svg`, `undefined.svg`, `zone.svg`, `add.svg`, `alert.svg`, `map.svg`, `water.svg`, `done.svg`

### 0.3 Set up fonts
Load via Google Fonts in the base template:
```html
<link href="https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
```

### 0.4 Define slot mapping in backend
In a constants file (e.g. `app/constants.py`):
```python
GRID_SLOTS = {
    1: 'centre',
    2: 'back',    # towards back fence
    3: 'front',   # towards house / patio
    4: 'left',    # towards left border
    5: 'right',   # towards right border
}
```
Import this wherever grid slots are used. Never hardcode slot numbers directly.

---

## 1 — Shared shell

Build the base HTML template that all pages extend.

### 1.1 CSS variables
Add all variables from `design_system.md` section 12 to a global `style.css`. Background, surfaces, colours, radius, fonts.

### 1.2 Desktop navigation (≥768px)
Sticky top nav bar with:
- Logo: "MY GARDEN" in Silkscreen Bold 13px, deep aqua colour
- Nav items: MAP · PLANTS · JOURNAL · TASKS · DASHBOARD — Silkscreen Bold 9px uppercase, muted colour, active item gets deep aqua text + 2px aqua bottom border
- Right slot: current season badge (aqua pill, Silkscreen Bold 9px) + settings icon button (lavender bg)

### 1.3 Mobile navigation (<768px)
Fixed bottom tab bar:
- 5 tabs: Map, Plants, Journal, Tasks, Dashboard
- Each tab: pixel icon (24px, `image-rendering: pixelated`) + Silkscreen Bold 7px label
- Active tab: lavender background, violet label
- Inactive: muted text

### 1.4 Page layout
- Desktop: full width, content fills remaining height below nav
- Mobile: single column, content above bottom tab bar (add `padding-bottom` to avoid overlap)
- One breakpoint at 768px only

---

## 2 — Map screen (`/`)

The garden map is the home screen. Rebuild from scratch using the design system.

### 2.1 Layout
- Desktop: map canvas left (flex: 1), side panel right (fixed 440px width)
- Mobile: map on top, panel below (stacked, panel scrollable)
- Map background: Seafoam (`#eaf8f6`)

### 2.2 Side panel tabs
Three tabs: PLANTS · ZONES · INFO
- Tab bar: Silkscreen Bold 9px, lavender background, aqua underline on active
- PLANTS is the default open tab
- Each tab has a scrollable body
- Zone colour legend lives as a small collapsible overlay on the map canvas itself (bottom-left corner), not in the panel

### 2.3 Plants tab content (side panel)
Scrollable list of plant cards, one per plant on the map. Each card:
- 32×32 sprite slot (lavender bg, `image-rendering: pixelated`) — show plant sprite PNG if available, else `plant.svg` icon
- Plant name (Inter 500 14px) + species (Inter italic 11px muted)
- Vitality badge (coloured dot + Silkscreen label)
- Zone tag (lavender pill)
- Clicking a card highlights that plant on the map and opens the plant detail panel

### 2.4 Zones tab content (side panel)
- Zone cards with name, light conditions, wind, notes
- Same zcard style as current prototype, restyled to design system

### 2.5 Info tab content (side panel)
- Garden dimensions, orientation, compass note
- General notes about the garden

### 2.6 Plant markers on the map
Replace current emoji markers with:
- Sprite PNG (64×64) displayed on the correct tile at the correct slot position, `image-rendering: pixelated`
- If no sprite: show `plant.svg` icon at 24px on a lavender tile
- Slot positions within a tile (use `GRID_SLOTS` mapping):
  - centre = tile centre
  - back = top third of tile
  - front = bottom third of tile
  - left = left third of tile
  - right = right third of tile
- Clicking a plant marker opens the plant detail panel (slide in from right on desktop, bottom sheet on mobile)

### 2.7 Vitality overlay
Each plant marker shows a small vitality indicator:
- A 4px coloured dot in the corner of the sprite (green/yellow/pink/muted based on vitality state)
- If vitality = lost: show `skull.svg` icon instead of sprite

### 2.8 Disturbance indicators
Plants with active disturbances show a small `alert.svg` icon (16px) overlaid on the sprite corner opposite the vitality dot.

### 2.9 Add plant
- "+" button (using `add.svg` icon) in the bottom-right corner of the map canvas
- Clicking an empty tile slot on the map also triggers the add plant flow
- Add plant flow: opens a form panel/modal (see section 5.3)

---

## 3 — Plants screen (`/plants`)

Full plant inventory. Desktop: list view with filters sidebar. Mobile: single column with filter drawer.

### 3.1 Header
- Title: "PLANTS" (Silkscreen Bold 13px)
- Count badge: "27 WARDS" (aqua pill)
- Add button: `add.svg` + "ADD PLANT" (primary aqua button)

### 3.2 Filters (desktop: left sidebar 200px / mobile: collapsible drawer)
- Filter by vitality: All · Thriving · Stable · Struggling · Dormant · Lost
- Filter by zone: All + list of zones from DB
- Filter by type: All · Ground · Pot
- Search: text input, searches name + species
- Sort: Name A–Z · Last observed · Vitality · Zone

### 3.3 Plant cards (grid: 2 col desktop, 1 col mobile)
Each card:
- 48×48 sprite slot (lavender bg) with sprite PNG or `plant.svg` placeholder
- Plant name (Silkscreen Bold 11px uppercase) + species (Inter italic 11px)
- Vitality badge with coloured dot
- Zone tag + type tag
- Vitality bar (4px, colour-coded)
- If disturbance active: hot pink left accent stripe on card + `alert.svg` 16px
- Clicking card → navigates to plant detail

### 3.4 Empty state
If no plants match filters: show `undefined.svg` icon + "No plants found" message (Silkscreen), clear filters button.

---

## 4 — Plant detail screen (`/plants/<id>`)

Full detail view for a single plant. Desktop: full page. Mobile: full page with back button.

### 4.1 Header
- Back button (ghost, "← PLANTS")
- Plant name (Silkscreen Bold 13px) + species (Inter italic 13px)
- Plant ID badge (e.g. "P23", lavender pill)

### 4.2 Hero section
- 64×64 sprite (lavender slot, pixelated) — or `undefined.svg` if no sprite
- Vitality bar (full width, 6px, colour-coded)
- Vitality badge (large)
- "UPDATE SPRITE" button (ghost, triggers file upload)
- "MARK AS LOST" button (danger outline, only if not already lost)

### 4.3 Details grid (2-col)
Key/value pairs using the card stat style:
- Zone
- Location (tile + slot, e.g. "C4 · Back")
- Type (Ground / Pot)
- Date added
- Last observed
- Source / origin (where purchased)

### 4.4 Update location
Below the details grid:
- "UPDATE LOCATION" button (secondary lavender)
- Opens a two-step inline selector:
  1. Tile picker: searchable dropdown of all tile coordinates (e.g. A1, B3, C12…)
  2. Slot picker: 3×3 cross layout of 5 buttons (Back / Left / Centre / Right / Front), aqua fill on selected
- Confirm button saves to DB via PATCH `/api/plants/<id>`

### 4.5 Update sprite
- File input (hidden), triggered by "UPDATE SPRITE" button
- Accepts PNG only
- Preview shown at 64×64 with `image-rendering: pixelated` before confirming
- On confirm: uploads to server, associates with plant record, updates display
- Show `undefined.svg` as placeholder until a sprite is uploaded

### 4.6 Active disturbances
If any:
- Hot pink accent card per disturbance
- Disturbance name + description + date flagged
- "RESOLVE" button (marks disturbance as resolved)

### 4.7 Journal entries (for this plant)
- Chronological list, most recent first
- Each entry: date + type badge + notes text
- "ADD ENTRY" button → opens journal entry form pre-filled with this plant

### 4.8 Pending tasks
- List of open tasks linked to this plant
- Each task: task description + due date (if any) + "DONE" button (uses `done.svg` icon)
- Completing a task auto-logs a journal entry

### 4.9 Edit / delete
- "EDIT" button (ghost) — opens inline edit form for name, species, zone, type, notes
- "DELETE" button (danger) — with confirmation dialog, soft-deletes plant

---

## 5 — Add plant flow (shared modal/panel)

Triggered from: map empty tile click, map "+" button, plants list "ADD PLANT" button.

### 5.1 Step 1 — Basic info
- Plant name (required)
- Species / Latin name (optional)
- Source / origin (optional, e.g. "Brico 12.04.2026")
- Date added (default: today)

### 5.2 Step 2 — Location
- Tile picker: searchable dropdown of tile coordinates
- Slot picker: 3×3 cross layout (Back / Left / Centre / Right / Front)
- Type: Ground / Pot (toggle)

### 5.3 Step 3 — Vitality
- Initial vitality state: Thriving / Stable / Struggling / Dormant (default: Stable)
- Optional notes

### 5.4 Step 4 — Sprite (optional, skippable)
- Upload PNG sprite
- Preview at 64×64 pixelated
- Can skip — plant gets `undefined.svg` placeholder

### 5.5 Submit
- Creates plant record in DB
- Logs a "purchase / arrival" journal entry automatically
- Returns to previous screen with new plant highlighted

---

## 6 — Journal screen (`/journal`)

### 6.1 Layout
- Chronological list, most recent first
- Grouped by season (e.g. "SPRING 2026" section header in Silkscreen)

### 6.2 Entry card
- Date (Silkscreen Bold 9px, muted)
- Type badge (action / observation / purchase / event / decision — each a different colour pill)
- Plant tag + zone tag (lavender pills, clickable → filters to that plant/zone)
- Notes text (Inter 13px)
- Edit / delete (ghost icon buttons)

### 6.3 Filters
- By plant (searchable dropdown)
- By zone (dropdown)
- By type (multi-select pills)
- By date range

### 6.4 New entry form
- Date (default today)
- Type (action / observation / purchase / event / decision)
- Plant (searchable dropdown, optional)
- Zone (dropdown, optional)
- Notes (textarea)
- Submit → POST `/api/journal`

---

## 7 — Tasks screen (`/tasks`)

### 7.1 Sections
Three sections stacked vertically:
1. **OVERDUE** — hot pink accent stripe, tasks past their due date
2. **THIS WEEK** — yellow accent stripe, tasks due within 7 days
3. **UPCOMING** — aqua accent stripe, tasks further out or undated

### 7.2 Task row
- `task.svg` icon (16px) or `alert.svg` if disturbance-linked
- Task description (Inter 13px)
- Plant tag + zone tag (if linked)
- Due date (if any)
- "DONE" button: uses `done.svg` icon, marks complete, auto-logs journal entry

### 7.3 Add task
- "ADD TASK" button (primary aqua)
- Form: description, linked plant (optional), linked zone (optional), due date (optional)

### 7.4 Completed archive
- Collapsible section at bottom: "COMPLETED (23)"
- Shows completed tasks with strikethrough, date completed, done icon

---

## 8 — Dashboard screen (`/dashboard`)

Defer detailed implementation until dbt models are ready. For now, build the layout and wire up what's available from the DB directly.

### 8.1 Stat cards row (4 cards)
- Total plants
- Thriving count (green number)
- Active disturbances (pink number)
- Pending tasks (yellow number)

### 8.2 XP bar
- Silkscreen label: "LEVEL 1 — SEEDLING"
- Chunky pixel-style progress bar (aqua fill on lavender track, 8px height)
- XP value below: "240 / 500 XP" (Inter 11px muted)

### 8.3 Garden Vitality Score
Three mini bars, one per pillar:
- Vitality (50% weight) — green
- Stewardship (25%) — aqua
- Harmony (25%) — lavender/violet
- Overall score large number (Silkscreen Bold 24px)

### 8.4 Active disturbances summary
- List of active disturbances with plant name, zone, severity
- Link to plant detail

### 8.5 Recent journal entries
- Last 5 entries, same card style as journal screen
- "VIEW ALL" link → journal screen

### 8.6 Charts (placeholder for now, wire up when dbt ready)
- Plants by vitality state (bar or donut)
- Vitality over time (line chart)
- Plants by zone (bar)

---

## 9 — API endpoints needed

Confirm these exist or create them:

| Method | Path | Description |
|---|---|---|
| GET | `/api/plants` | All plants, supports `?zone=`, `?vitality=`, `?search=` |
| GET | `/api/plants/<id>` | Single plant detail |
| POST | `/api/plants` | Create plant |
| PATCH | `/api/plants/<id>` | Update plant (vitality, location, name, etc.) |
| DELETE | `/api/plants/<id>` | Soft-delete plant |
| POST | `/api/plants/<id>/sprite` | Upload sprite PNG |
| GET | `/api/zones` | All zones |
| GET | `/api/journal` | All entries, supports filters |
| POST | `/api/journal` | Create entry |
| PATCH | `/api/journal/<id>` | Edit entry |
| DELETE | `/api/journal/<id>` | Delete entry |
| GET | `/api/tasks` | All tasks, supports `?status=`, `?plant=` |
| POST | `/api/tasks` | Create task |
| PATCH | `/api/tasks/<id>` | Update task (mark done etc.) |
| GET | `/api/dashboard` | Summary stats for dashboard |
| GET | `/api/tiles` | All valid tile coordinates from grid |

---

## 10 — Implementation notes

- **No React** — plain HTML/CSS/vanilla JS only. Use `fetch()` for API calls.
- **No emoji** anywhere in the UI. Use pixel SVG icons from `static/icons/`.
- **Silkscreen always bold + uppercase** — apply `font-weight: 700; text-transform: uppercase` globally to any element using Silkscreen.
- **image-rendering: pixelated** on all sprites and icons, always.
- **Vitality states**: thriving / stable / struggling / lost / dormant — these are the only valid values. Map to colours per design system.
- **Grid slots**: always use the `GRID_SLOTS` constant from `app/constants.py`. Never hardcode slot numbers.
- **Sprite storage**: store uploaded PNGs in `static/sprites/<plant_id>.png`. Serve at that path. Fall back to `static/icons/undefined.svg` if no sprite exists.
- **CSS variables only**: never hardcode hex values in templates. Always use `var(--aqua)`, `var(--bg)` etc.
- **Docker rule**: never create or edit files inside Docker containers — always work locally and let volume mounts sync.
- **Alembic**: runs locally against `localhost:5432` for local dev.
- **Python venv**: activate with `source .venv/Scripts/activate` (Git Bash on Windows).
