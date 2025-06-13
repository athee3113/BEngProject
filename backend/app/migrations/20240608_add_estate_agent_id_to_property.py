from alembic import op
import sqlalchemy as sa

def upgrade():
    op.add_column('properties', sa.Column('estate_agent_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True))

def downgrade():
    op.drop_column('properties', 'estate_agent_id') 