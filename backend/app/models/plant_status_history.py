from sqlalchemy import Column, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import TIMESTAMP
from sqlalchemy.sql import func
from .base import Base

class PlantStatusHistory(Base):
    __tablename__ = "plant_status_history"

    id = Column(Integer, primary_key=True)
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=False)
    status = Column(Text, nullable=False)
    notes = Column(Text)
    recorded_at = Column(TIMESTAMP(timezone=True), server_default=func.now())