from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db

router = APIRouter(prefix="/api/query", tags=["Query"])

MAX_ROWS = 500

def is_sql_safe(query: str) -> bool:
    """Разрешает ТОЛЬКО безопасные SELECT-запросы (без опасных операций)"""
    q = query.strip().lower()
    forbidden = ["drop ", "delete ", "update ", "insert ", "alter ", "create ", "truncate "]
    return q.startswith("select") and not any(f in q for f in forbidden)

@router.post("/")
async def execute_sql(
    payload: dict = Body(...), db: Session = Depends(get_db)
):
    query = payload.get("query")
    params = payload.get("params", {})
    if not query or not isinstance(query, str):
        raise HTTPException(status_code=422, detail="Query must be a non-empty string.")
    if not is_sql_safe(query):
        raise HTTPException(status_code=400, detail="Only safe SELECT queries allowed.")

    # Добавим автоматический LIMIT, если не указан
    query_low = query.lower()
    if "select" in query_low and "limit" not in query_low:
        query += f" LIMIT {MAX_ROWS}"

    try:
        result = db.execute(text(query), params)
        columns = list(result.keys())
        # КОРРЕКТНОЕ получение словаря:
        data = [dict(zip(columns, row)) for row in result]
        return {
            "columns": columns,
            "data": data,
            "row_count": len(data),
            "query": query
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"SQL error: {str(e)}")
