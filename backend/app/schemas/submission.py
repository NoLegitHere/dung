from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

# Shared properties
class SubmissionBase(BaseModel):
    content: Optional[str] = None
    file_urls: Optional[List[str]] = None

# Properties to receive via API on creation
class SubmissionCreate(SubmissionBase):
    assignment_id: int

# Properties to receive via API on update
class SubmissionUpdate(SubmissionBase):
    grade: Optional[float] = None
    feedback: Optional[str] = None

class SubmissionInDBBase(SubmissionBase):
    id: int
    assignment_id: int
    student_id: int
    submitted_at: datetime
    grade: Optional[float] = None
    feedback: Optional[str] = None

    class Config:
        from_attributes = True

from app.schemas.user import User

# Additional properties to return via API
class Submission(SubmissionInDBBase):
    student: Optional[User] = None
