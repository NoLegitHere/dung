from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from datetime import datetime

class Question(Base):
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    student_id = Column(Integer, ForeignKey("user.id"))
    class_id = Column(Integer, ForeignKey("class.id"))
    
    student = relationship("User", backref="questions")
    class_ = relationship("Class", backref="questions")
    answers = relationship("Answer", back_populates="question", cascade="all, delete-orphan")

class Answer(Base):
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    teacher_id = Column(Integer, ForeignKey("user.id"))
    question_id = Column(Integer, ForeignKey("question.id"))
    
    teacher = relationship("User", backref="answers")
    question = relationship("Question", back_populates="answers")
