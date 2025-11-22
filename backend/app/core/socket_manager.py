from typing import List, Dict
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # Store active connections: {class_id: [WebSocket]}
        self.active_connections: Dict[int, List[WebSocket]] = {}
        # Store user connections: {user_id: WebSocket} (assuming one connection per user for simplicity)
        self.user_connections: Dict[int, WebSocket] = {}

    async def connect(self, websocket: WebSocket, class_id: int):
        await websocket.accept()
        if class_id not in self.active_connections:
            self.active_connections[class_id] = []
        self.active_connections[class_id].append(websocket)

    def disconnect(self, websocket: WebSocket, class_id: int):
        if class_id in self.active_connections:
            if websocket in self.active_connections[class_id]:
                self.active_connections[class_id].remove(websocket)
            if not self.active_connections[class_id]:
                del self.active_connections[class_id]

    async def broadcast(self, message: dict, class_id: int):
        if class_id in self.active_connections:
            for connection in self.active_connections[class_id]:
                await connection.send_json(message)

    # --- Direct Message Methods ---
    async def connect_user(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.user_connections[user_id] = websocket

    def disconnect_user(self, user_id: int):
        if user_id in self.user_connections:
            del self.user_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.user_connections:
            await self.user_connections[user_id].send_json(message)

manager = ConnectionManager()
