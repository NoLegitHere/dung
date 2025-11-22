from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app import models, schemas
from app.api import deps
from app.core.socket_manager import manager

router = APIRouter()

@router.get("/conversations", response_model=List[schemas.User])
def get_conversations(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get list of users the current user has chatted with.
    """
    # Find all messages where current user is sender or receiver
    messages = db.query(models.Message).filter(
        or_(
            models.Message.sender_id == current_user.id,
            models.Message.receiver_id == current_user.id
        )
    ).all()

    # Extract unique user IDs
    user_ids = set()
    for msg in messages:
        if msg.sender_id != current_user.id:
            user_ids.add(msg.sender_id)
        if msg.receiver_id != current_user.id:
            user_ids.add(msg.receiver_id)

    # Fetch user details
    users = db.query(models.User).filter(models.User.id.in_(user_ids)).all()
    
    # If no conversations, return all users (for MVP to start chats)
    if not users:
        users = db.query(models.User).filter(models.User.id != current_user.id).all()
        
    return users

@router.get("/{user_id}/messages", response_model=List[schemas.Message])
def get_messages(
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Get message history with a specific user.
    """
    messages = db.query(models.Message).filter(
        or_(
            and_(models.Message.sender_id == current_user.id, models.Message.receiver_id == user_id),
            and_(models.Message.sender_id == user_id, models.Message.receiver_id == current_user.id)
        )
    ).order_by(models.Message.timestamp.asc()).offset(skip).limit(limit).all()
    
    return messages

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: int,
    db: Session = Depends(deps.get_db),
):
    """
    WebSocket endpoint for real-time chat.
    user_id: The ID of the current user connecting (in a real app, this should be authenticated via token in WS handshake)
    """
    # Note: In production, validate user_id matches the authenticated user
    await manager.connect_user(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_json()
            # data format: {"receiver_id": int, "content": str}
            
            receiver_id = data.get("receiver_id")
            content = data.get("content")
            
            if receiver_id and content:
                # Save to DB
                message = models.Message(
                    sender_id=user_id,
                    receiver_id=receiver_id,
                    content=content
                )
                db.add(message)
                db.commit()
                db.refresh(message)
                
                # Send to receiver if connected
                await manager.send_personal_message(
                    {
                        "type": "new_message",
                        "message": {
                            "id": message.id,
                            "sender_id": message.sender_id,
                            "receiver_id": message.receiver_id,
                            "content": message.content,
                            "timestamp": message.timestamp.isoformat(),
                            "is_read": message.is_read
                        }
                    },
                    receiver_id
                )
                
                # Send confirmation to sender (optional, but good for UI updates if not optimistic)
                # In this case, we just rely on the sender's UI to update optimistically or via response
                
    except WebSocketDisconnect:
        manager.disconnect_user(user_id)
