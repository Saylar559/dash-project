from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.dashboard import Dashboard  # Только Dashboard! Без DashboardWidget
from app.models.user import User
from app.auth.jwt import get_current_user
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json

router = APIRouter(prefix="/api/dashboards", tags=["Dashboards"])

# ============ Schemas ============
class WidgetConfig(BaseModel):
    id: str
    type: str
    name: Optional[str]
    props: dict

class LayoutItem(BaseModel):
    widgetId: str
    x: int
    y: int
    w: int
    h: int

class DashboardCreate(BaseModel):
    title: str
    description: Optional[str]
    config: dict

class DashboardUpdate(BaseModel):
    title: Optional[str]
    description: Optional[str]
    config: dict
    is_published: Optional[bool]

class DashboardResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    config: dict
    is_published: bool
    created_at: datetime
    updated_at: datetime
    owner_id: int

    class Config:
        from_attributes = True

# ============ Endpoints ============

@router.get("/", response_model=List[DashboardResponse])
async def list_dashboards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить все дашборды пользователя"""
    dashboards = db.query(Dashboard).filter(
        Dashboard.owner_id == current_user.id
    ).order_by(Dashboard.updated_at.desc()).all()
    return [
        {
            **dashboard.__dict__,
            "config": json.loads(dashboard.config) if isinstance(dashboard.config, str) else dashboard.config
        }
        for dashboard in dashboards
    ]

@router.get("/{dashboard_id}", response_model=DashboardResponse)
async def get_dashboard(
    dashboard_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить дашборд по ID"""
    dashboard = db.query(Dashboard).filter(
        Dashboard.id == dashboard_id,
        Dashboard.owner_id == current_user.id
    ).first()
    if not dashboard:
        raise HTTPException(status_code=404, detail="Дашборд не найден")
    return {
        **dashboard.__dict__,
        "config": json.loads(dashboard.config) if isinstance(dashboard.config, str) else dashboard.config
    }

@router.post("/", response_model=DashboardResponse)
async def create_dashboard(
    dashboard_data: DashboardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать новый дашборд"""
    try:
        dashboard = Dashboard(
            title=dashboard_data.title,
            description=dashboard_data.description or "Создан в конструкторе",
            config=json.dumps(dashboard_data.config),
            owner_id=current_user.id,
            is_published=False,
        )
        db.add(dashboard)
        db.commit()
        db.refresh(dashboard)
        return {
            **dashboard.__dict__,
            "config": json.loads(dashboard.config)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{dashboard_id}", response_model=DashboardResponse)
async def update_dashboard(
    dashboard_id: int,
    dashboard_data: DashboardUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновить дашборд"""
    dashboard = db.query(Dashboard).filter(
        Dashboard.id == dashboard_id,
        Dashboard.owner_id == current_user.id
    ).first()
    if not dashboard:
        raise HTTPException(status_code=404, detail="Дашборд не найден")
    try:
        if dashboard_data.title:
            dashboard.title = dashboard_data.title
        if dashboard_data.description:
            dashboard.description = dashboard_data.description
        if dashboard_data.config:
            dashboard.config = json.dumps(dashboard_data.config)
        if dashboard_data.is_published is not None:
            dashboard.is_published = dashboard_data.is_published
        dashboard.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(dashboard)
        return {
            **dashboard.__dict__,
            "config": json.loads(dashboard.config)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{dashboard_id}")
async def delete_dashboard(
    dashboard_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удалить дашборд"""
    dashboard = db.query(Dashboard).filter(
        Dashboard.id == dashboard_id,
        Dashboard.owner_id == current_user.id
    ).first()
    if not dashboard:
        raise HTTPException(status_code=404, detail="Дашборд не найден")
    try:
        db.delete(dashboard)
        db.commit()
        return {"status": "deleted", "id": dashboard_id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{dashboard_id}/publish")
async def publish_dashboard(
    dashboard_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Опубликовать дашборд"""
    dashboard = db.query(Dashboard).filter(
        Dashboard.id == dashboard_id,
        Dashboard.owner_id == current_user.id
    ).first()
    if not dashboard:
        raise HTTPException(status_code=404, detail="Дашборд не найден")
    dashboard.is_published = True
    dashboard.updated_at = datetime.utcnow()
    db.commit()
    return {"status": "published", "id": dashboard_id}

@router.post("/{dashboard_id}/unpublish")
async def unpublish_dashboard(
    dashboard_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Снять с публикации"""
    dashboard = db.query(Dashboard).filter(
        Dashboard.id == dashboard_id,
        Dashboard.owner_id == current_user.id
    ).first()
    if not dashboard:
        raise HTTPException(status_code=404, detail="Дашборд не найден")
    dashboard.is_published = False
    dashboard.updated_at = datetime.utcnow()
    db.commit()
    return {"status": "unpublished", "id": dashboard_id}
