import os
import sys
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Add workspace root to python search path
base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if base_dir not in sys.path:
    sys.path.append(base_dir)

from backend.app.config import settings
from backend.app.db.database import engine, Base
from backend.app.routers import auth, documents, ai_processing, search, assistant, generators, analytics, insights, settings as settings_router, notifications
from backend.app.services.vector_service import VectorService

# Automatically create database tables if they do not exist
Base.metadata.create_all(bind=engine)

# Initialize vector service and check dependencies
VectorService.initialize()

app = FastAPI(
    title="MemoryVerse AI Backend",
    description="AI-Powered Digital Identity & Knowledge Repository APIs",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(ai_processing.router)
app.include_router(search.router)
app.include_router(assistant.router)
app.include_router(generators.router)
app.include_router(analytics.router)
app.include_router(insights.router)
app.include_router(settings_router.router)
app.include_router(notifications.router)

# Mount uploads directory for static previews
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

@app.get("/")
def read_root():
    return {
        "title": "MemoryVerse AI API",
        "description": "Production-ready backend API service for personal career operating systems.",
        "status": "Online"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
