from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Any
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter()

class SQLExecuteRequest(BaseModel):
    query: str

class SQLExecuteResponse(BaseModel):
    columns: List[str]
    rows: List[List[Any]]
    row_count: int

@router.post("/execute", response_model=SQLExecuteResponse)
def execute_sql_query(
    request: SQLExecuteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Проверка роли
    if current_user.role not in ['ADMIN', 'DEVELOPER']:
        raise HTTPException(status_code=403, detail="Access denied")

    # Безопасность — только SELECT
    q = request.query.strip().lower()
    forbidden = ["drop ", "delete ", "update ", "insert ", "alter ", "create ", "truncate "]
    if not q.startswith("select") or any(f in q for f in forbidden):
        raise HTTPException(status_code=400, detail="Only SELECT queries allowed")

    # Автоматический лимит
    if "limit" not in q:
        request.query += " LIMIT 500"

    try:
        result = db.execute(text(request.query))
        columns = list(result.keys()) if result.keys() else []
        rows = [list(row) for row in result]
        return SQLExecuteResponse(
            columns=columns,
            rows=rows,
            row_count=len(rows)
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Query error: {str(e)}")
