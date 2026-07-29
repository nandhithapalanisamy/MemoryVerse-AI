import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from backend.app.db.database import get_db
from backend.app.db.models import Document, User, Notification
from backend.app.db.schemas import DocumentResponse
from backend.app.routers.auth import get_current_user
from backend.app.config import settings

router = APIRouter(prefix="/api/documents", tags=["Documents"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".pptx", ".ppt", ".png", ".jpg", ".jpeg", ".zip", ".txt"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB

@router.post("/upload", response_model=DocumentResponse)
def upload_document(
    file: UploadFile = File(None),
    portfolio_url: Optional[str] = Form(None),
    github_url: Optional[str] = Form(None),
    linkedin_url: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Handle URL Uploads
    if not file:
        url_type = None
        url_val = None
        if portfolio_url:
            url_type = "Portfolio URL"
            url_val = portfolio_url
        elif github_url:
            url_type = "GitHub URL"
            url_val = github_url
        elif linkedin_url:
            url_type = "LinkedIn URL"
            url_val = linkedin_url
            
        if not url_val:
            raise HTTPException(status_code=400, detail="No file or URL provided")
            
        # Create a document record for URL
        doc = Document(
            user_id=current_user.id,
            filename=url_val,
            file_path=url_val,
            file_type="url",
            file_size=0,
            category=url_type,
            ocr_text=f"{url_type}: {url_val}",
            status="Processed"
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        
        # Add Notification
        notif = Notification(
            user_id=current_user.id,
            type="Upload Success",
            message=f"Added {url_type}: {url_val}"
        )
        db.add(notif)
        db.commit()
        
        return doc

    # Handle File Upload
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format. Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}"
        )
        
    # Check duplicate name / content-based versioning
    # Find existing document with same name
    existing_doc = db.query(Document).filter(
        Document.user_id == current_user.id,
        Document.filename == file.filename,
        Document.parent_id.is_(None)
    ).order_by(Document.version.desc()).first()
    
    version = 1
    parent_id = None
    if existing_doc:
        version = existing_doc.version + 1
        parent_id = existing_doc.id

    # Create destination file path
    user_upload_dir = os.path.join(settings.UPLOAD_DIR, str(current_user.id))
    os.makedirs(user_upload_dir, exist_ok=True)
    
    file_path = os.path.join(user_upload_dir, f"v{version}_{file.filename}")
    
    # Save file contents
    size = 0
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        size = os.path.getsize(file_path)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save file: {str(e)}"
        )

    if size > MAX_FILE_SIZE:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail="File exceeds maximum size of 20MB")

    # Create document database entry
    doc = Document(
        user_id=current_user.id,
        filename=file.filename,
        file_path=file_path,
        file_type=file_ext,
        file_size=size,
        version=version,
        parent_id=parent_id,
        status="Pending"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    # Send upload success notification
    notif = Notification(
        user_id=current_user.id,
        type="Upload Success",
        message=f"Uploaded document: {file.filename} (Version {version})"
    )
    db.add(notif)
    db.commit()
    
    return doc

@router.get("/", response_model=List[DocumentResponse])
def get_user_documents(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Return all documents (showing only the latest versions by default or all)
    return db.query(Document).filter(Document.user_id == current_user.id).all()

@router.get("/history/{parent_id}", response_model=List[DocumentResponse])
def get_document_version_history(parent_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Document).filter(
        Document.user_id == current_user.id,
        (Document.id == parent_id) | (Document.parent_id == parent_id)
    ).order_by(Document.version.desc()).all()

@router.delete("/{doc_id}")
def delete_document(doc_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Delete from filesystem if it is a local file
    if doc.file_type != "url" and os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception as e:
            logger.warning(f"Could not delete physical file {doc.file_path}: {str(e)}")
            
    db.delete(doc)
    db.commit()
    return {"message": "Document successfully deleted"}
