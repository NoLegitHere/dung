from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import List
import os
import shutil
from pathlib import Path
from datetime import datetime
from app import models
from app.api import deps

router = APIRouter()

UPLOAD_DIR = Path("static")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.get("/")
async def list_files(
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """List all files in the static directory (admin only)"""
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Không đủ quyền truy cập")
    
    files = []
    for root, _, filenames in os.walk(UPLOAD_DIR):
        for filename in filenames:
            file_path = Path(root) / filename
            relative_path = file_path.relative_to(UPLOAD_DIR.parent)
            stat = file_path.stat()
            files.append({
                "name": filename,
                "path": f"/{relative_path.as_posix()}",
                "size": stat.st_size,
                "type": _get_mime_type(filename),
                "uploaded_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
            })
    
    return files

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """Upload a file (admin only)"""
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Không đủ quyền truy cập")
    
    # Create uploads directory
    upload_path = UPLOAD_DIR / "uploads"
    upload_path.mkdir(parents=True, exist_ok=True)
    
    # Create unique filename
    file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''
    filename = f"{datetime.now().timestamp()}_{file.filename}"
    file_path = upload_path / filename
    
    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Không thể lưu file")
    
    return {
        "message": "Tải file lên thành công",
        "path": f"/static/uploads/{filename}",
        "filename": filename,
    }

@router.delete("/{file_path:path}")
async def delete_file(
    file_path: str,
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """Delete a file (admin only)"""
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Không đủ quyền truy cập")
    
    # Remove leading slash if present
    file_path = file_path.lstrip('/')
    
    full_path = Path(file_path)
    if not full_path.exists():
        raise HTTPException(status_code=404, detail="Không tìm thấy file")
    
    # Prevent deleting files outside static directory
    try:
        full_path.relative_to(UPLOAD_DIR)
    except ValueError:
        raise HTTPException(status_code=403, detail="Không được phép xóa file này")
    
    try:
        full_path.unlink()
    except Exception as e:
        raise HTTPException(status_code=500, detail="Không thể xóa file")
    
    return {"message": "Đã xóa file thành công"}

def _get_mime_type(filename: str) -> str:
    """Get MIME type from filename extension"""
    ext = filename.split('.')[-1].lower() if '.' in filename else ''
    mime_types = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'txt': 'text/plain',
    }
    return mime_types.get(ext, 'application/octet-stream')
