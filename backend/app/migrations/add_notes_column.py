"""add notes column to files table

Revision ID: add_notes_column
Revises: 
Create Date: 2024-03-21

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_notes_column'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Add notes column to files table
    op.add_column('files', sa.Column('notes', sa.String(), nullable=True))

def downgrade():
    # Remove notes column from files table
    op.drop_column('files', 'notes') 