from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class SQLExecuteRequest(BaseModel):
    query: str

class SQLResult(BaseModel):
    columns: List[str]
    data: List[Dict[str, Any]]
    row_count: int
