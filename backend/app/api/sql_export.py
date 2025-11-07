# app/api/sql_export.py — обновите обработчик
from datetime import datetime, timezone, date
from decimal import Decimal
from uuid import UUID
import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from io import BytesIO
from openpyxl import Workbook
from typing import Any, Dict
from app.database import get_db
from app.auth.dependencies import get_current_active_user

router = APIRouter(prefix="/api/sql", tags=["sql"])

def normalize_cell(v: Any) -> Any:
    if isinstance(v, datetime):
        # приводим к naive (Excel не поддерживает tz)
        return v.astimezone(timezone.utc).replace(tzinfo=None) if v.tzinfo else v  # naive ok
    if isinstance(v, date):
        return v  # даты поддерживаются
    if isinstance(v, Decimal):
        return float(v)
    if isinstance(v, (dict, list)):
        return json.dumps(v, ensure_ascii=False)
    if isinstance(v, (UUID, bytes)):
        return str(v)
    return v

@router.post("/export")
def export_sql(body: Dict[str, Any], db: Session = Depends(get_db), user=Depends(get_current_active_user)):
    sql = (body.get("sql") or "").strip()
    params = body.get("params") or {}
    if not sql.lower().startswith("select"):
        raise HTTPException(status_code=400, detail="Only SELECT is allowed for export")
    if ";" in sql:
        raise HTTPException(status_code=400, detail="Single SELECT statement only")

    rows = db.execute(text(sql), params).mappings().all()  # list of row mappings
    wb = Workbook()
    ws = wb.active
    ws.title = "data"
    if rows:
        headers = list(rows[0].keys())
        ws.append(headers)
        for r in rows:
            ws.append([normalize_cell(r.get(h)) for h in headers])

    stream = BytesIO()
    wb.save(stream)
    stream.seek(0)
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename=\"export.xlsx\"'}
    )
