from sqlalchemy import Column, Integer, Text, Date, ForeignKey
from sqlalchemy.dialects.postgresql import TIMESTAMP
from sqlalchemy.sql import func
from .base import Base

class GardenerProfile(Base):
    __tablename__ = "gardener_profile"

    id = Column(Integer, primary_key=True)
    xp_total = Column(Integer, default=0)
    level = Column(Integer, default=1)
    last_action_date = Column(Date)

class GardenerLevel(Base):
    __tablename__ = "gardener_levels"

    level = Column(Integer, primary_key=True)
    xp_threshold = Column(Integer, nullable=False)
    title = Column(Text, nullable=False)

class GardenLevel(Base):
    __tablename__ = "garden_levels"

    level = Column(Integer, primary_key=True)
    score_threshold = Column(Integer, nullable=False)
    name = Column(Text, nullable=False)

class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True)
    code = Column(Text, unique=True, nullable=False)
    name = Column(Text, nullable=False)
    description = Column(Text)
    category = Column(Text)

class GardenerAchievement(Base):
    __tablename__ = "gardener_achievements"

    id = Column(Integer, primary_key=True)
    achievement_id = Column(Integer, ForeignKey("achievements.id"), nullable=False)
    unlocked_at = Column(TIMESTAMP(timezone=True), server_default=func.now())