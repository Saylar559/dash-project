from fastapi import Depends, HTTPException
from app.auth.dependencies import get_current_active_user
from app.models.user import User


def allow_admin(current_user: User = Depends(get_current_active_user)):
    """Только для admin"""
    if current_user.role.value != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


def allow_developer(current_user: User = Depends(get_current_active_user)):
    """Для admin и developer"""
    if current_user.role.value not in ["ADMIN", "DEVELOPER"]:
        raise HTTPException(status_code=403, detail="Developer access required")
    return current_user


def allow_all(current_user: User = Depends(get_current_active_user)):
    """Для всех авторизованных"""
    return current_user
