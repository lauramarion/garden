import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

DATABASE_URL = os.getenv("DATABASE_URL",
    f"postgresql://garden_user:{os.getenv('DB_PASSWORD')}@localhost:5432/garden")

engine = create_engine(DATABASE_URL)

def seed_zones(session):
    zones = [
        dict(code="back",                  label="Back zone",                light="shade",    moisture="moist",    covered=False, wind_exposure="low",    has_soil=True,  soil_ph=None, notes="Shaded by neighbour's Prunus + ivy fence. Ivy invasion annual."),
        dict(code="left_border_front",     label="Left border — front",      light="full_sun", moisture="medium",   covered=False, wind_exposure="high",   has_soil=True,  soil_ph=None, notes="Best sun exposure in garden. Herb and aromatic cluster."),
        dict(code="left_border_back",      label="Left border — back",       light="full_sun", moisture="medium",   covered=False, wind_exposure="high",   has_soil=True,  soil_ph=None, notes="Full sun. Clay tile separator at herb/mint boundary."),
        dict(code="left_path",             label="Left path",                light="full_sun", moisture="dry",      covered=False, wind_exposure="high",   has_soil=False, soil_ph=None, notes="30cm paved path. Lawn colonises annually — needs permanent barrier."),
        dict(code="lawn",                  label="Lawn",                     light="full_sun", moisture="medium",   covered=False, wind_exposure="medium", has_soil=True,  soil_ph=None, notes="Mixed grass, dandelions left for bees. Mown spring/summer."),
        dict(code="right_border_front",    label="Right border — front",     light="partial",  moisture="medium",   covered=False, wind_exposure="medium", has_soil=True,  soil_ph=None, notes="Good exposure front half. Acid-amended soil."),
        dict(code="right_border_back",     label="Right border — back",      light="shade",    moisture="medium",   covered=False, wind_exposure="low",    has_soil=True,  soil_ph=None, notes="Heavily shaded by neighbour's Prunus. Cluster of failures — pH likely insufficient."),
        dict(code="entry",                 label="Entry paved zone",         light="partial",  moisture="dry",      covered=False, wind_exposure="low",    has_soil=False, soil_ph=None, notes="Left half direct sun, right half shaded by kitchen + fence."),
        dict(code="retaining_wall",        label="Retaining wall",           light="full_sun", moisture="dry",      covered=False, wind_exposure="medium", has_soil=False, soil_ph=None, notes="Lavender planter on patio side, currently empty."),
        dict(code="patio_uncovered",       label="Patio — uncovered",        light="partial",  moisture="dry",      covered=False, wind_exposure="low",    has_soil=False, soil_ph=None, notes="~2.2x2m upper patio. Good mostly indirect light. Direct sun sliver on left."),
        dict(code="patio_covered",         label="Patio — covered",          light="partial",  moisture="dry",      covered=True,  wind_exposure="none",   has_soil=False, soil_ph=None, notes="Under transparent roof. Hot & dry in summer. Unheated but sheltered from rain."),
        dict(code="patio_shelf_1",         label="Patio shelf 1",            light="partial",  moisture="dry",      covered=True,  wind_exposure="none",   has_soil=False, soil_ph=None, notes="Left wall, 4 tiers. Middle 2 tiers get direct sun part of day."),
        dict(code="patio_shelf_2",         label="Patio shelf 2",            light="partial",  moisture="dry",      covered=False, wind_exposure="low",    has_soil=False, soil_ph=None, notes="Right wall (kitchen side), 3 tiers. Good mostly indirect light."),
        dict(code="pond",                  label="Pond",                     light="shade",    moisture="wet",      covered=False, wind_exposure="low",    has_soil=False, soil_ph=None, notes="Bean-shaped ~1.30x0.90m. Duckweed problem. ~1hr direct sun/day max."),
        dict(code="rain_barrel",           label="Rain barrel planter",      light="full_sun", moisture="variable", covered=False, wind_exposure="high",   has_soil=True,  soil_ph=None, notes="Elevated round planter. Waterlogged when full, dry in summer. Grass invasion."),
        dict(code="compost",               label="Compost",                  light="shade",    moisture="moist",    covered=False, wind_exposure="low",    has_soil=False, soil_ph=None, notes="Back zone, surrounded by ivy."),
    ]
    for z in zones:
        session.execute(text("""
            INSERT INTO zones (code, label, light, moisture, covered, wind_exposure, has_soil, soil_ph, notes)
            VALUES (:code, :label, :light, :moisture, :covered, :wind_exposure, :has_soil, :soil_ph, :notes)
            ON CONFLICT (code) DO NOTHING
        """), z)
    print(f"✓ {len(zones)} zones seeded")

def seed_gardener_levels(session):
    levels = [
        (1,  0,     "Seedling"),
        (2,  100,   "Apprentice Tender"),
        (3,  300,   "Garden Hand"),
        (4,  600,   "Journeyman Grower"),
        (5,  1000,  "Cultivator"),
        (6,  1500,  "Seasoned Gardener"),
        (7,  2200,  "Green Thumb"),
        (8,  3000,  "Horticulturalist"),
        (9,  4000,  "Master of the Garden"),
        (10, 5500,  "Guardian of the Grove"),
    ]
    for level, xp, title in levels:
        session.execute(text("""
            INSERT INTO gardener_levels (level, xp_threshold, title)
            VALUES (:level, :xp, :title)
            ON CONFLICT (level) DO NOTHING
        """), dict(level=level, xp=xp, title=title))
    print(f"✓ {len(levels)} gardener levels seeded")

def seed_garden_levels(session):
    levels = [
        (1, 0,  "Wasteland"),
        (2, 15, "Bare Patch"),
        (3, 30, "Tended Plot"),
        (4, 45, "Growing Ground"),
        (5, 60, "Flourishing Garden"),
        (6, 75, "Verdant Sanctuary"),
        (7, 88, "Living Ecosystem"),
        (8, 96, "Eden"),
    ]
    for level, threshold, name in levels:
        session.execute(text("""
            INSERT INTO garden_levels (level, score_threshold, name)
            VALUES (:level, :threshold, :name)
            ON CONFLICT (level) DO NOTHING
        """), dict(level=level, threshold=threshold, name=name))
    print(f"✓ {len(levels)} garden levels seeded")

def seed_achievements(session):
    achievements = [
        # Milestone
        ("first_seed",        "First Seed",           "Log your first journal entry",                                "milestone"),
        ("chronicler",        "Chronicler",           "Log 50 journal entries",                                      "milestone"),
        ("quest_taker",       "Quest Taker",          "Complete your first generated quest",                         "milestone"),
        ("seasoned_quester",  "Seasoned Quester",     "Complete 50 quests",                                          "milestone"),
        ("collector",         "Collector",            "Have 10 active plants in the garden simultaneously",          "milestone"),
        ("master_planner",    "Master Planner",       "Have active plants in every zone simultaneously",             "milestone"),
        # Rescue
        ("field_medic",       "Field Medic",          "Save a plant from WARNING back to OK",                        "rescue"),
        ("miracle_worker",    "Miracle Worker",       "Save 5 plants from WARNING",                                  "rescue"),
        ("no_plant_left",     "No Plant Left Behind", "Have zero WARNING plants for 30 consecutive days",            "rescue"),
        ("resurrection",      "Resurrection",         "Save a plant that had been WARNING for over 14 days",         "rescue"),
        # Seasonal
        ("winter_warden",     "Winter Warden",        "Log at least one action every week through December-January", "seasonal"),
        ("spring_awakening",  "Spring Awakening",     "Complete 5 seasonal quests in March-April",                   "seasonal"),
        ("high_summer",       "High Summer",          "Maintain garden score above 60 throughout July",              "seasonal"),
        ("autumn_harvest",    "Autumn Harvest",       "Complete all wishlist quests before end of October",          "seasonal"),
        # Streak
        ("dedicated",         "Dedicated",            "Log actions 7 days in a row",                                 "streak"),
        ("committed",         "Committed",            "Log actions 30 days in a row",                                "streak"),
        ("creature_of_habit", "Creature of Habit",    "Complete a recurring routine quest 5 times in a row",         "streak"),
        # Garden-specific
        ("pond_keeper",       "Pond Keeper",          "Log 10 pond-related actions",                                 "garden"),
        ("wildlife_warden",   "Wildlife Warden",      "Log 5 wildlife observations",                                 "garden"),
        ("ivy_slayer",        "Ivy Slayer",           "Log 3 ivy-cutting actions in the back zone",                  "garden"),
        ("composter",         "Composter",            "Log 10 compost-related actions",                              "garden"),
        ("apothecary",        "Apothecary",           "Have 5 or more herb plants active simultaneously",            "garden"),
        ("water_whisperer",   "Water Whisperer",      "Manually remove duckweed from the pond 5 times",              "garden"),
    ]
    for code, name, description, category in achievements:
        session.execute(text("""
            INSERT INTO achievements (code, name, description, category)
            VALUES (:code, :name, :description, :category)
            ON CONFLICT (code) DO NOTHING
        """), dict(code=code, name=name, description=description, category=category))
    print(f"✓ {len(achievements)} achievements seeded")

def seed_gardener_profile(session):
    session.execute(text("""
        INSERT INTO gardener_profile (xp_total, level, last_action_date)
        SELECT 0, 1, NULL
        WHERE NOT EXISTS (SELECT 1 FROM gardener_profile)
    """))
    print("✓ Gardener profile seeded")

if __name__ == "__main__":
    with Session(engine) as session:
        seed_zones(session)
        seed_gardener_levels(session)
        seed_garden_levels(session)
        seed_achievements(session)
        seed_gardener_profile(session)
        session.commit()
        print("\n✅ All reference data seeded successfully")