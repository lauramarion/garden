"""rename vitality states to full vocabulary

Revision ID: a1b2c3d4e5f6
Revises: fd8481ae110a
Create Date: 2026-04-22 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'fd8481ae110a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Rename status vocabulary
    op.execute("UPDATE plants SET status = 'Thriving'   WHERE status = 'OK'")
    op.execute("UPDATE plants SET status = 'Struggling' WHERE status = 'WARNING'")
    op.execute("UPDATE plants SET status = 'Lost'       WHERE status NOT IN ('Thriving', 'Struggling', 'Stable', 'Dormant', 'New')")
    # Migrate grid_slot from 0-indexed to 1-indexed (0→1, 1→2, 2→3, 3→4, 4→5)
    op.execute("UPDATE plants SET grid_slot = grid_slot + 1 WHERE grid_slot IS NOT NULL")


def downgrade() -> None:
    op.execute("UPDATE plants SET status = 'OK'      WHERE status = 'Thriving'")
    op.execute("UPDATE plants SET status = 'WARNING' WHERE status = 'Struggling'")
    op.execute("UPDATE plants SET grid_slot = grid_slot - 1 WHERE grid_slot IS NOT NULL")
