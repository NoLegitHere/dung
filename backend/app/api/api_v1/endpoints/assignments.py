from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.api import deps
from app.db.session import get_db

router = APIRouter()

@router.get("/", response_model=List[schemas.Assignment])
def list_assignments(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
):
    # Students should only see assignments from classes they're enrolled in
    if current_user.role == models.UserRole.STUDENT:
        # Get the classes the student is enrolled in
        enrolled_classes = [cls.id for cls in current_user.classes_enrolled]
        assignments = db.query(models.Assignment)\
            .filter(models.Assignment.class_id.in_(enrolled_classes))\
            .offset(skip).limit(limit).all()
    elif current_user.role == models.UserRole.TEACHER:
        # Teachers should see assignments from classes they teach
        taught_classes = [cls.id for cls in current_user.classes_taught]
        assignments = db.query(models.Assignment)\
            .filter(models.Assignment.class_id.in_(taught_classes))\
            .offset(skip).limit(limit).all()
    else:
        # Admins see all assignments
        assignments = db.query(models.Assignment).offset(skip).limit(limit).all()
    
    return assignments

@router.get("/{assignment_id}", response_model=schemas.Assignment)
def get_assignment(
    *,
    db: Session = Depends(get_db),
    assignment_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
):
    assignment = db.query(models.Assignment).filter(models.Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment

@router.post("/", response_model=schemas.Assignment)
def create_assignment(
    *,
    db: Session = Depends(get_db),
    assignment_in: schemas.AssignmentCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
):
    assignment = models.Assignment(**assignment_in.model_dump())
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment

@router.put("/{assignment_id}", response_model=schemas.Assignment)
def update_assignment(
    *,
    db: Session = Depends(get_db),
    assignment_id: int,
    assignment_in: schemas.AssignmentUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
):
    assignment = db.query(models.Assignment).filter(models.Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    update_data = assignment_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(assignment, field, value)
        
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment

@router.delete("/{assignment_id}", response_model=schemas.Assignment)
def delete_assignment(
    *,
    db: Session = Depends(get_db),
    assignment_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
):
    assignment = db.query(models.Assignment).filter(models.Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    db.delete(assignment)
    db.commit()
    return assignment
