"""update property buyer solicitor

Revision ID: 20240606_update_property_buyer_solicitor
Revises: 
Create Date: 2024-06-06 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20240606_update_property_buyer_solicitor'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Add buyer_solicitor_id and seller_solicitor_id columns
    op.add_column('properties', sa.Column('buyer_solicitor_id', sa.Integer(), nullable=True))
    op.add_column('properties', sa.Column('seller_solicitor_id', sa.Integer(), nullable=True))
    
    # Create foreign keys
    op.create_foreign_key('fk_properties_buyer_solicitor_id_users', 'properties', 'users', ['buyer_solicitor_id'], ['id'])
    op.create_foreign_key('fk_properties_seller_solicitor_id_users', 'properties', 'users', ['seller_solicitor_id'], ['id'])

def downgrade():
    # Drop foreign keys
    op.drop_constraint('fk_properties_buyer_solicitor_id_users', 'properties', type_='foreignkey')
    op.drop_constraint('fk_properties_seller_solicitor_id_users', 'properties', type_='foreignkey')
    
    # Drop columns
    op.drop_column('properties', 'buyer_solicitor_id')
    op.drop_column('properties', 'seller_solicitor_id') 