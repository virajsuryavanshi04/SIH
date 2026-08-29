"""add_question_bank_metadata_fields

Revision ID: c491a92e105b
Revises: 838740a90065
Create Date: 2026-08-29 18:31:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'c491a92e105b'
down_revision: Union[str, Sequence[str], None] = '838740a90065'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('questions', schema=None) as batch_op:
        batch_op.add_column(sa.Column('question_type', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('bank_question_id', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('bank_version', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('source_type', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('source_title', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('source_organization', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('source_reference', sa.Text(), nullable=True))
        batch_op.create_index(batch_op.f('ix_questions_bank_question_id'), ['bank_question_id'], unique=True)


def downgrade() -> None:
    with op.batch_alter_table('questions', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_questions_bank_question_id'))
        batch_op.drop_column('source_reference')
        batch_op.drop_column('source_organization')
        batch_op.drop_column('source_title')
        batch_op.drop_column('source_type')
        batch_op.drop_column('bank_version')
        batch_op.drop_column('bank_question_id')
        batch_op.drop_column('question_type')
