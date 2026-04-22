from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from .routers import plants, zones, journal, tasks, dashboard, gardener

app = FastAPI(title="garden_project")

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(plants.router)
app.include_router(zones.router)
app.include_router(journal.router)
app.include_router(tasks.router)
app.include_router(dashboard.router)
app.include_router(gardener.router)

@app.get("/api/health")
def health():
    return {"status": "ok", "project": "garden_project"}

@app.get("/")
def root():
    return FileResponse("static/public.html")

@app.get("/gardener")
def gardener():
    return FileResponse("static/gardener.html")

@app.get("/dashboard")
def dashboard_page():
    return FileResponse("static/dashboard.html")

@app.get("/tasks")
def tasks_page():
    return FileResponse("static/tasks.html")

@app.get("/journal")
def journal_page():
    return FileResponse("static/journal.html")

@app.get("/plants")
def plants_page():
    return FileResponse("static/plants.html")

@app.get("/plants/{plant_id}")
def plant_detail_page(_plant_id: int):
    return FileResponse("static/plant_detail.html")