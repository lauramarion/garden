from sqlalchemy import Column, Integer, Text, Boolean, Date, SmallInteger, ForeignKey
from sqlalchemy.dialects.postgresql import TIMESTAMP
from sqlalchemy.sql import func
from .base import Base

class Plant(Base):
    __tablename__ = "plants"

    id = Column(Integer, primary_key=True)
    code = Column(Text, unique=True, nullable=False)
    common_name = Column(Text, nullable=False)
    latin_name = Column(Text)
    zone_id = Column(Integer, ForeignKey("zones.id"))
    container = Column(Text)
    status = Column(Text, default="OK")
    status_notes = Column(Text)
    acquired_date = Column(Date)
    acquired_from = Column(Text)
    photo_path = Column(Text)
    sprite_path = Column(Text)
    sprite_prompt = Column(Text)
    grid_col = Column(SmallInteger)
    grid_row = Column(SmallInteger)
    grid_slot = Column(SmallInteger, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())