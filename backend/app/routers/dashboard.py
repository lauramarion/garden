from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from ..database import get_db

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    row = db.execute(text("""
        SELECT snapshot_date, plant_count, vitality_score,
               plants_ok, plants_warning, plants_lost
        FROM dbt_marts.garden_vitality_score
        LIMIT 1
    """)).fetchone()
    if not row:
        return {}
    return {
        "snapshot_date":  str(row.snapshot_date),
        "plant_count":    row.plant_count,
        "vitality_score": float(row.vitality_score),
        "plants_ok":      row.plants_ok,
        "plants_warning": row.plants_warning,
        "plants_lost":    row.plants_lost,
    }


@router.get("/plants")
def get_plant_hp(db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT ph.plant_id, ph.code, ph.common_name, ph.status,
               ph.hp, ph.last_action_date, ph.action_count,
               z.label as zone_label
        FROM dbt_marts.plant_hp ph
        LEFT JOIN public.zones z ON z.id = ph.zone_id
        ORDER BY ph.hp ASC, ph.code ASC
    """)).fetchall()
    return [
        {
            "plant_id":        r.plant_id,
            "code":            r.code,
            "common_name":     r.common_name,
            "status":          r.status,
            "hp":              r.hp,
            "last_action_date": str(r.last_action_date) if r.last_action_date else None,
            "action_count":    r.action_count,
            "zone_label":      r.zone_label,
        }
        for r in rows
    ]
