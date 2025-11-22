from typing import Optional, List
from pydantic import BaseModel

class ClassBase(BaseModel):
    name: str
    teacher_id: Optional[int] = None
    image_url: Optional[str] = None
    class_code: Optional[str] = None

class ClassCreate(ClassBase):
    pass

class ClassUpdate(ClassBase):
    pass

class TeacherInfo(BaseModel):
    id: int
    full_name: str
    email: str
    
    class Config:
        from_attributes = True

class ClassInDBBase(ClassBase):
    id: int
    
    class Config:
        from_attributes = True

class ClassSchema(ClassInDBBase):
    teacher: Optional[TeacherInfo] = None
