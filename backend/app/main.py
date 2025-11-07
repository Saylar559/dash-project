from contextlib import asynccontextmanager
from typing import List, Optional
import logging
import os
import json
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.api import dashboards_files
from app.database import init_db, SessionLocal
from app.models.user import User, UserRole
from app.auth.jwt import get_password_hash
from app.api.db_meta import router as meta_router
from app.api import auth, users, dashboards, sql_executor, code_executor
from app.api.query import router as query_router

try:
    from app.api import sql_export
    HAS_SQL_EXPORT = True
except Exception:
    HAS_SQL_EXPORT = False

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("app.main")

DASHBOARD_DIR = "dashboards_storage"
os.makedirs(DASHBOARD_DIR, exist_ok=True)

def log_request(request: Request):
    logger.info(f"🌐 {request.method} {request.url}")

def log_error(error: Exception, request: Request):
    logger.error(f"❌ {request.method} {request.url} — {str(error)}")

def ensure_default_users():
    db = SessionLocal()
    try:
        want = ["admin", "developer", "viewer"]
        existing = {u.username for u in db.query(User).filter(User.username.in_(want)).all()}
        to_add: List[User] = []
        if "admin" not in existing:
            to_add.append(User(
                username="admin",
                email="admin@example.com",
                hashed_password=get_password_hash("admin123"),
                role=UserRole.ADMIN,
                is_active=True,
            ))
        if "developer" not in existing:
            to_add.append(User(
                username="developer",
                email="developer@example.com",
                hashed_password=get_password_hash("developer123"),
                role=UserRole.DEVELOPER,
                is_active=True,
            ))
        if hasattr(UserRole, "VIEWER") and "viewer" not in existing:
            to_add.append(User(
                username="viewer",
                email="viewer@example.com",
                hashed_password=get_password_hash("viewer123"),
                role=UserRole.VIEWER,
                is_active=True,
            ))
        if to_add:
            db.add_all(to_add)
            db.commit()
            logger.info(f"✅ Initialized {len(to_add)} default users")
        else:
            logger.info("✅ Default users already exist")
    except Exception as e:
        logger.error(f"❌ Error initializing default users: {e}")
        db.rollback()
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=" * 60)
    logger.info("🚀 Starting Escrow Dashboard API...")
    logger.info("=" * 60)
    try:
        init_db()
        logger.info("✅ Database tables created")
        ensure_default_users()
        logger.info("✅ Default users initialized")
    except Exception as e:
        logger.error(f"❌ Startup error: {e}")
        raise
    yield
    logger.info("🛑 Shutting down Escrow Dashboard API...")

app = FastAPI(
    title="Escrow Dashboard API",
    description="API для управления дашбордами и эскроу-аккаунтами",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
logger.info("✅ CORS enabled for all origins")

routers = [
    (auth.router, "Auth"),
    (users.router, "Users"),
    (dashboards.router, "Dashboards"),
    (sql_executor.router, "SQL Executor"),
    (code_executor.router, "Code Executor"),
    (meta_router, "Meta (DB Structure)"),
    (query_router, "Query"),
]
if HAS_SQL_EXPORT:
    routers.append((sql_export.router, "SQL Export"))

for router, name in routers:
    try:
        app.include_router(router)
        logger.info(f"✅ {name} router registered")
    except Exception as e:
        logger.error(f"❌ Failed to register {name} router: {e}")

@app.middleware("http")
async def log_middleware(request: Request, call_next):
    log_request(request)
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        log_error(e, request)
        return JSONResponse({"detail": str(e)}, status_code=500)

@app.get("/health")
async def health_check():
    logger.info("📟 Health check requested")
    return {
        "status": "healthy",
        "service": app.title,
        "version": app.version
    }

@app.get("/")
async def root():
    logger.info("🏠 Root endpoint accessed")
    return {
        "message": app.title,
        "version": app.version,
        "docs": app.docs_url,
        "health": "/health",
        "endpoints": {
            "auth": "/api/auth",
            "users": "/api/users",
            "dashboards": "/api/dashboards",
            "sql": "/api/sql",
            "code": "/api/code",
            "meta": "/api/meta/tables",
            "query": "/api/query",
            "export": "/api/export" if HAS_SQL_EXPORT else None,
            "dashboard_files_list": "/api/dashboard/files",
            "dashboard_files_save": "/api/dashboard/files/save",
            "dashboard_files_get": "/api/dashboard/files/load/{filename}",
        }
    }

@app.on_event("startup")
async def startup_info():
    logger.info("=" * 60)
    logger.info("🚀 Escrow Dashboard API Started Successfully")
    logger.info(f"📡 API Documentation: http://localhost:8000/docs")
    logger.info(f"🔍 Health Check: http://localhost:8000/health")
    logger.info(f"👤 Default Users: admin / admin123, developer / developer123"
                + (", viewer / viewer123" if hasattr(UserRole, "VIEWER") else ""))
    logger.info("=" * 60)

# --- DASHBOARD FILE STORAGE API ---
@app.post("/api/dashboard/files/save", tags=["Dashboard Files"])
async def save_dashboard_file(name: str, content: dict):
    """Сохранить дашборд в файл (JSON)"""
    if not name.endswith(".json"): 
        name += ".json"
    path = os.path.join(DASHBOARD_DIR, name)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(content, f, ensure_ascii=False, indent=2)
    logger.info(f"✅ Dashboard saved: {name}")
    return {"status": "saved", "file": name}

@app.get("/api/dashboard/files", tags=["Dashboard Files"])
async def list_dashboard_files():
    """Список всех файлов дашбордов"""
    files = [f for f in os.listdir(DASHBOARD_DIR) if f.endswith(".json")]
    return {"files": files}

@app.get("/api/dashboard/files/load/{filename}", tags=["Dashboard Files"])
async def get_dashboard_file(filename: str):
    """Получить содержимое дашборда по имени файла"""
    path = os.path.join(DASHBOARD_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")
    with open(path, "r", encoding="utf-8") as f:
        content = json.load(f)
    return {"filename": filename, "content": content}

app.include_router(dashboards_files.router)