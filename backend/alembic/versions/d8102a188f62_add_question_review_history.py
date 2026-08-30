"""add_question_review_history

Revision ID: d8102a188f62
Revises: c491a92e105b
Create Date: 2026-08-29 19:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'd8102a188f62'
down_revision: Union[str, Sequence[str], None] = 'c491a92e105b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'question_review_history',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('question_id', sa.Integer(), nullable=False),
        sa.Column('admin_user_id', sa.Integer(), nullable=False),
        sa.Column('previous_status', sa.String(length=50), nullable=True),
        sa.Column('new_status', sa.String(length=50), nullable=False),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['admin_user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['question_id'], ['questions.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('question_review_history', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_question_review_history_admin_user_id'), ['admin_user_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_question_review_history_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_question_review_history_question_id'), ['question_id'], unique=False)


def downgrade() -> None:
    with op.batch_alter_table('question_review_history', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_question_review_history_question_id'))
        batch_op.drop_index(batch_op.f('ix_question_review_history_id'))
        batch_op.drop_index(batch_op.f('ix_question_review_history_admin_user_id'))
    op.drop_table('question_review_history')
