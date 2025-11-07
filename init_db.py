#!/usr/bin/env python3
"""
Database Initialization Script
Создает все таблицы и тестовые данные
"""

import sys
import logging
import os
from pathlib import Path

# Добавляем корневую директорию в PYTHONPATH
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import create_engine, text

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s: %(message)s'
)
logger = logging.getLogger(__name__)

def get_database_url():
    """Получить DATABASE_URL из переменных окружения или config"""
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        host = os.getenv("POSTGRES_HOST", "postgres")
        port = os.getenv("POSTGRES_PORT", "5432")
        user = os.getenv("POSTGRES_USER", "postgres")
        password = os.getenv("POSTGRES_PASSWORD", "postgres")
        db = os.getenv("POSTGRES_DB", "escrow_dashboard")
        db_url = f"postgresql://{user}:{password}@{host}:{port}/{db}"
    return db_url

def create_all_tables_sql():
    """Создать все таблицы через SQL (включая M2M и дополнительные)"""
    sql_statements = [
        # DROP EXISTING TABLES
        """
        DROP TABLE IF EXISTS dashboard_ratings CASCADE;
        DROP TABLE IF EXISTS dashboard_views CASCADE;
        DROP TABLE IF EXISTS dashboard_favorites CASCADE;
        DROP TABLE IF EXISTS dashboard_access CASCADE;
        DROP TABLE IF EXISTS dashboards CASCADE;
        DROP TABLE IF EXISTS users CASCADE;
        """,
        # TABLE: users
        """
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            hashed_password VARCHAR(255) NOT NULL,
            role VARCHAR(20) NOT NULL DEFAULT 'USER',
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            last_login TIMESTAMP WITH TIME ZONE,
            CONSTRAINT check_role CHECK (role IN ('ADMIN', 'DEVELOPER', 'ACCOUNTANT', 'USER'))
        );
        """,
        """
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
        CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
        """,
        # TABLE: dashboards
        """
        CREATE TABLE IF NOT EXISTS dashboards (
            id SERIAL PRIMARY KEY,
            title VARCHAR(200) NOT NULL,
            description TEXT,
            category VARCHAR(50),
            tags TEXT[],
            sql_query TEXT,
            params JSONB DEFAULT '{}'::jsonb,
            code TEXT,
            config JSONB,
            created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            is_published BOOLEAN NOT NULL DEFAULT FALSE,
            saved BOOLEAN NOT NULL DEFAULT TRUE,
            is_archived BOOLEAN NOT NULL DEFAULT FALSE,
            view_count INTEGER NOT NULL DEFAULT 0,
            last_viewed_at TIMESTAMP WITH TIME ZONE,
            unique_viewers INTEGER NOT NULL DEFAULT 0,
            rating NUMERIC(3,2) CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
            rating_count INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            published_at TIMESTAMP WITH TIME ZONE,
            archived_at TIMESTAMP WITH TIME ZONE,
            share_token VARCHAR(64) UNIQUE,
            is_public BOOLEAN NOT NULL DEFAULT FALSE,
            version INTEGER NOT NULL DEFAULT 1,
            parent_id INTEGER REFERENCES dashboards(id) ON DELETE SET NULL,
            CONSTRAINT check_view_count_positive CHECK (view_count >= 0),
            CONSTRAINT check_unique_viewers_positive CHECK (unique_viewers >= 0),
            CONSTRAINT check_version_positive CHECK (version >= 1)
        );
        """,
        """
        CREATE INDEX IF NOT EXISTS idx_dashboards_title ON dashboards(title);
        CREATE INDEX IF NOT EXISTS idx_dashboards_created_by ON dashboards(created_by);
        CREATE INDEX IF NOT EXISTS idx_dashboards_published ON dashboards(is_published);
        CREATE INDEX IF NOT EXISTS idx_dashboards_archived ON dashboards(is_archived);
        CREATE INDEX IF NOT EXISTS idx_dashboards_category ON dashboards(category);
        CREATE INDEX IF NOT EXISTS idx_dashboards_view_count ON dashboards(view_count DESC);
        CREATE INDEX IF NOT EXISTS idx_dashboards_rating ON dashboards(rating DESC);
        CREATE INDEX IF NOT EXISTS idx_dashboards_last_viewed ON dashboards(last_viewed_at DESC);
        """,
        # TABLE: dashboard_access (M2M: доступ к дашбордам)
        """
        CREATE TABLE IF NOT EXISTS dashboard_access (
            dashboard_id INTEGER NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            granted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            PRIMARY KEY (dashboard_id, user_id)
        );
        """,
        """
        CREATE INDEX IF NOT EXISTS idx_dashboard_access_user ON dashboard_access(user_id);
        CREATE INDEX IF NOT EXISTS idx_dashboard_access_granted_at ON dashboard_access(granted_at DESC);
        """,
        # TABLE: dashboard_favorites (M2M: избранные дашборды)
        """
        CREATE TABLE IF NOT EXISTS dashboard_favorites (
            dashboard_id INTEGER NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            favorited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            PRIMARY KEY (dashboard_id, user_id)
        );
        """,
        """
        CREATE INDEX IF NOT EXISTS idx_dashboard_favorites_user ON dashboard_favorites(user_id);
        CREATE INDEX IF NOT EXISTS idx_dashboard_favorites_added ON dashboard_favorites(favorited_at DESC);
        """,
        # TABLE: dashboard_views (история просмотров)
        """
        CREATE TABLE IF NOT EXISTS dashboard_views (
            id SERIAL PRIMARY KEY,
            dashboard_id INTEGER NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            ip_address VARCHAR(45),
            user_agent TEXT,
            viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            duration_seconds INTEGER
        );
        """,
        """
        CREATE INDEX IF NOT EXISTS idx_dashboard_views_dashboard ON dashboard_views(dashboard_id);
        CREATE INDEX IF NOT EXISTS idx_dashboard_views_user ON dashboard_views(user_id);
        CREATE INDEX IF NOT EXISTS idx_dashboard_views_viewed_at ON dashboard_views(viewed_at DESC);
        """,
        # TABLE: dashboard_ratings (рейтинги)
        """
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
        """,
        """
        CREATE INDEX IF NOT EXISTS idx_dashboard_ratings_dashboard ON dashboard_ratings(dashboard_id);
        CREATE INDEX IF NOT EXISTS idx_dashboard_ratings_user ON dashboard_ratings(user_id);
        """
    ]
    return sql_statements

def main():
    db_url = get_database_url()
    engine = create_engine(db_url)
    with engine.connect() as conn:
        for sql in create_all_tables_sql():
            logger.info("Выполняю SQL: %s", sql[:120].replace('\n', ' '))
            conn.execute(text(sql))
    logger.info("✔️ Все таблицы и индексы успешно созданы!")

if __name__ == "__main__":
    main()
