"""add stage info table

Revision ID: add_stage_info_table
Revises: 
Create Date: 2024-03-21 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_stage_info_table'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'stage_info',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('stage', sa.String(), nullable=False),
        sa.Column('role', sa.String(), nullable=False),
        sa.Column('explanation', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), onupdate=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_stage_info_id'), 'stage_info', ['id'], unique=False)

def downgrade():
    op.drop_index(op.f('ix_stage_info_id'), table_name='stage_info')
    op.drop_table('stage_info') 