from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def update_passwords():
    db = SessionLocal()
    try:
        # Teacher
        teacher = db.query(User).filter(User.email == "teacher@school.com").first()
        if teacher:
            teacher.hashed_password = get_password_hash("teacher123")
            logger.info("Updated teacher password")
        
        # Student
        student = db.query(User).filter(User.email == "student@school.com").first()
        if student:
            student.hashed_password = get_password_hash("student123")
            logger.info("Updated student password")

        # Admin
        admin = db.query(User).filter(User.email == "admin@school.com").first()
        if admin:
            admin.hashed_password = get_password_hash("admin123")
            logger.info("Updated admin password")
            
        db.commit()
    finally:
        db.close()

if __name__ == "__main__":
    update_passwords()
