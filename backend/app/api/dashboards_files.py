from fastapi import APIRouter, HTTPException
from pathlib import Path
import json
from datetime import datetime
import os

router = APIRouter(prefix="/api/dashboards-files", tags=["Dashboards Files"])
DASHBOARDS_DIR = Path("dashboards")
DASHBOARDS_DIR.mkdir(exist_ok=True)

# ---------- Utils ----------
def load_dashboard_file(filepath):
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Дашборд не найден")
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Ошибка чтения файла: " + str(e))

def save_dashboard_file(filepath, data):
    # Защита: is_published не должен идти никуда кроме root!
    if isinstance(data, dict) and "config" in data:
        if isinstance(data['config'], dict) and 'is_published' in data['config']:
            del data['config']['is_published']
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Ошибка записи файла: " + str(e))

# ---------- Get All ----------
@router.get("/list")
async def list_dashboards():
    try:
        files = []
        for file in DASHBOARDS_DIR.glob("*.json"):
            data = load_dashboard_file(file)
            files.append({
                'id': file.stem,
                'title': data.get('title', file.stem),
                'description': data.get('description', ''),
                'filename': file.name,
                'created_at': data.get('created_at'),
                'updated_at': data.get('updated_at'),
                'is_published': data.get('is_published', False),
            })
        return sorted(files, key=lambda x: x['updated_at'] or '', reverse=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Ошибка чтения списка: "+str(e))

# ---------- Get One ----------
@router.get("/{dashboard_id}")
async def get_dashboard(dashboard_id: str):
    filepath = DASHBOARDS_DIR / f"{dashboard_id}.json"
    data = load_dashboard_file(filepath)
    if 'is_published' not in data:
        data['is_published'] = False
    return {'id': dashboard_id, **data}

# ---------- Save ----------
@router.post("/save")
async def save_dashboard(dashboard: dict):
    try:
        title = dashboard.get('title', f'Dashboard_{datetime.now().strftime("%Y%m%d_%H%M%S")}')
        dashboard_id = title.lower().replace(' ', '_').replace('/', '_')
        now = datetime.now().isoformat()

        # build safe data
        data = {
            'title': title,
            'description': dashboard.get('description', ''),
            'config': dashboard.get('config', {}),
            'created_at': dashboard.get('created_at', now),
            'updated_at': now,
            'is_published': dashboard.get('is_published', False),
        }
        filepath = DASHBOARDS_DIR / f"{dashboard_id}.json"
        save_dashboard_file(filepath, data)
        return {'id': dashboard_id, 'status': 'saved', 'path': str(filepath)}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Ошибка сохранения: "+str(e))

# ---------- Update (PATCH/PUT: только изменяем нужные поля) ----------
@router.put("/{dashboard_id}")
async def update_dashboard(dashboard_id: str, dashboard: dict):
    filepath = DASHBOARDS_DIR / f"{dashboard_id}.json"
    data = load_dashboard_file(filepath)

    # обновляем только действительно пришедшие ключи
    for key, value in dashboard.items():
        if key not in ("id", "filename", "created_at"):  # не обновлять эти метаданные
            data[key] = value
    data['updated_at'] = datetime.now().isoformat()

    # auto-cleanup: убираем дубль is_published из config если вдруг был
    if isinstance(data, dict) and "config" in data:
        if isinstance(data['config'], dict) and 'is_published' in data['config']:
            del data['config']['is_published']

    save_dashboard_file(filepath, data)
    return {'status': 'updated', 'id': dashboard_id}

# ---------- Delete ----------
@router.delete("/{dashboard_id}")
async def delete_dashboard(dashboard_id: str):
    filepath = DASHBOARDS_DIR / f"{dashboard_id}.json"
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Дашборд не найден")
    try:
        os.remove(filepath)
        return {'status': 'deleted', 'id': dashboard_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Ошибка удаления: " + str(e))

# ---------- Publish/Unpublish ----------
@router.post("/{dashboard_id}/publish")
async def publish_dashboard(dashboard_id: str):
    filepath = DASHBOARDS_DIR / f"{dashboard_id}.json"
    data = load_dashboard_file(filepath)
    data['is_published'] = True
    data['updated_at'] = datetime.now().isoformat()
    # cleanup дубля из config на всякий!
    if isinstance(data.get('config', None), dict) and 'is_published' in data['config']:
        del data['config']['is_published']
    save_dashboard_file(filepath, data)
    return {'status': 'published', 'id': dashboard_id, 'is_published': True}

@router.post("/{dashboard_id}/unpublish")
async def unpublish_dashboard(dashboard_id: str):
    filepath = DASHBOARDS_DIR / f"{dashboard_id}.json"
    data = load_dashboard_file(filepath)
    data['is_published'] = False
    data['updated_at'] = datetime.now().isoformat()
    if isinstance(data.get('config', None), dict) and 'is_published' in data['config']:
        del data['config']['is_published']
    save_dashboard_file(filepath, data)
    return {'status': 'unpublished', 'id': dashboard_id, 'is_published': False}
