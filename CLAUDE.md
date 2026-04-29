# garden_project — Claude Instructions

## Project overview
Full-stack garden management web app. Sole user: Laura.
- Repo: `github.com/lauramarion/garden`
- Production: `https://garden.lauramarion.eu` (OVH VPS, Ubuntu 22.04)

## Stack
- **Backend:** FastAPI (Python) — `backend/`
- **Frontend:** Plain HTML + CSS + Vanilla JS — `backend/static/`
- **Database:** PostgreSQL 16
- **Migrations:** Alembic — run locally
- **Transformations:** dbt Core — `dbt/`
- **Orchestration:** Dagster — `dagster/`
- **Reverse proxy:** Caddy
- **Containers:** Docker Compose
- **CI/CD:** GitHub Actions

## Folder structure
```
garden/
  backend/
    app/
      main.py
      routers/         ← plants, zones, journal, tasks, dashboard, gardener
      models/
    static/
      public.html      ← public read-only map
      gardener.html    ← map + side panel (Plants / Zones / Log tabs)
      dashboard.html   ← vitality score + HP list + XP bar + recent journal
      tasks.html       ← task buckets (overdue / this week / upcoming)
      journal.html     ← season-grouped entries with filters
      plants.html      ← plant grid with filters + add plant modal
      plant_detail.html← single plant view with journal + tasks
      css/main.css     ← ALL styles (no inline styles, no <style> blocks)
      js/              ← one file per page + topbar.js + map.js
      icons/           ← 15 SVG pixel art icons
      sprites/         ← plant sprites (placeholders for now)
    migrations/        ← Alembic migration files
    seeds/             ← seed_plants.py, seed_reference_data.py
  dbt/
    models/staging/    ← stg_plants, stg_journal_entries, stg_tasks
    models/marts/      ← plant_hp, garden_vitality_score
  dagster/
    garden_pipeline/   ← snapshot + generate_tasks assets, daily schedule
  docker-compose.yml
  Caddyfile.dev / Caddyfile.prod
  design_system.md     ← visual design rules (fonts, colours, spacing)
  .env                 ← never committed
```

## Local development workflow
```bash
docker compose up -d          # start stack
docker compose logs -f        # tail logs
docker compose down           # stop stack
docker compose up -d --build  # rebuild after Dockerfile or requirements change
```
FastAPI hot-reloads on Python file save. Hard-refresh browser for HTML/CSS/JS changes.

## Python workflow (Alembic, dbt, seeds)
All Python tooling runs **locally**, not inside containers.
```bash
cd backend
source .venv/Scripts/activate   # Windows Git Bash
alembic upgrade head             # apply migrations
alembic revision -m "desc"       # create migration
```
Database connection for local tools: `localhost:5432` (not `db`).

## dbt
```bash
cd dbt
dbt run --profiles-dir .         # rebuild all models
```
`profiles.yml` lives in `dbt/` — never committed.

## Dagster
```bash
cd dagster
dagster dev -w workspace.yaml    # UI at localhost:3000
```

## Deploying to VPS
```bash
git push   # triggers GitHub Action automatically
```
If migrations changed, also run on VPS:
```bash
docker compose exec backend alembic upgrade head
```

## Environment variables
```
DB_PASSWORD=...
SECRET_KEY=...
ENVIRONMENT=development  # or production
```

## Database
- Local: `localhost:5432` — In containers: `db:5432`
- Database: `garden` — User: `garden_user`

## Key design decisions
- Frontend: plain HTML/CSS/vanilla JS — no React, no build step
- Map: isometric canvas (no library) — `toScreen(col, row)`, GRID_SLOTS 1-indexed (1=centre, 2=back, 3=front, 4=left, 5=right)
- Grid coordinate system: letters A–J (row axis), numbers 1–19 (col axis). E.g. tile E4 = col 14, row 4. Always use letter-number format, never raw col/row numbers.
- Plant vitality states: `Thriving` (HP 80), `Stable` (65), `New` (60), `Dormant` (50), `Struggling` (35), `Lost` (5)
- HP scores computed in dbt (`dbt_marts.plant_hp`) — never stored raw
- Gamification: RPG style — XP, HP bars, levels (GardenerProfile table, not yet fully wired)
- Sprites: SVG, stored as `/static/sprites/{code}.svg` — auto-detected by filename, no DB update needed. Upload via gardener side panel. `sprite_path` column exists but is optional (fallback uses code).
- No emoji in UI — pixel art SVG icons only (`backend/static/icons/`)
- Zone colors: defined as JS inline styles in `plants.js` (`ZONE_STYLE` map, keyed by `zone.code`) — exception to the no-inline-styles rule since colors are data-driven from the DB

## Frontend rules
- ALL styles in `main.css` — no inline styles, no `<style>` blocks in HTML, ever
- HTML = structure only, JS = behaviour only
- `topbar.js` injects the shared header into every page via `<header id="topbar"></header>`

## Git workflow
- `main` branch = production
- Feature branches, merge via PR
- Commit messages: `feat:`, `fix:`, `chore:`, `docs:`

## VPS rules
The VPS never originates code. Only receives via GitHub.
**Never run `git add`, `git commit`, or edit files on the VPS.**

## Environment clarity rules
- Label every terminal block with 📍 LOCAL or 📍 VPS
- Never mix local and VPS steps in the same block
- All local work (code + commit + push) before any VPS steps

## What NOT to do
- Never create/edit files inside a container
- Never commit `.env` or hardcode secrets
- Never install packages globally — always use the venv
- Never write inline styles or `<style>` blocks in HTML files

## PROJECT_OVERVIEW.md
Plain-language explanation of every component for Laura's reference.
**Keep it updated** whenever a component is added or changes significantly.

## Current state (April 2026)
- 51 plants seeded with real data, all on the isometric map
- 7 frontend pages fully built with shared topbar + mobile tab bar
- dbt computes plant HP and garden vitality score daily
- Dagster runs daily pipeline: status snapshot + auto-generate tasks
- GitHub Actions deploys to VPS on push to main
- `plant_status_history` written by Dagster daily snapshot
- Schemas folder empty — routers use raw dict (future cleanup)
- No auth yet (deferred, last item)

### Gardener page (`/gardener`)
- Side panel: Plants tab with live search (by code/name/latin), Zones tab, Log tab
- Plant card (side panel): sprite, HP bar, meta, pending tasks with Done button, action buttons (add/update sprite via upload, log action, log obs pre-fill Log tab, update location inline form)
- Sprite upload: `POST /api/plants/{id}/sprite` → saves as `/static/sprites/{code}.svg`; requires `python-multipart` installed

### Plants page (`/plants`)
- Single-column list, card shows: line 1 (code + name + status badge), line 2 (tile coord · zone chip with map color · container)
- Header: search bar flex-expands, Add plant button same height

### Plant detail page (`/plants/{id}`)
- Sprite displayed at ~25% content width (responsive, not fixed px)

### Tasks page (`/tasks`)
- Dismiss button: sets status `dismissed`, hidden from all lists
- Done button: opens modal with two paths — "Task complete" (immediate) or "Monitor outcome" (note + observation date → creates follow-up task, then marks done)

## Next steps
See `TODO.md` for the current task list. All planned features now complete.
Auth (login page + JWT) is last — deferred until all features complete.
