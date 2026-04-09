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
source .venv/bin/activate
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

## What NOT to do
- Never run `alembic init` or create files inside a container
- Never commit `.env`
- Never hardcode passwords or secrets
- Never use `docker compose exec` to create project files
- Never install packages globally — always use the venv
