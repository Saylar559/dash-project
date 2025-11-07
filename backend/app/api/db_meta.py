from fastapi import APIRouter, Depends
from sqlalchemy import inspect
from app.database import get_db

router = APIRouter(prefix="/api/meta", tags=["Meta"])

@router.get("/tables")
def list_tables(db=Depends(get_db)):
    inspector = inspect(db.bind)
    tables = inspector.get_table_names()
    result = []
    for name in tables:
        columns = inspector.get_columns(name)
        result.append({
            "table_name": name,
            "column_count": len(columns),
            "columns": [col["name"] for col in columns]
        })
    return result
