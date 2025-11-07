CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS dashboards_set_updated_at ON dashboards;
CREATE TRIGGER dashboards_set_updated_at
BEFORE UPDATE ON dashboards
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();


ALTER TABLE dashboards
  ADD COLUMN IF NOT EXISTS config_json JSONB,
  ADD COLUMN IF NOT EXISTS is_published INTEGER NOT NULL DEFAULT 0;
-- при желании «бэкфилл» из текстовой колонки
UPDATE dashboards
SET config_json = COALESCE(config_json, CASE WHEN config IS NULL THEN '{}'::jsonb ELSE config::jsonb END);
