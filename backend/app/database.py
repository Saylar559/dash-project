from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Поддержка асинхронного подключения (если понадобится для FastAPI)
# from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

# Основные настройки
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Вариант для работы с Alembic — миграции не должны использовать init_db напрямую!
def init_db():
    # Важно: Импортировать все модели перед созданием схемы
    import app.models.user
    import app.models.dashboard
    # Если добавишь новые — не забудь добавить импорт!
    Base.metadata.create_all(bind=engine)

# Советы и расширения:
# - Для unit-тестов можешь использовать тестовый SQLite engine
# - Если будешь мигрировать асинхронно — используй create_async_engine
# - Для Alembic: настройки для env.py — должен видеть Base и engine
