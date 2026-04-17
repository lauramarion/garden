from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from .routers import plants, zones, journal, tasks

app = FastAPI(title="garden_project")

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(plants.router)
app.include_router(zones.router)
app.include_router(journal.router)
app.include_router(tasks.router)

@app.get("/api/health")
def health():
    return {"status": "ok", "project": "garden_project"}

@app.get("/")
def root():
    return FileResponse("static/public.html")

@app.get("/gardener")
def gardener():
    return FileResponse("static/gardener.html")