from sqlalchemy import Column, Integer, Text, Date, ForeignKey
from sqlalchemy.dialects.postgresql import TIMESTAMP
from sqlalchemy.sql import func
from .base import Base

class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(Integer, primary_key=True)
    entry_date = Column(Date, nullable=False, server_default=func.current_date())
    plant_id = Column(Integer, ForeignKey("plants.id"))
    zone_id = Column(Integer, ForeignKey("zones.id"))
    entry_type = Column(Text, nullable=False)
    details = Column(Text, nullable=False)
    result = Column(Text)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())