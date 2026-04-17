from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select

from ..database import get_db
from ..models import Zone

router = APIRouter(prefix="/api/zones", tags=["zones"])

@router.get("/")
def get_zones(db: Session = Depends(get_db)):
    zones = db.execute(select(Zone)).scalars().all()
    return [zone_to_dict(z) for z in zones]

@router.get("/{zone_id}")
def get_zone(zone_id: int, db: Session = Depends(get_db)):
    zone = db.get(Zone, zone_id)
    if not zone:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Zone not found")
    return zone_to_dict(zone)

def zone_to_dict(z: Zone) -> dict:
    return {
        "id": z.id,
        "code": z.code,
        "label": z.label,
        "light": z.light,
        "moisture": z.moisture,
        "covered": z.covered,
        "wind_exposure": z.wind_exposure,
        "has_soil": z.has_soil,
        "soil_ph": float(z.soil_ph) if z.soil_ph else None,
        "notes": z.notes,
    }