from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import date

from ..database import get_db
from ..models import JournalEntry

router = APIRouter(prefix="/api/journal", tags=["journal"])

@router.get("/")
def get_entries(limit: int = 50, db: Session = Depends(get_db)):
    entries = db.execute(
        select(JournalEntry)
        .order_by(JournalEntry.entry_date.desc(), JournalEntry.created_at.desc())
        .limit(limit)
    ).scalars().all()
    return [entry_to_dict(e) for e in entries]

@router.post("/")
def create_entry(data: dict, db: Session = Depends(get_db)):
    if "entry_date" not in data:
        data["entry_date"] = date.today().isoformat()
    entry = JournalEntry(**data)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry_to_dict(entry)

def entry_to_dict(e: JournalEntry) -> dict:
    return {
        "id": e.id,
        "entry_date": e.entry_date.isoformat() if e.entry_date else None,
        "plant_id": e.plant_id,
        "zone_id": e.zone_id,
        "entry_type": e.entry_type,
        "details": e.details,
        "result": e.result,
        "created_at": e.created_at.isoformat() if e.created_at else None,
    }