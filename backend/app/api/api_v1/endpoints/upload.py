from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import List
import shutil
import os
from pathlib import Path
from app import models, schemas
from app.api import deps
from app.core.config import settings

router = APIRouter()

UPLOAD_DIR = Path("static/avatars")
DEFAULTS_DIR = UPLOAD_DIR / "defaults"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
DEFAULTS_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/avatar", response_model=schemas.User)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: models.User = Depends(deps.get_current_active_user),
    db = Depends(deps.get_db)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Create unique filename
    filename = f"user_{current_user.id}_{file.filename}"
    file_path = UPLOAD_DIR / filename
    
    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Could not save file")
        
    # Update user avatar_url
    # URL should be relative to static mount, e.g., /static/avatars/filename
    avatar_url = f"/static/avatars/{filename}"
    current_user.avatar_url = avatar_url
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.get("/avatars/defaults", response_model=List[str])
async def list_default_avatars():
    """List available default avatars"""
    defaults = []
    if DEFAULTS_DIR.exists():
        for file in DEFAULTS_DIR.iterdir():
            if file.is_file() and file.suffix.lower() in ['.png', '.jpg', '.jpeg', '.webp']:
                defaults.append(f"/static/avatars/defaults/{file.name}")
    return defaults

@router.post("/avatar/default", response_model=schemas.User)
async def select_default_avatar(
    avatar_url: str,
    current_user: models.User = Depends(deps.get_current_active_user),
    db = Depends(deps.get_db)
):
    """Select a default avatar"""
    # Validate that the URL points to a valid default avatar
    if not avatar_url.startswith("/static/avatars/defaults/"):
        raise HTTPException(status_code=400, detail="Invalid default avatar")
    
    current_user.avatar_url = avatar_url
    db.commit()
    db.refresh(current_user)
    
    return current_user
