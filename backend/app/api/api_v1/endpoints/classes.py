import random
import string
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.api import deps
from app.db.session import get_db
import random
import string
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.api import deps
from app.db.session import get_db

router = APIRouter()

def generate_class_code(length=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

@router.post("/", response_model=schemas.ClassSchema)
def create_class(
    *,
    db: Session = Depends(get_db),
    class_in: schemas.ClassCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
):
    if current_user.role != models.UserRole.TEACHER and current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Không đủ quyền truy cập")
    
    # Generate unique class code
    while True:
        code = generate_class_code()
        if not db.query(models.Class).filter(models.Class.class_code == code).first():
            break
            
    class_obj = models.Class(
        **class_in.dict(),
        teacher_id=current_user.id,
        class_code=code
    )
    db.add(class_obj)
    db.commit()
    db.refresh(class_obj)
    return class_obj

@router.post("/join", response_model=schemas.ClassSchema)
def join_class(
    *,
    db: Session = Depends(get_db),
    class_code: str,
    current_user: models.User = Depends(deps.get_current_active_user),
):
    # Find class by code
    class_obj = db.query(models.Class).filter(models.Class.class_code == class_code).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp học")
        
    # Check if already enrolled
    if class_obj in current_user.classes_enrolled:
        raise HTTPException(status_code=400, detail="Đã tham gia lớp học này rồi")
        
    current_user.classes_enrolled.append(class_obj)
    db.commit()
    return class_obj

@router.post("/{class_id}/regenerate-code", response_model=schemas.ClassSchema)
def regenerate_class_code(
    *,
    db: Session = Depends(get_db),
    class_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
):
    class_obj = db.query(models.Class).filter(models.Class.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp học")
        
    # Check permissions
    if current_user.role != models.UserRole.ADMIN and class_obj.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Không đủ quyền truy cập")
        
    # Generate new code
    while True:
        code = generate_class_code()
        if not db.query(models.Class).filter(models.Class.class_code == code).first():
            break
            
    class_obj.class_code = code
    db.commit()
    db.refresh(class_obj)
    return class_obj

@router.get("/", response_model=List[schemas.ClassSchema])
def list_classes(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
):
    from sqlalchemy.orm import joinedload
    
    # Teachers see their own classes, students see classes they're enrolled in
    if current_user.role == models.UserRole.TEACHER:
        classes = db.query(models.Class).options(joinedload(models.Class.teacher)).filter(models.Class.teacher_id == current_user.id).offset(skip).limit(limit).all()
    elif current_user.role == models.UserRole.STUDENT:
        # efficient pagination for many-to-many might require a direct query on the association table
        # but for now, accessing the relationship is simpler and likely sufficient for reasonable class counts
        classes = current_user.classes_enrolled[skip : skip + limit]
    else:
        # Admin sees all
        classes = db.query(models.Class).options(joinedload(models.Class.teacher)).offset(skip).limit(limit).all()
        
    return classes

@router.get("/{class_id}", response_model=schemas.ClassSchema)
def get_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    class_obj = db.query(models.Class).filter(models.Class.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp học")
    return class_obj

@router.put("/{class_id}", response_model=schemas.ClassSchema)
def update_class(
    *,
    db: Session = Depends(get_db),
    class_id: int,
    class_in: schemas.ClassUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
):
    class_obj = db.query(models.Class).filter(models.Class.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp học")
        
    # Check permissions
    if current_user.role != models.UserRole.ADMIN and class_obj.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Không đủ quyền truy cập")
        
    # Update fields
    if class_in.name is not None:
        class_obj.name = class_in.name
    if class_in.teacher_id is not None:
        class_obj.teacher_id = class_in.teacher_id
    if class_in.image_url is not None:
        class_obj.image_url = class_in.image_url
        
    db.commit()
    db.refresh(class_obj)
    return class_obj

@router.delete("/{class_id}")
def delete_class(
    *,
    db: Session = Depends(get_db),
    class_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
):
    # Only admins can delete classes
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Không đủ quyền truy cập")
        
    class_obj = db.query(models.Class).filter(models.Class.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp học")
        
    db.delete(class_obj)
    db.commit()
    return {"message": "Đã xóa lớp học thành công"}
