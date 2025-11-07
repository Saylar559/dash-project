-- УДАЛЕНИЕ (всё сотрёт в dashboards!)
DROP TABLE IF EXISTS dashboard_access CASCADE;
DROP TABLE IF EXISTS dashboards CASCADE;

-- СОЗДАНИЕ dashboards
CREATE TABLE dashboards (
  id           SERIAL PRIMARY KEY,
  title        VARCHAR(200) NOT NULL,
  description  TEXT NULL,
  sql_query    TEXT NULL,
  config       JSONB NOT NULL DEFAULT '{}'::jsonb,
  visibility   VARCHAR(16) NOT NULL DEFAULT 'private',
  created_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  version      INTEGER NOT NULL DEFAULT 1,
  archived     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- совместимость
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  config_json  JSONB NULL
);

CREATE INDEX idx_dashboards_visibility  ON dashboards(visibility);
CREATE INDEX idx_dashboards_created_by  ON dashboards(created_by);
CREATE INDEX idx_dashboards_archived    ON dashboards(archived);
CREATE INDEX idx_dashboards_config_gin  ON dashboards USING GIN (config);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_dashboards_updated_at ON dashboards;
CREATE TRIGGER trg_dashboards_updated_at
BEFORE UPDATE ON dashboards
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

UPDATE dashboards SET config_json = config WHERE config_json IS NULL;

-- M2M для адресного доступа (если используете allowed_users)
CREATE TABLE IF NOT EXISTS dashboard_access (
  dashboard_id INTEGER NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
  user_id      INTEGER NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
  PRIMARY KEY (dashboard_id, user_id)
);
ALTER TABLE dashboards
  ADD COLUMN IF NOT EXISTS config_json JSONB,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT FALSE;
