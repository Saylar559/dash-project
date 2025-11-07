from typing import Optional, Any, Dict, List
from datetime import datetime
from pydantic import BaseModel, Field

class DashboardCreate(BaseModel):
    title: str
    description: Optional[str] = None
    config: Optional[Dict[str, Any]] = None    # Универсальный layout, JSONB (arr виджетов, filters, layout, sources)
    sql_query: Optional[str] = None            # Поддержка "чистых" SQL дашбордов
    code: Optional[str] = None                 # React-код или другой шаблон компонента (как строка с функцией)
    params: Optional[Dict[str, Any]] = None    # Параметры для SQL (передаются в text(sql), без конкатенации)
    tags: Optional[List[str]] = None           # Для фильтрации, поиска, группировки
    category: Optional[str] = None             # Класс/группа дашборда
    saved: bool = Field(default=True)          # Пометка-черновик ("сохранил")
    is_published: bool = Field(default=False)  # Статус публикации

class DashboardUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    sql_query: Optional[str] = None
    code: Optional[str] = None
    params: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    category: Optional[str] = None
    saved: Optional[bool] = None
    is_published: Optional[bool] = None

class DashboardResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    config: Optional[Dict[str, Any]]
    sql_query: Optional[str]
    code: Optional[str]
    params: Optional[Dict[str, Any]]
    tags: Optional[List[str]] = None
    category: Optional[str] = None
    saved: bool
    is_published: bool
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
        orm_mode = True
