from alembic import op
import sqlalchemy as sa

def upgrade():
    op.create_table(
        'property_stages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('property_id', sa.Integer(), nullable=False),
        sa.Column('stage', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='pending'),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('start_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('due_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completion_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('responsible', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True)),
        sa.ForeignKeyConstraint(['property_id'], ['properties.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_property_stages_id'), 'property_stages', ['id'], unique=False)

def downgrade():
    op.drop_index(op.f('ix_property_stages_id'), table_name='property_stages')
    op.drop_table('property_stages') 