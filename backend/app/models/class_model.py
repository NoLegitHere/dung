from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Class(Base):
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    teacher_id = Column(Integer, ForeignKey("user.id"), nullable=True)
    image_url = Column(String, nullable=True)
    class_code = Column(String, unique=True, index=True, nullable=False)
    
    teacher = relationship("User", backref="classes_taught")
    students = relationship("User", secondary="student_class", backref="classes_enrolled")
