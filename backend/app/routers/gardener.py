from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select

from ..database import get_db
from ..models.gamification import GardenerProfile, GardenerLevel

router = APIRouter(prefix="/api/gardener", tags=["gardener"])

@router.get("/profile")
def get_profile(db: Session = Depends(get_db)):
    profile = db.execute(select(GardenerProfile)).scalars().first()
    if not profile:
        return {"xp_total": 0, "level": 1, "title": "Seedling", "xp_next": 100, "xp_progress": 0}

    current_level = db.get(GardenerLevel, profile.level)
    next_level    = db.get(GardenerLevel, profile.level + 1)

    xp_current = current_level.xp_threshold if current_level else 0
    xp_next    = next_level.xp_threshold    if next_level    else xp_current + 100
    xp_progress = max(0, min(100, round(
        (profile.xp_total - xp_current) / max(1, xp_next - xp_current) * 100
    )))

    return {
        "xp_total":    profile.xp_total,
        "level":       profile.level,
        "title":       current_level.title if current_level else "Seedling",
        "xp_next":     xp_next,
        "xp_progress": xp_progress,
    }
