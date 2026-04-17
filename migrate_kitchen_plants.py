"""
Migration: move plants from the kitchen area to the patio area.

Kitchen tiles are grid_col >= 13 AND grid_row >= 5.
Each plant is moved to (same col, row - 5), which lands it in the valid
patio area (row 0-4). Slot conflicts at the target tile are resolved by
finding the next free slot (0, 1, 2).

Run from the garden/ directory:
    python migrate_kitchen_plants.py
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from app.database import SessionLocal
from app.models.plant import Plant
from sqlalchemy import select


def next_free_slot(db, col, row, exclude_id):
    taken = {
        row_[0]
        for row_ in db.execute(
            select(Plant.grid_slot).where(
                Plant.grid_col == col,
                Plant.grid_row == row,
                Plant.is_active == True,
                Plant.id != exclude_id,
            )
        ).all()
    }
    for s in range(3):
        if s not in taken:
            return s
    raise ValueError(f"All 3 slots taken at col={col} row={row}")


def migrate():
    db = SessionLocal()
    try:
        kitchen_plants = db.execute(
            select(Plant).where(
                Plant.grid_col >= 13,
                Plant.grid_row >= 5,
                Plant.is_active == True,
            )
        ).scalars().all()

        if not kitchen_plants:
            print("No plants found in the kitchen area — nothing to migrate.")
            return

        print(f"Found {len(kitchen_plants)} plant(s) in the kitchen area:")
        for p in kitchen_plants:
            print(f"  {p.code!r:20s}  col={p.grid_col}  row={p.grid_row}  slot={p.grid_slot}")

        print()
        for plant in kitchen_plants:
            target_col = plant.grid_col
            target_row = plant.grid_row - 5
            slot = next_free_slot(db, target_col, target_row, plant.id)
            print(f"  {plant.code!r}: row {plant.grid_row} → {target_row}, slot → {slot}")
            plant.grid_row = target_row
            plant.grid_slot = slot

        db.commit()
        print("\nMigration complete.")
    except Exception as e:
        db.rollback()
        print(f"\nError — rolled back: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    migrate()
