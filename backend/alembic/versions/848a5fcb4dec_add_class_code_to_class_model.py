"""Add class_code to Class model

Revision ID: 848a5fcb4dec
Revises: 4c7bc4df6a8e
Create Date: 2025-11-22 02:47:37.426789

"""
from alembic import op
import sqlalchemy as sa
import random
import string


# revision identifiers, used by Alembic.
revision = '848a5fcb4dec'
down_revision = '4c7bc4df6a8e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add the column as nullable first
    op.add_column('class', sa.Column('class_code', sa.String(), nullable=True))
    
    # 2. Data migration: Populate class_code for existing rows
    bind = op.get_bind()
    session = sa.orm.Session(bind=bind)
    
    # Get all class IDs
    result = session.execute(sa.text("SELECT id FROM class"))
    classes = result.fetchall()
    
    for cls in classes:
        # Generate random 6-char code
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        # Update
        session.execute(
            sa.text("UPDATE class SET class_code = :code WHERE id = :id"),
            {"code": code, "id": cls.id}
        )
    session.commit()

    # 3. Set not null and add constraints
    op.alter_column('class', 'class_code',
               existing_type=sa.VARCHAR(),
               nullable=False)
    
    op.create_index(op.f('ix_class_class_code'), 'class', ['class_code'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_class_class_code'), table_name='class')
    op.drop_column('class', 'class_code')
