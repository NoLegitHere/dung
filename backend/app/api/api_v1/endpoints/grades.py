from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app import models, schemas
from app.api import deps

router = APIRouter()

@router.get("/grades/me", response_model=List[dict])
def read_my_grades(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user's grades grouped by class (subject).
    """
    if current_user.role != "student":
        raise HTTPException(status_code=400, detail="Only students can check grades")

    # Query to get average grade per class
    # We need to join Submission -> Assignment -> Class
    results = (
        db.query(
            models.Class.name.label("subject"),
            func.avg(models.Submission.grade).label("score")
        )
        .join(models.Assignment, models.Assignment.class_id == models.Class.id)
        .join(models.Submission, models.Submission.assignment_id == models.Assignment.id)
        .filter(models.Submission.student_id == current_user.id)
        .filter(models.Submission.grade.isnot(None))
        .group_by(models.Class.id, models.Class.name)
        .all()
    )

    return [{"subject": r.subject, "score": round(r.score, 2) if r.score else 0} for r in results]

@router.get("/progress/me", response_model=List[dict])
def read_my_progress(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user's learning progress (percentage of assignments submitted) per class.
    """
    if current_user.role != "student":
        raise HTTPException(status_code=400, detail="Only students can check progress")

    # Get all classes the student is enrolled in (or all classes for now if no enrollment logic yet)
    # Assuming implicit enrollment or checking all classes where they have assignments?
    # Better: Get all classes, count total assignments, count user's submissions.
    
    # For now, let's look at classes where there are assignments.
    
    classes = db.query(models.Class).all()
    progress_data = []

    for cls in classes:
        total_assignments = db.query(func.count(models.Assignment.id)).filter(models.Assignment.class_id == cls.id).scalar()
        
        if total_assignments == 0:
            continue

        submitted_assignments = (
            db.query(func.count(models.Submission.id))
            .join(models.Assignment, models.Submission.assignment_id == models.Assignment.id)
            .filter(models.Assignment.class_id == cls.id)
            .filter(models.Submission.student_id == current_user.id)
            .scalar()
        )

        percentage = int((submitted_assignments / total_assignments) * 100)
        progress_data.append({"subject": cls.name, "percentage": percentage})

    return progress_data
