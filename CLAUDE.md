# garden_project — Claude Instructions

## Project overview
Full-stack garden management web app. Sole user: Laura.
- Repo: `github.com/lauramarion/garden`
- Production: `https://garden.lauramarion.eu` (OVH VPS, Ubuntu 22.04)
- Architecture doc: `mon_jardin_architecture.docx`

## Golden rule — always work locally
**Never create or edit files inside a Docker container.**
All files are created and edited locally in VS Code.
The container reads local files via volume mounts — local changes are reflected instantly.

## Stack
- **Backend:** FastAPI (Python) — `backend/`
- **Frontend:** Plain HTML + CSS + Vanilla JS — `backend/static/`
- **Database:** PostgreSQL 16
- **Migrations:** Alembic — run locally, applied via container
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
      __init__.py
      main.py
      routers/
      models/
      schemas/
    static/
      public.html
      gardener.html
      dashboard.html
      css/
      js/
    migrations/        ← Alembic migrations
    alembic.ini
    Dockerfile
    requirements.txt
  dbt/
    models/
      staging/
      marts/
    dbt_project.yml
  dagster/
  docker-compose.yml
  Caddyfile
  .env               ← never committed
  .gitignore
  CLAUDE.md
```

## Local development workflow
```bash
docker compose up -d          # start stack in background
docker compose logs -f        # tail logs
docker compose down           # stop stack
docker compose up -d --build  # rebuild after Dockerfile or requirements change
```

FastAPI hot-reloads automatically on file save — no restart needed for Python changes.

## Python workflow
All Python tooling (alembic, dbt, pip) runs **locally**, not inside containers.
Use a virtual environment:
```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate  # Windows Git Bash
pip install -r requirements.txt
```

## Alembic (database migrations)
Always run Alembic locally — it connects to Postgres via the exposed port 5432.
```bash
cd backend
source .venv/Scripts/activate  # Windows Git Bash
alembic upgrade head           # apply all pending migrations
alembic revision -m "description"  # create a new migration file
alembic downgrade -1           # roll back one migration
```

The database connection for local Alembic is in `alembic.ini`:
```
sqlalchemy.url = postgresql://garden_user:PASSWORD@localhost:5432/garden
```
Use `localhost` (not `db`) because Alembic runs on the host machine, not inside Docker.
On the VPS, run migrations via:
```bash
docker compose exec backend alembic upgrade head
```

## Deploying to VPS
```bash
git push                       # push code to GitHub
ssh ubuntu@VPS_IP
cd garden
git pull
docker compose up -d --build   # rebuild and restart
docker compose exec backend alembic upgrade head  # apply any new migrations
```

## Environment variables
Never commit `.env`. It lives only on local machine and VPS.
```
DB_PASSWORD=...
SECRET_KEY=...
ENVIRONMENT=development  # or production
```

## Database
- Host (local): `localhost:5432`
- Host (in containers): `db:5432`
- Database: `garden`
- User: `garden_user`

## Key design decisions
- Frontend is plain HTML/CSS/vanilla JS — no React, no build step
- Garden map is isometric canvas (no library) — `toScreen(col, row)` function
- Grid: 0.5m/cell, plants have `grid_col`, `grid_row`, `grid_slot`
- Scores (plant HP, garden vitality) computed in dbt, never stored raw
- Gamification: RPG style — XP, HP bars, levels, quests, badges
- Sprites: 64×64 PNG, transparent background, Stardew Valley aesthetic
- No emoji in UI — pixel art icons only

## Git workflow
- `main` branch = production
- Work on feature branches, merge via PR
- Commit messages: `feat:`, `fix:`, `chore:`, `docs:`
```bash
git checkout -b feat/my-feature
git add .
git commit -m "feat: description"
git push
```

## VPS rules
The VPS never originates code. It only receives changes from GitHub.
**On the VPS, never run `git add`, `git commit`, or create/edit files.**
VPS deployment is always exactly:
```bash
git pull
docker compose up -d --build
docker compose exec backend alembic upgrade head  # only if migrations changed
```

## Environment clarity rules
**Always be explicit about which environment an action takes place in.**
- Label every terminal block with 📍 LOCAL or 📍 VPS
- Never mix local and VPS steps in the same instruction block
- Complete all local steps first (code, commit, push), then do VPS steps in one go
- Never context-switch between local and VPS mid-task without a clear section break
- Standard end-of-session VPS deploy always comes last, after all local work is done

## Frontend rules
- ALL styles go in `main.css` — no inline styles, no `<style>` blocks in HTML files, ever
- HTML files contain structure only
- JS files contain behaviour only
- One CSS file: `backend/static/css/main.css`

## What NOT to do
- Never run `alembic init` or create files inside a container
- Never commit `.env`
- Never hardcode passwords or secrets
- Never use `docker compose exec` to create project files
- Never install packages globally — always use the venv
- Never tell Laura to run `git add` or `git commit` on the VPS
- Never suggest editing files directly on the VPS
- Never write inline styles or `<style>` blocks in HTML files

## PROJECT_OVERVIEW.md
`PROJECT_OVERVIEW.md` at the repo root is a plain-language explanation of every component for Laura's reference.
**Keep it updated** whenever a new component is added, an existing one changes significantly, or a new next step is completed.

## Current state (as of April 2026)
- DB: 10 core tables + 5 gamification tables, all migrated
- 51 plants seeded with real data
- Public map at `/` — isometric canvas, hover tooltips, plant stats
- Gardener UI at `/gardener` — map + plant cards + quick-log form + journal
- No auth yet (deferred to last)
- Sprites are placeholders — sprite_path column exists but no images yet
- plant_status_history exists but nothing writes to it yet
- Schemas folder is empty — routers use raw dict (to be cleaned up)

## Next steps in order
1. ✅ Verify grid coordinate labels. Fixed 11 plants in null zone, added 2 slot offsets (quincunx), use letter-number coord system (A=r0, 1=c17).
2. ✅ dbt setup — staging views (stg_plants, stg_journal_entries, stg_tasks) + mart tables (plant_hp, garden_vitality_score) in dbt_staging/dbt_marts schemas. Run with: cd dbt && dbt run --profiles-dir .
3. ✅ Dagster setup — daily pipeline: plant_status_snapshot → generate_tasks (2 rules: WARNING + no action in 14 days). Run with: cd dagster && dagster dev -w workspace.yaml
4. ✅ GitHub Actions CI/CD — .github/workflows/deploy.yml, SSH deploy on push to main (appleboy/ssh-action, secrets: VPS_HOST, VPS_USER, VPS_SSH_KEY)
5. ✅ Dashboard page — vitality score + stat cards + plant HP list (worst first). Shared topbar component via topbar.js. API: /api/dashboard/summary + /api/dashboard/plants querying dbt_marts schema.
6. ✅ Full UI — status vocabulary migrated (OK→Thriving, WARNING→Struggling), GRID_SLOTS 1-indexed, 5-item nav + season badge + mobile tab bar. Screens: Tasks (/tasks), Journal (/journal), Plants list (/plants), Plant detail (/plants/{id}), Add plant modal, Dashboard enhancements (XP bar + disturbances + recent journal), Map enhancements (Plants/Zones/Log tabs + side plant list).
7. Auth — login page + JWT (last, portfolio only)