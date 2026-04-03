from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app = FastAPI(title="garden_project")

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/api/health")
def health():
    return {"status": "ok", "project": "garden_project"}

@app.get("/")
def root():
    return FileResponse("static/public.html")