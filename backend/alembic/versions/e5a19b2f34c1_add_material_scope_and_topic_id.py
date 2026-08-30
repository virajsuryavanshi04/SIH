"""add_material_scope_and_topic_id

Revision ID: e5a19b2f34c1
Revises: d8102a188f62
Create Date: 2026-08-29 21:46:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5a19b2f34c1'
down_revision: Union[str, Sequence[str], None] = 'd8102a188f62'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add material_scope and topic_id columns safely
    op.add_column('learning_materials', sa.Column('material_scope', sa.String(length=50), nullable=True))
    op.add_column('learning_materials', sa.Column('topic_id', sa.Integer(), nullable=True))
    
    # 2. Backfill existing legacy materials
    # If competency_id is present -> OFFICIAL_COMPETENCY
    # If competency_id is NULL -> OTHER_LEARNING
    op.execute(
        "UPDATE learning_materials SET material_scope = 'OFFICIAL_COMPETENCY' WHERE competency_id IS NOT NULL"
    )
    op.execute(
        "UPDATE learning_materials SET material_scope = 'OTHER_LEARNING' WHERE competency_id IS NULL"
    )


def downgrade() -> None:
    with op.batch_alter_table('learning_materials') as batch_op:
        batch_op.drop_column('topic_id')
        batch_op.drop_column('material_scope')
