# TODO

Items are worked on in order within each section. Add new items anywhere — they'll be reformatted at the start of each session.

---

## Bugs

- [x] **Plant detail page broken** — was returning `{"detail":"Not Found"}` because the `/plants/{id}` route and `plant_detail.html` didn't exist yet. Both created this session.

---

## Map (`/gardener`)

- [ ] **Plant card action buttons** — when a plant is selected in the side panel, show action buttons: add/update sprite, log action, log observation, update location
- [ ] **Pending tasks on plant card** — show any pending tasks linked to that plant, each with a Done button
- [ ] **Plant search with autosuggest** — search bar in the Plants tab that searches by name, latin name, or code; suggestions appear as you type; clicking a result highlights the plant on the map and opens its card

---

## Plants (`/plants`)

- [ ] **Single-column layout** — switch from 2-column grid to 1-column list
- [ ] **Card layout rework**:
  - Line 1: plant code + common name (same line)
  - Line 2: tile coordinate · zone (zone background colour) · container/pot — each with distinct formatting
- [ ] **Header alignment** — Add plant button same height as search bar; search bar wider to use available space

---

## Sprites

- [ ] **Sprite upload flow** — when using the "add sprite" button, the file should be automatically named `{code}.svg` and stored in `/backend/static/sprites/`; it will load automatically with no DB update needed
- [x] **Verify existing sprite** — sprites load automatically by matching `{code}.svg` filename; z-ordering and HP bar position also fixed

---

## Tasks (`/tasks`)

- [ ] **Dismiss button** — add a way to dismiss a task without marking it done
- [ ] **Richer "mark done" flow** — when completing a task, user chooses between:
  - *Task complete* (current behaviour)
  - *Monitor outcome* — user adds a note (expected result, remedial action if not met, observation date); a follow-up task is automatically created with that note as description
