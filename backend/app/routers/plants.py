import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import Optional
from datetime import date

from ..database import get_db
from ..models import Plant, Zone

router = APIRouter(prefix="/api/plants", tags=["plants"])

@router.get("/")
def get_plants(active_only: bool = True, db: Session = Depends(get_db)):
    query = select(Plant)
    if active_only:
        query = query.where(Plant.is_active == True)
    plants = db.execute(query).scalars().all()
    return [plant_to_dict(p) for p in plants]

@router.get("/{plant_id}")
def get_plant(plant_id: int, db: Session = Depends(get_db)):
    plant = db.get(Plant, plant_id)
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    return plant_to_dict(plant)

@router.post("/")
def create_plant(data: dict, db: Session = Depends(get_db)):
    plant = Plant(**data)
    db.add(plant)
    db.commit()
    db.refresh(plant)
    return plant_to_dict(plant)

@router.post("/{plant_id}/sprite")
async def upload_sprite(plant_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    plant = db.get(Plant, plant_id)
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    dest = os.path.join("static", "sprites", f"{plant.code}.svg")
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    content = await file.read()
    with open(dest, "wb") as f:
        f.write(content)
    return {"ok": True, "path": f"/static/sprites/{plant.code}.svg"}

@router.patch("/{plant_id}")
def update_plant(plant_id: int, data: dict, db: Session = Depends(get_db)):
    plant = db.get(Plant, plant_id)
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    for key, value in data.items():
        setattr(plant, key, value)
    db.commit()
    db.refresh(plant)
    return plant_to_dict(plant)

def plant_to_dict(p: Plant) -> dict:
    return {
        "id": p.id,
        "code": p.code,
        "common_name": p.common_name,
        "latin_name": p.latin_name,
        "zone_id": p.zone_id,
        "container": p.container,
        "status": p.status,
        "status_notes": p.status_notes,
        "acquired_date": p.acquired_date.isoformat() if p.acquired_date else None,
        "acquired_from": p.acquired_from,
        "sprite_path": p.sprite_path,
        "grid_col": p.grid_col,
        "grid_row": p.grid_row,
        "grid_slot": p.grid_slot,
        "is_active": p.is_active,
    }