import logging
import random
import string
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.models.class_model import Class
from app.models.assignment import Assignment
from app.core.security import get_password_hash
from datetime import datetime, timedelta

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def generate_class_code() -> str:
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

def init_db(db: Session) -> None:
    # Create default class if it doesn't exist
    default_class = db.query(Class).filter(Class.id == 1).first()
    if not default_class:
        default_class = Class(
            id=1,
            name="Lớp Mặc Định",
            class_code="DEFAULT" # Static code for default class
        )
        db.add(default_class)
        db.commit()
        # Sync the sequence since we inserted with explicit ID
        db.execute(text("SELECT setval('class_id_seq', (SELECT MAX(id) FROM class))"))
        db.commit()
        logger.info("Created default class")

    # Create sample teacher if doesn't exist
    teacher = db.query(User).filter(User.email == "teacher@school.com").first()
    if not teacher:
        teacher = User(
            email="teacher@school.com",
            full_name="Nguyen Van Giao Vien",
            hashed_password=get_password_hash("teacher123"),
            role=UserRole.TEACHER,
            is_active=True,
        )
        db.add(teacher)
        db.commit()
        db.refresh(teacher)
        logger.info("Created sample teacher")

    # Create sample student if doesn't exist
    student = db.query(User).filter(User.email == "student@school.com").first()
    if not student:
        student = User(
            email="student@school.com",
            full_name="Tran Van Hoc Sinh",
            hashed_password=get_password_hash("student123"),
            role=UserRole.STUDENT,
            is_active=True,
        )
        db.add(student)
        db.commit()
        logger.info("Created sample student")

    # Create sample admin if doesn't exist
    admin = db.query(User).filter(User.email == "admin@school.com").first()
    if not admin:
        admin = User(
            email="admin@school.com",
            full_name="Pham Van Quan Tri",
            hashed_password=get_password_hash("admin123"),
            role=UserRole.ADMIN,
            is_active=True,
        )
        db.add(admin)
        db.commit()
        logger.info("Created sample admin")

    # Create sample classes
    classes_data = [
        {"name": "Lớp 7A", "teacher_id": teacher.id, "image_url": "/static/images/classroom_7a.png"},
        {"name": "Lớp 8B", "teacher_id": teacher.id, "image_url": "/static/images/classroom_8b.png"},
        {"name": "Lớp 9C", "teacher_id": teacher.id, "image_url": "/static/images/classroom_9c.png"},
    ]
    
    for class_data in classes_data:
        existing_class = db.query(Class).filter(Class.name == class_data["name"]).first()
        if existing_class:
            # Update image_url if class exists
            existing_class.image_url = class_data.get("image_url")
            if not existing_class.class_code:
                 existing_class.class_code = generate_class_code()
                 db.add(existing_class)
        else:
            class_data["class_code"] = generate_class_code()
            new_class = Class(**class_data)
            db.add(new_class)
    
    db.commit()
    logger.info("Created sample classes")

    # Create sample assignments
    class_7a = db.query(Class).filter(Class.name == "Lớp 7A").first()
    class_8b = db.query(Class).filter(Class.name == "Lớp 8B").first()
    class_9c = db.query(Class).filter(Class.name == "Lớp 9C").first()

    if class_7a and class_8b and class_9c:
        assignments_data = [
            {
                "title": "Bài tập 1: Đại số",
                "description": "Giải các bài tập về đại số tuyến tính",
                "due_date": datetime.now() + timedelta(days=7),
                "class_id": class_7a.id,
            },
            {
                "title": "Bài tập 2: Hình học",
                "description": "Bài tập về hình học không gian",
                "due_date": datetime.now() + timedelta(days=10),
                "class_id": class_8b.id,
            },
            {
                "title": "Bài tập 3: Giới hạn",
                "description": "Tính giới hạn của các hàm số",
                "due_date": datetime.now() + timedelta(days=14),
                "class_id": class_9c.id,
            },
        ]

        for assignment_data in assignments_data:
            existing_assignment = db.query(Assignment).filter(
                Assignment.title == assignment_data["title"]
            ).first()
            if not existing_assignment:
                new_assignment = Assignment(**assignment_data)
                db.add(new_assignment)
        
        db.commit()
        logger.info("Created sample assignments")

def main() -> None:
    logger.info("Creating initial data")
    db = SessionLocal()
    init_db(db)
    logger.info("Initial data created")

if __name__ == "__main__":
    main()
