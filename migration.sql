ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS params JSONB DEFAULT '{}'::jsonb;
ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS is_published_temp BOOLEAN;
UPDATE dashboards SET is_published_temp = CASE WHEN is_published IS NULL OR is_published = 0 THEN false ELSE true END;
ALTER TABLE dashboards DROP COLUMN IF EXISTS is_published;
ALTER TABLE dashboards RENAME COLUMN is_published_temp TO is_published;
ALTER TABLE dashboards ALTER COLUMN is_published SET DEFAULT false;
ALTER TABLE dashboards ALTER COLUMN is_published SET NOT NULL;
