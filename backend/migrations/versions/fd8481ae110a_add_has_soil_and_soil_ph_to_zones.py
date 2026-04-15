"""add has_soil and soil_ph to zones

Revision ID: fd8481ae110a
Revises: 36c0bf018efb
Create Date: 2026-04-15 14:14:58.419692

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fd8481ae110a'
down_revision: Union[str, None] = '36c0bf018efb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('zones', sa.Column('has_soil', sa.Boolean(), nullable=True))
    op.add_column('zones', sa.Column('soil_ph', sa.Numeric(precision=4, scale=2), nullable=True))

def downgrade() -> None:
    op.drop_column('zones', 'soil_ph')
    op.drop_column('zones', 'has_soil')