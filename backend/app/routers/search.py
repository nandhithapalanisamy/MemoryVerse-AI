from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from backend.app.db.database import get_db
from backend.app.db.models import User, Document
from backend.app.routers.auth import get_current_user
from backend.app.services.vector_service import VectorService

router = APIRouter(prefix="/api/search", tags=["Semantic Search"])

@router.get("/")
def search(
    q: str = Query(..., description="Search query"),
    limit: int = Query(5, description="Number of results to return"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Try semantic vector search first
    results = VectorService.search_documents(user_id=current_user.id, query=q, limit=limit)
    
    # If no results, fallback to local database keyword search
    if not results:
        all_docs = db.query(Document).filter(
            Document.user_id == current_user.id,
            Document.status == "Processed"
        ).all()
        
        # Convert to dictionary representation for fallback search helper
        doc_dicts = []
        for doc in all_docs:
            doc_dicts.append({
                "id": doc.id,
                "filename": doc.filename,
                "category": doc.category,
                "ocr_text": doc.ocr_text
            })
            
        results = VectorService.local_tfidf_fallback_search(query=q, documents=doc_dicts, limit=limit)
        
    return results
