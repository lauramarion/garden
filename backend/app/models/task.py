from sqlalchemy import Column, Integer, Text, Date, ForeignKey
from sqlalchemy.dialects.postgresql import TIMESTAMP
from sqlalchemy.sql import func
from .base import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True)
    plant_id = Column(Integer, ForeignKey("plants.id"))
    zone_id = Column(Integer, ForeignKey("zones.id"))
    title = Column(Text, nullable=False)
    description = Column(Text)
    priority = Column(Text, default="soon")
    status = Column(Text, default="pending")
    source = Column(Text, default="manual")
    due_date = Column(Date)
    completed_at = Column(TIMESTAMP(timezone=True))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())