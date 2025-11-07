# backend/app/api/sql_executor.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
import re
import logging

from app.database import get_db
from app.models.user import User
from app.schemas.sql import SQLExecuteRequest, SQLResult
from app.auth.dependencies import get_current_active_user


# Настройка логирования
logger = logging.getLogger(__name__)

# Роутер с префиксом
router = APIRouter(prefix="/api/sql", tags=["SQL Executor"])


# Расширенный blacklist опасных функций для роли разработчика
DANGEROUS_FUNCS = {
    "pg_sleep", "pg_terminate_backend", "pg_cancel_backend",
    "pg_read_file", "pg_write_file", "pg_ls_dir",
    "lo_import", "lo_export", "lo_create", "lo_unlink",
    "current_setting", "dblink", "dblink_connect", "dblink_exec",
    "pg_reload_conf", "pg_rotate_logfile", "copy", "pg_read_binary_file"
}


def normalize_sql_start(q: str) -> str:
    """
    Удаление лидирующих комментариев/пробелов, поддержка начала с WITH
    """
    if not q:
        return ""
    
    s = q.lstrip()
    
    # Убрать ведущие многострочные комментарии
    s = re.sub(r"^\s*/\*.*?\*/\s*", "", s, flags=re.DOTALL)
    
    # Убрать ведущие построчные комментарии и пустые строки
    lines = s.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i]
        if not line.strip() or line.lstrip().startswith("--"):
            i += 1
            continue
        break
    
    s = "\n".join(lines[i:]).lstrip()
    return s


def ensure_default_params(raw_params: dict | None) -> dict:
    """
    Гарантировать дефолтные значения для bind-параметров
    """
    params = (raw_params or {}).copy()
    
    # Если параметр не передан — применяем NULL (None)
    params.setdefault("p_date_from", None)
    params.setdefault("p_date_to", None)
    params.setdefault("p_object_id", None)
    
    return params


# ========================================
# НОВЫЙ ЭНДПОИНТ: Получить список таблиц
# ========================================

@router.get("/tables")
async def get_database_tables(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Получить список всех таблиц базы данных с количеством колонок.
    Доступно только для ADMIN и DEVELOPER.
    """
    # Проверка прав доступа
    if current_user.role.value not in ["ADMIN", "DEVELOPER"]:
        raise HTTPException(
            status_code=403,
            detail="Only admin and developer can view database tables"
        )
    
    try:
        # Запрос к PostgreSQL information_schema
        query = text("""
            SELECT 
                t.table_name,
                COUNT(c.column_name)::text as column_count
            FROM information_schema.tables t
            LEFT JOIN information_schema.columns c 
                ON t.table_name = c.table_name 
                AND t.table_schema = c.table_schema
            WHERE t.table_schema = 'public'
            GROUP BY t.table_name
            ORDER BY t.table_name
        """)
        
        result = db.execute(query)
        tables = [
            {
                "table_name": row[0],
                "column_count": row[1]
            }
            for row in result
        ]
        
        logger.info(f"User {current_user.username} fetched {len(tables)} tables")
        
        return {"tables": tables}
    
    except Exception as e:
        logger.error(f"Error fetching tables: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )


# ========================================
# ОСНОВНОЙ ЭНДПОИНТ: Выполнить SQL запрос
# ========================================

@router.post("/execute", response_model=SQLResult)
async def execute_sql(
    request: SQLExecuteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Выполнить SQL запрос с ролевыми ограничениями:
    
    - **ADMIN**: Полный доступ ко всем операциям
    - **DEVELOPER**: Только SELECT/WITH (read-only)
    - **VIEWER**: Запрещено
    
    Поддерживает параметризованные запросы с bind-параметрами.
    """
    
    # Проверка прав доступа
    if current_user.role.value not in ["ADMIN", "DEVELOPER"]:
        raise HTTPException(
            status_code=403,
            detail="Only admin and developer can execute SQL queries"
        )
    
    raw_sql = request.query or ""
    
    if not raw_sql.strip():
        raise HTTPException(
            status_code=400,
            detail="SQL query cannot be empty"
        )
    
    # Нормализуем начало, чтобы разрешить комментарии и WITH
    norm = normalize_sql_start(raw_sql)
    upper_prefix = norm[:8].upper()  # достаточно для SELECT/WITH
    
    # Параметры запроса (могут прийти из клиента)
    params = ensure_default_params(getattr(request, "params", None))
    
    # ========================================
    # DEVELOPER: Только read-only запросы
    # ========================================
    
    if current_user.role.value == "DEVELOPER":
        # Разрешаем SELECT и WITH
        if not (upper_prefix.startswith("SELECT") or upper_prefix.startswith("WITH")):
            raise HTTPException(
                status_code=403,
                detail="Developer can only execute read-only queries (SELECT/WITH)"
            )
        
        # Блокируем опасные функции
        low = raw_sql.lower()
        for danger in DANGEROUS_FUNCS:
            if danger in low:
                raise HTTPException(
                    status_code=403,
                    detail=f"Function '{danger}' is not allowed for developer role"
                )
        
        # Локальный таймаут запроса, чтобы не зависал бэкенд
        try:
            db.execute(text("SET LOCAL statement_timeout = '30s'"))
        except Exception as e:
            logger.warning(f"Failed to set statement timeout: {e}")
    
    # ========================================
    # Выполнение запроса
    # ========================================
    
    try:
        # Ограничим объём результата, чтобы не уронить фронт
        MAX_ROWS = 10000
        
        # Логирование запроса
        logger.info(f"User {current_user.username} executing query: {raw_sql[:100]}...")
        
        # Выполняем параметризованно
        result = db.execute(text(raw_sql), params)
        
        if result.returns_rows:
            rows = result.fetchmany(MAX_ROWS + 1)
            columns = list(result.keys()) if rows else list(result.keys())
            
            # Преобразуем строки в словари
            data = [dict(zip(columns, row)) for row in rows[:MAX_ROWS]]
            
            # Проверка на обрезку результата
            is_truncated = len(rows) > MAX_ROWS
            
            if is_truncated:
                logger.warning(f"Query result truncated to {MAX_ROWS} rows")
            
            return SQLResult(
                columns=columns,
                data=data,
                row_count=len(data)
            )
        
        else:
            # Не-SELECT операции допустимы только для admin
            if current_user.role.value != "ADMIN":
                raise HTTPException(
                    status_code=403,
                    detail="Developer cannot modify data"
                )
            
            db.commit()
            
            return SQLResult(
                columns=["status"],
                data=[{"status": "success"}],
                row_count=getattr(result, "rowcount", 0)
            )
    
    except HTTPException:
        raise
    
    except Exception as e:
        db.rollback()
        msg = str(e)
        ml = msg.lower()
        
        # Дружелюбные сообщения об ошибках
        if "syntax error" in ml:
            raise HTTPException(
                status_code=400,
                detail=f"SQL Syntax Error: {msg}"
            )
        
        if "permission denied" in ml:
            raise HTTPException(
                status_code=403,
                detail=f"Permission denied: {msg}"
            )
        
        if "does not exist" in ml:
            raise HTTPException(
                status_code=404,
                detail=f"Table or column not found: {msg}"
            )
        
        if "statement timeout" in ml or "timeout" in ml:
            raise HTTPException(
                status_code=408,
                detail="Query timeout (30s) exceeded"
            )
        
        if "value is required for bind parameter" in ml:
            raise HTTPException(
                status_code=400,
                detail="Missing query parameter. Ensure params include p_date_from, p_date_to, p_object_id (use null if not needed)."
            )
        
        # Общая ошибка
        logger.error(f"SQL execution error: {msg}")
        raise HTTPException(
            status_code=400,
            detail=f"Database error: {msg}"
        )
