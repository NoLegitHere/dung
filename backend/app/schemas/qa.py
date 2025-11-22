from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from .user import User

class AnswerBase(BaseModel):
    content: str
    question_id: int

class AnswerCreate(AnswerBase):
    pass

class AnswerInDBBase(AnswerBase):
    id: int
    timestamp: datetime
    teacher: Optional[User] = None

    class Config:
        from_attributes = True

class Answer(AnswerInDBBase):
    pass

class QuestionBase(BaseModel):
    content: str
    class_id: int

class QuestionCreate(QuestionBase):
    pass

class QuestionInDBBase(QuestionBase):
    id: int
    timestamp: datetime
    student: Optional[User] = None
    answers: List[Answer] = []

    class Config:
        from_attributes = True

class Question(QuestionInDBBase):
    pass
