from fastapi import APIRouter
from app.api.api_v1.endpoints import qa, login, auth, users, classes, assignments, upload, chat, submissions, grades, files

api_router = APIRouter()
api_router.include_router(login.router, tags=["login"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(classes.router, prefix="/classes", tags=["classes"])
api_router.include_router(assignments.router, prefix="/assignments", tags=["assignments"])
api_router.include_router(qa.router, prefix="/qa", tags=["qa"])
api_router.include_router(upload.router, prefix="/upload", tags=["upload"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(submissions.router, prefix="/submissions", tags=["submissions"])
api_router.include_router(grades.router, tags=["grades"])
api_router.include_router(files.router, prefix="/files", tags=["files"])
