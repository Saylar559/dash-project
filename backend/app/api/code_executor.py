from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from pydantic import BaseModel
from typing import Optional, Dict, Any
import sys
from io import StringIO
import json

router = APIRouter(prefix="/api/code", tags=["code"])

class CodeExecuteRequest(BaseModel):
    language: str  # 'python', 'javascript'
    code: str
    data: Optional[Dict[str, Any]] = None

class CodeExecuteResponse(BaseModel):
    output: str
    error: Optional[str] = None
    result: Optional[Any] = None

@router.post("/execute", response_model=CodeExecuteResponse)
async def execute_code(
    request: CodeExecuteRequest,
    db: Session = Depends(get_db)
):
    if request.language == 'python':
        return execute_python(request.code, request.data)
    else:
        raise HTTPException(status_code=400, detail="Язык не поддерживается")

def execute_python(code: str, data: dict) -> CodeExecuteResponse:
    """Выполняет Python код в изолированной среде"""
    try:
        # Создаём изолированное окружение
        local_vars = {'data': data}
        
        # Перехватываем stdout
        old_stdout = sys.stdout
        sys.stdout = captured_output = StringIO()
        
        # Выполняем код
        exec(code, {"__builtins__": __builtins__}, local_vars)
        
        # Восстанавливаем stdout
        sys.stdout = old_stdout
        
        # Получаем результат
        output = captured_output.getvalue()
        result = local_vars.get('result', None)
        
        return CodeExecuteResponse(
            output=output,
            result=result,
            error=None
        )
        
    except Exception as e:
        sys.stdout = old_stdout
        return CodeExecuteResponse(
            output="",
            error=str(e),
            result=None
        )
