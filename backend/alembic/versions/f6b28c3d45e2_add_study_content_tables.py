"""add_study_content_tables

Revision ID: f6b28c3d45e2
Revises: e5a19b2f34c1
Create Date: 2026-08-29 22:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f6b28c3d45e2'
down_revision: Union[str, Sequence[str], None] = 'e5a19b2f34c1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Material Notes
    op.create_table(
        'material_notes',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('material_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('content', sa.JSON(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='ready'),
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['material_id'], ['learning_materials.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_material_notes_material_id'), 'material_notes', ['material_id'], unique=False)

    # 2. Material Flashcard Decks
    op.create_table(
        'material_flashcard_decks',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('material_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='ready'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['material_id'], ['learning_materials.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_material_flashcard_decks_material_id'), 'material_flashcard_decks', ['material_id'], unique=False)

    # 3. Material Flashcards (individual cards within a deck)
    op.create_table(
        'material_flashcards',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('deck_id', sa.Integer(), nullable=False),
        sa.Column('material_id', sa.Integer(), nullable=False),
        sa.Column('front', sa.Text(), nullable=False),
        sa.Column('back', sa.Text(), nullable=False),
        sa.Column('order', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['deck_id'], ['material_flashcard_decks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['material_id'], ['learning_materials.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_material_flashcards_deck_id'), 'material_flashcards', ['deck_id'], unique=False)
    op.create_index(op.f('ix_material_flashcards_material_id'), 'material_flashcards', ['material_id'], unique=False)

    # 4. Material Mind Maps
    op.create_table(
        'material_mind_maps',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('material_id', sa.Integer(), nullable=False),
        sa.Column('root_node', sa.JSON(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='ready'),
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['material_id'], ['learning_materials.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_material_mind_maps_material_id'), 'material_mind_maps', ['material_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_material_mind_maps_material_id'), table_name='material_mind_maps')
    op.drop_table('material_mind_maps')
    op.drop_index(op.f('ix_material_flashcards_material_id'), table_name='material_flashcards')
    op.drop_index(op.f('ix_material_flashcards_deck_id'), table_name='material_flashcards')
    op.drop_table('material_flashcards')
    op.drop_index(op.f('ix_material_flashcard_decks_material_id'), table_name='material_flashcard_decks')
    op.drop_table('material_flashcard_decks')
    op.drop_index(op.f('ix_material_notes_material_id'), table_name='material_notes')
    op.drop_table('material_notes')
