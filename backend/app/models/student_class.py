from sqlalchemy import Column, Integer, ForeignKey, Table
from app.db.base_class import Base

student_class = Table(
    "student_class",
    Base.metadata,
    Column("student_id", Integer, ForeignKey("user.id"), primary_key=True),
    Column("class_id", Integer, ForeignKey("class.id"), primary_key=True),
)
