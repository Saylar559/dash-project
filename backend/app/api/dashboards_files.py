from fastapi import APIRouter, HTTPException
from pathlib import Path
import json
from datetime import datetime
import os

router = APIRouter(prefix="/api/dashboards-files", tags=["Dashboards Files"])

# Папка где хранятся дашборды
DASHBOARDS_DIR = Path("dashboards")  # или Path("/home/user/dashboards")
DASHBOARDS_DIR.mkdir(exist_ok=True)

# ============ Get All ============
@router.get("/list")
async def list_dashboards():
    """Список всех дашбордов из папки"""
    try:
        files = []
        for file in DASHBOARDS_DIR.glob("*.json"):
            with open(file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                files.append({
                    'id': file.stem,
                    'title': data.get('title', file.stem),
                    'description': data.get('description', ''),
                    'filename': file.name,
                    'created_at': data.get('created_at'),
                    'updated_at': data.get('updated_at'),
                })
        return sorted(files, key=lambda x: x['updated_at'], reverse=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============ Get One ============
@router.get("/{dashboard_id}")
async def get_dashboard(dashboard_id: str):
    """Получить дашборд по ID"""
    try:
        filepath = DASHBOARDS_DIR / f"{dashboard_id}.json"
        if not filepath.exists():
            raise HTTPException(status_code=404, detail="Дашборд не найден")
        
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return {
                'id': dashboard_id,
                **data
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============ Save ============
@router.post("/save")
async def save_dashboard(dashboard: dict):
    """Сохранить дашборд"""
    try:
        title = dashboard.get('title', f'Dashboard_{datetime.now().strftime("%Y%m%d_%H%M%S")}')
        dashboard_id = title.lower().replace(' ', '_').replace('/', '_')
        
        data = {
            'title': title,
            'description': dashboard.get('description', ''),
            'config': dashboard.get('config', {}),
            'created_at': dashboard.get('created_at', datetime.now().isoformat()),
            'updated_at': datetime.now().isoformat(),
        }
        
        filepath = DASHBOARDS_DIR / f"{dashboard_id}.json"
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        return {
            'id': dashboard_id,
            'status': 'saved',
            'path': str(filepath),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============ Update ============
@router.put("/{dashboard_id}")
async def update_dashboard(dashboard_id: str, dashboard: dict):
    """Обновить дашборд"""
    try:
        filepath = DASHBOARDS_DIR / f"{dashboard_id}.json"
        if not filepath.exists():
            raise HTTPException(status_code=404, detail="Дашборд не найден")
        
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        data.update({
            'title': dashboard.get('title', data['title']),
            'description': dashboard.get('description', data['description']),
            'config': dashboard.get('config', data['config']),
            'updated_at': datetime.now().isoformat(),
        })
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        return {'status': 'updated', 'id': dashboard_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============ Delete ============
@router.delete("/{dashboard_id}")
async def delete_dashboard(dashboard_id: str):
    """Удалить дашборд"""
    try:
        filepath = DASHBOARDS_DIR / f"{dashboard_id}.json"
        if not filepath.exists():
            raise HTTPException(status_code=404, detail="Дашборд не найден")
        
        os.remove(filepath)
        return {'status': 'deleted', 'id': dashboard_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
