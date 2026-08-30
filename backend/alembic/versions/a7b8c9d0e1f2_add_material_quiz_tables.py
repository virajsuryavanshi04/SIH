"""add material quiz tables

Revision ID: a7b8c9d0e1f2
Revises: f6b28c3d45e2
Create Date: 2026-08-29 22:33:00.000000

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision = 'a7b8c9d0e1f2'
down_revision = 'f6b28c3d45e2'
branch_labels = None
depends_on = None

def upgrade():
    # 1. Create material_quiz_question_sets
    op.create_table(
        'material_quiz_question_sets',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True, nullable=False),
        sa.Column('material_id', sa.Integer(), sa.ForeignKey('learning_materials.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='ready'),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=datetime.utcnow)
    )
    op.create_index('ix_material_quiz_question_sets_id', 'material_quiz_question_sets', ['id'])
    op.create_index('ix_material_quiz_question_sets_material_id', 'material_quiz_question_sets', ['material_id'])

    # 2. Create material_quiz_questions
    op.create_table(
        'material_quiz_questions',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True, nullable=False),
        sa.Column('set_id', sa.Integer(), sa.ForeignKey('material_quiz_question_sets.id', ondelete='CASCADE'), nullable=False),
        sa.Column('material_id', sa.Integer(), sa.ForeignKey('learning_materials.id', ondelete='CASCADE'), nullable=False),
        sa.Column('question_text', sa.Text(), nullable=False),
        sa.Column('question_type', sa.String(length=50), nullable=False),
        sa.Column('difficulty', sa.String(length=10), nullable=False, server_default='2'),
        sa.Column('cognitive_level', sa.String(length=50), nullable=False, server_default='understand'),
        sa.Column('correct_answer', sa.Text(), nullable=False),
        sa.Column('explanation', sa.Text(), nullable=False),
        sa.Column('concept', sa.String(length=255), nullable=True),
        sa.Column('source_reference', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=datetime.utcnow)
    )
    op.create_index('ix_material_quiz_questions_id', 'material_quiz_questions', ['id'])
    op.create_index('ix_material_quiz_questions_set_id', 'material_quiz_questions', ['set_id'])
    op.create_index('ix_material_quiz_questions_material_id', 'material_quiz_questions', ['material_id'])
    op.create_index('ix_material_quiz_questions_difficulty', 'material_quiz_questions', ['difficulty'])

    # 3. Create material_quiz_options
    op.create_table(
        'material_quiz_options',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True, nullable=False),
        sa.Column('question_id', sa.Integer(), sa.ForeignKey('material_quiz_questions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('is_correct', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('order', sa.Integer(), nullable=False, server_default='1')
    )
    op.create_index('ix_material_quiz_options_id', 'material_quiz_options', ['id'])
    op.create_index('ix_material_quiz_options_question_id', 'material_quiz_options', ['question_id'])

    # 4. Alter assessments table to add source_material_id and material_quiz_set_id
    with op.batch_alter_table('assessments') as batch_op:
        batch_op.add_column(sa.Column('source_material_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('material_quiz_set_id', sa.Integer(), nullable=True))

    # 5. Alter assessment_answers table to add material_quiz_question_id, selected_material_option_id, and make question_id nullable
    with op.batch_alter_table('assessment_answers') as batch_op:
        batch_op.add_column(sa.Column('material_quiz_question_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('selected_material_option_id', sa.Integer(), nullable=True))
        batch_op.alter_column('question_id', existing_type=sa.Integer(), nullable=True)

def downgrade():
    with op.batch_alter_table('assessment_answers') as batch_op:
        batch_op.alter_column('question_id', existing_type=sa.Integer(), nullable=False)
        batch_op.drop_column('selected_material_option_id')
        batch_op.drop_column('material_quiz_question_id')

    with op.batch_alter_table('assessments') as batch_op:
        batch_op.drop_column('material_quiz_set_id')
        batch_op.drop_column('source_material_id')

    op.drop_table('material_quiz_options')
    op.drop_table('material_quiz_questions')
    op.drop_table('material_quiz_question_sets')
