# TODO

Items are worked on in order within each section. Add new items anywhere — they'll be reformatted at the start of each session.

---

## Bugs

- [x] **Plant detail page broken** — was returning `{"detail":"Not Found"}` because the `/plants/{id}` route and `plant_detail.html` didn't exist yet. Both created this session.
- [x] **Sprite not reflected on plant detail page** — applied same `{code}.svg` fallback as map.js to plant_detail.js, gardener.js, and plants.js; onerror swaps to placeholder if file doesn't exist

---

## Map (`/gardener`)

- [x] **Plant card action buttons** — add/update sprite (file upload → `{code}.svg`), log action, log obs (pre-fill Log tab), update location (inline col/row/slot form)
- [x] **Pending tasks on plant card** — fetches tasks on card open, shows pending ones with Done button that calls complete endpoint and removes the row
- [x] **Plant search with autosuggest** — search input filters the plant list live by code, name, or latin name; hides when viewing a card, restores on back

---

## Plants (`/plants`)

- [x] **Single-column layout** — switched to `grid-template-columns: 1fr`
- [x] **Card layout rework** — line 1: code + name + badge; line 2: coord · zone (colored bg from ZONE_STYLE map) · container with `·` separators
- [x] **Header alignment** — search bar `flex: 1`, button padding matched to input height
- [x] **Larger sprite on plant detail page** — `.detail-sprite` is now `width: 25%`, img scales to fill

---

## Sprites

- [x] **Sprite upload flow** — file upload via gardener action button auto-names `{code}.svg` and stores in `/backend/static/sprites/`; no DB update needed
- [x] **Verify existing sprite** — sprites load automatically by matching `{code}.svg` filename; z-ordering and HP bar position also fixed

---

## Tasks (`/tasks`)

- [x] **Dismiss button** — Dismiss button sets status to `dismissed`; dismissed tasks hidden from all lists
- [x] **Richer "mark done" flow** — Done opens a modal: "Task complete" completes immediately; "Monitor outcome" collects a note + observation date, creates a follow-up task with same plant/zone, then marks original done
