# alembic/versions/xxxx_add_dashboard_fields.py
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "xxxx_add_dashboard_fields"
down_revision = "<prev>"

def upgrade():
    op.add_column("dashboards", sa.Column("sql_query", sa.Text(), nullable=True))
    op.add_column("dashboards", sa.Column("params", postgresql.JSONB(), nullable=True, server_default=sa.text("'{}'::jsonb")))
    op.add_column("dashboards", sa.Column("code", sa.Text(), nullable=True))
    op.add_column("dashboards", sa.Column("config", postgresql.JSONB(), nullable=True, server_default=sa.text("'{}'::jsonb")))
    op.add_column("dashboards", sa.Column("saved", sa.Boolean(), nullable=False, server_default=sa.text("false")))
    op.add_column("dashboards", sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.text("false")))

def downgrade():
    op.drop_column("dashboards", "is_published")
    op.drop_column("dashboards", "saved")
    op.drop_column("dashboards", "config")
    op.drop_column("dashboards", "code")
    op.drop_column("dashboards", "params")
    op.drop_column("dashboards", "sql_query")
