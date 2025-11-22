from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class AssignmentBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    class_id: int

class AssignmentCreate(AssignmentBase):
    pass

class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    class_id: Optional[int] = None

class AssignmentInDBBase(AssignmentBase):
    id: int

    class Config:
        from_attributes = True

class Assignment(AssignmentInDBBase):
    pass
