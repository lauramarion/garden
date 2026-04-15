from sqlalchemy import Column, Integer, Text, Boolean, Numeric
from .base import Base

class Zone(Base):
    __tablename__ = "zones"

    id = Column(Integer, primary_key=True)
    code = Column(Text, unique=True, nullable=False)
    label = Column(Text, nullable=False)
    light = Column(Text)
    moisture = Column(Text)
    covered = Column(Boolean, default=False)
    wind_exposure = Column(Text)
    has_soil = Column(Boolean, default=False)
    soil_ph = Column(Numeric(4, 2))
    notes = Column(Text)