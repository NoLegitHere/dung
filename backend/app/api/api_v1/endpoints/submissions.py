from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app import models, schemas
from app.api import deps
from app.db.session import get_db
import shutil
import os
from datetime import datetime

router = APIRouter()

@router.post("/", response_model=schemas.Submission)
def create_submission(
    *,
    db: Session = Depends(get_db),
    submission_in: schemas.SubmissionCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Create new submission.
    """
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can submit assignments")
    
    # Check if assignment exists
    assignment = db.query(models.Assignment).filter(models.Assignment.id == submission_in.assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Check if already submitted
    existing_submission = db.query(models.Submission).filter(
        models.Submission.assignment_id == submission_in.assignment_id,
        models.Submission.student_id == current_user.id
    ).first()

    if existing_submission:
        # Update existing submission
        existing_submission.content = submission_in.content
        existing_submission.file_urls = submission_in.file_urls
        existing_submission.submitted_at = datetime.utcnow()
        db.commit()
        db.refresh(existing_submission)
        return existing_submission

    submission = models.Submission(
        **submission_in.dict(),
        student_id=current_user.id
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission

@router.get("/my", response_model=List[schemas.Submission])
def read_my_submissions(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Retrieve current user's submissions.
    """
    submissions = db.query(models.Submission).filter(
        models.Submission.student_id == current_user.id
    ).offset(skip).limit(limit).all()
    return submissions

@router.get("/assignment/{assignment_id}", response_model=List[schemas.Submission])
def read_assignment_submissions(
    assignment_id: int,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Retrieve submissions for a specific assignment (Teacher only).
    """
    if current_user.role != "teacher" and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    submissions = db.query(models.Submission).filter(
        models.Submission.assignment_id == assignment_id
    ).offset(skip).limit(limit).all()
    return submissions

@router.put("/{submission_id}", response_model=schemas.Submission)
def grade_submission(
    *,
    db: Session = Depends(get_db),
    submission_id: int,
    submission_in: schemas.SubmissionUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Grade a submission (Teacher only).
    """
    if current_user.role != "teacher" and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    submission = db.query(models.Submission).filter(models.Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    update_data = submission_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(submission, field, value)
        
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission

@router.post("/upload", response_model=dict)
def upload_submission_file(
    file: UploadFile = File(...),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Upload a submission file.
    """
    UPLOAD_DIR = "static/submissions"
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    file_location = f"{UPLOAD_DIR}/{current_user.id}_{datetime.now().timestamp()}_{file.filename}"
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
        
    return {"url": f"/{file_location}"}

@router.delete("/files")
def delete_submission_file(
    *,
    file_url: str,
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Delete a submission file.
    """
    # Remove leading slash if present
    file_path = file_url.lstrip("/")
    
    # Check if file exists
    if os.path.exists(file_path):
        os.remove(file_path)
        return {"message": "File deleted successfully"}
    else:
        raise HTTPException(status_code=404, detail="File not found")
