from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import datetime

from ..database import get_db
from ..models import Task

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

@router.get("/")
def get_tasks(status: str = None, plant_id: int = None, zone_id: int = None, db: Session = Depends(get_db)):
    query = select(Task).order_by(Task.due_date.asc().nullslast(), Task.created_at.desc())
    if status:
        query = query.where(Task.status == status)
    if plant_id:
        query = query.where(Task.plant_id == plant_id)
    if zone_id:
        query = query.where(Task.zone_id == zone_id)
    tasks = db.execute(query).scalars().all()
    return [task_to_dict(t) for t in tasks]

@router.post("/")
def create_task(data: dict, db: Session = Depends(get_db)):
    task = Task(**data)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task_to_dict(task)

@router.patch("/{task_id}/complete")
def complete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.status = "done"
    task.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    return task_to_dict(task)

@router.patch("/{task_id}")
def update_task(task_id: int, data: dict, db: Session = Depends(get_db)):
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    for key, value in data.items():
        setattr(task, key, value)
    db.commit()
    db.refresh(task)
    return task_to_dict(task)

def task_to_dict(t: Task) -> dict:
    return {
        "id": t.id,
        "plant_id": t.plant_id,
        "zone_id": t.zone_id,
        "title": t.title,
        "description": t.description,
        "priority": t.priority,
        "status": t.status,
        "source": t.source,
        "due_date": t.due_date.isoformat() if t.due_date else None,
        "completed_at": t.completed_at.isoformat() if t.completed_at else None,
        "created_at": t.created_at.isoformat() if t.created_at else None,
    }