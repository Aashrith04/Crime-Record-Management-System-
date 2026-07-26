"""Baseline database schema migration for CRMS

Revision ID: 001_baseline
Revises: 
Create Date: 2026-07-26 23:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_baseline'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Baseline migration marker
    pass

def downgrade() -> None:
    pass
