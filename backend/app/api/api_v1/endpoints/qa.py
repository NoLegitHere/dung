from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session, joinedload

from app import models, schemas
from app.api import deps
from app.db.session import get_db
from app.core.socket_manager import manager


router = APIRouter()

@router.get("/{class_id}", response_model=List[schemas.Question])
def read_questions(
    class_id: int,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    questions = db.query(models.Question).options(joinedload(models.Question.student)).filter(models.Question.class_id == class_id).offset(skip).limit(limit).all()
    return questions


@router.post("/", response_model=schemas.Question)
async def create_question(
    question_in: schemas.QuestionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
):
    # if current_user.role != models.UserRole.STUDENT:
    #      raise HTTPException(status_code=403, detail="Only students can ask questions")


    question = models.Question(
        content=question_in.content,
        class_id=question_in.class_id,
        student_id=current_user.id
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    
    # Broadcast new question
    # We need to serialize the question with the student info if possible, or just basic info
    # For simplicity, we re-query or just rely on what we have. 
    # Ideally, we should eagerly load the student relationship if the schema requires it.
    question_dict = schemas.Question.from_orm(question).dict()
    # Convert datetime to ISO string for JSON serialization
    if 'timestamp' in question_dict and question_dict['timestamp']:
        question_dict['timestamp'] = question_dict['timestamp'].isoformat()
    await manager.broadcast({"type": "new_question", "data": question_dict}, question_in.class_id)

    
    return question

@router.post("/answer", response_model=schemas.Answer)
async def create_answer(
    answer_in: schemas.AnswerCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
):
    if current_user.role != models.UserRole.TEACHER:
         raise HTTPException(status_code=403, detail="Only teachers can answer questions")

    answer = models.Answer(
        content=answer_in.content,
        question_id=answer_in.question_id,
        teacher_id=current_user.id
    )
    db.add(answer)
    db.commit()
    db.refresh(answer)
    
    # Get class_id from question to broadcast
    question = db.query(models.Question).filter(models.Question.id == answer_in.question_id).first()
    if question:
        answer_dict = schemas.Answer.from_orm(answer).dict()
        # Convert datetime to ISO string for JSON serialization
        if 'timestamp' in answer_dict and answer_dict['timestamp']:
            answer_dict['timestamp'] = answer_dict['timestamp'].isoformat()
        await manager.broadcast({"type": "new_answer", "data": answer_dict}, question.class_id)


    return answer


@router.websocket("/ws/{class_id}")
async def websocket_endpoint(websocket: WebSocket, class_id: int):
    await manager.connect(websocket, class_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming messages if needed
            # await manager.broadcast(f"Message text was: {data}", class_id)
            pass
    except WebSocketDisconnect:
        manager.disconnect(websocket, class_id)
