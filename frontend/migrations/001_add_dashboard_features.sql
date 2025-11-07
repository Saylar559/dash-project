-- ============================================================================
-- МИГРАЦИЯ: Добавление избранного, статистики и аналитики
-- ============================================================================

BEGIN;

-- Добавить новые поля в dashboards
ALTER TABLE dashboards 
ADD COLUMN IF NOT EXISTS category VARCHAR(50),
ADD COLUMN IF NOT EXISTS tags JSONB,
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS unique_viewers INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS rating INTEGER,
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS share_token VARCHAR(64) UNIQUE,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL,
ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES dashboards(id);

-- Изменить тип config на JSONB (если был TEXT)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dashboards' AND column_name = 'config' AND data_type = 'text'
    ) THEN
        ALTER TABLE dashboards ALTER COLUMN config TYPE JSONB USING config::jsonb;
    END IF;
END $$;

-- Создать таблицу избранного
CREATE TABLE IF NOT EXISTS dashboard_favorites (
    dashboard_id INTEGER NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    favorited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    PRIMARY KEY (dashboard_id, user_id)
);

-- Обновить таблицу доступа
ALTER TABLE dashboard_access 
ADD COLUMN IF NOT EXISTS granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
ADD COLUMN IF NOT EXISTS granted_by INTEGER REFERENCES users(id);

-- Создать таблицу истории просмотров
CREATE TABLE IF NOT EXISTS dashboard_views (
    id SERIAL PRIMARY KEY,
    dashboard_id INTEGER NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    duration_seconds INTEGER
);

-- Создать таблицу рейтингов
CREATE TABLE IF NOT EXISTS dashboard_ratings (
    id SERIAL PRIMARY KEY,
    dashboard_id INTEGER NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (dashboard_id, user_id)
);

-- Создать индексы
CREATE INDEX IF NOT EXISTS ix_dashboards_category ON dashboards(category);
CREATE INDEX IF NOT EXISTS ix_dashboards_archived ON dashboards(is_archived);
CREATE INDEX IF NOT EXISTS ix_dashboards_tags_gin ON dashboards USING gin(tags);
CREATE INDEX IF NOT EXISTS ix_dashboards_view_count ON dashboards(view_count DESC);
CREATE INDEX IF NOT EXISTS ix_dashboards_rating ON dashboards(rating DESC);
CREATE INDEX IF NOT EXISTS ix_dashboards_last_viewed ON dashboards(last_viewed_at DESC);

CREATE INDEX IF NOT EXISTS ix_dashboard_views_dashboard_viewed ON dashboard_views(dashboard_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS ix_dashboard_views_user_viewed ON dashboard_views(user_id, viewed_at DESC);

CREATE INDEX IF NOT EXISTS ix_dashboard_favorites_user ON dashboard_favorites(user_id);
CREATE INDEX IF NOT EXISTS ix_dashboard_ratings_dashboard ON dashboard_ratings(dashboard_id);

-- Добавить constraints (с проверкой существования)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_view_count_positive') THEN
        ALTER TABLE dashboards ADD CONSTRAINT check_view_count_positive CHECK (view_count >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_unique_viewers_positive') THEN
        ALTER TABLE dashboards ADD CONSTRAINT check_unique_viewers_positive CHECK (unique_viewers >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_rating_range') THEN
        ALTER TABLE dashboards ADD CONSTRAINT check_rating_range CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_version_positive') THEN
        ALTER TABLE dashboards ADD CONSTRAINT check_version_positive CHECK (version >= 1);
    END IF;
END $$;

COMMIT;
