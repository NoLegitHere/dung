from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Float, JSON
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from datetime import datetime

class Submission(Base):
    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignment.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    content = Column(Text, nullable=True)
    file_urls = Column(JSON, nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    grade = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)

    assignment = relationship("Assignment", backref="submissions")
    student = relationship("User", backref="submissions")
