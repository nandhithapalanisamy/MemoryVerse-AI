from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.app.db.database import get_db
from backend.app.db.models import User, ChatHistory, Document
from backend.app.db.schemas import ChatMessageCreate, ChatMessageResponse
from backend.app.routers.auth import get_current_user
from backend.app.services.vector_service import VectorService
from backend.app.services.nlp_service import NLPService

router = APIRouter(prefix="/api/chat", tags=["AI Assistant"])

@router.post("/message", response_model=ChatMessageResponse)
def send_chat_message(
    payload: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_query = payload.content
    
    # Retrieve all processed documents for this user
    all_docs = db.query(Document).filter(
        Document.user_id == current_user.id,
        Document.status == "Processed"
    ).all()
    
    if not all_docs:
        ai_reply = "You haven't uploaded any processed documents yet. Please go to the Upload Center and upload your resume, project reports, or certificates so I can help you!"
        
    # Check if they are asking to list all their documents
    elif any(w in user_query.lower() for w in ["list my documents", "what are my documents", "show my files", "list my files", "what documents"]):
        doc_list = "\n".join([f"- 📄 **{d.filename}** (Category: {d.category})" for d in all_docs])
        ai_reply = f"Here are the documents currently stored in your MemoryVerse AI database:\n\n{doc_list}\n\nYou can ask me specific questions about any of these files (e.g. 'Summarize my resume' or 'Explain my project report')!"
        
    else:
        # Context Routing Intent Parser
        query_lower = user_query.lower()
        
        # 1. Match by document title/filename mentions in query
        matched_docs = []
        for doc in all_docs:
            title_clean = doc.filename.lower().replace(".pdf", "").replace(".docx", "").replace(".png", "").replace(".jpg", "").replace(".jpeg", "")
            if len(title_clean) > 5 and title_clean in query_lower:
                matched_docs.append(doc)
                
        # 2. Match by category keywords in query
        if not matched_docs:
            category_keywords = {
                "Resume": ["resume", "cv", "curriculum vitae", "biodata"],
                "Project": ["project", "report", "methodology", "proposed system", "system architecture"],
                "Internship Letter": ["internship", "intern", "trainee", "completion letter", "stipend"],
                "Certificate": ["certificate", "certification", "credential", "certified"],
                "Research Paper": ["research paper", "paper", "abstract", "journal", "ieee"],
                "Marksheet": ["marksheet", "transcript", "grade sheet", "cgpa", "gpa", "sgpa", "marks"],
                "Recommendation Letter": ["recommendation", "lor", "recommender", "recommend"],
                "Achievement": ["achievement", "award", "winner", "won", "hackathon", "first place"]
            }
            for cat, keywords in category_keywords.items():
                if any(w in query_lower for w in keywords):
                    matched_docs.extend([d for d in all_docs if d.category == cat])
                    
        # 3. Handle matched documents routing
        if len(matched_docs) > 1:
            titles = ", ".join([f'"{d.filename}"' for d in matched_docs])
            ai_reply = f"I see you have multiple documents that match your query: {titles}. Which specific one would you like me to explain?"
            
        else:
            retrieved_docs = []
            if len(matched_docs) == 1:
                target_doc = matched_docs[0]
                retrieved_docs = VectorService.search_documents(
                    user_id=current_user.id,
                    query=user_query,
                    limit=5,
                    doc_id=target_doc.id
                )
                if not retrieved_docs:
                    doc_dict = [{"id": target_doc.id, "filename": target_doc.filename, "category": target_doc.category, "ocr_text": target_doc.ocr_text}]
                    retrieved_docs = VectorService.local_tfidf_fallback_search(query=user_query, documents=doc_dict, limit=5)
            else:
                # Ambiguous or general query: search across all documents
                retrieved_docs = VectorService.search_documents(user_id=current_user.id, query=user_query, limit=3)
                if not retrieved_docs:
                    doc_dicts = [{"id": d.id, "filename": d.filename, "category": d.category, "ocr_text": d.ocr_text} for d in all_docs]
                    retrieved_docs = VectorService.local_tfidf_fallback_search(query=user_query, documents=doc_dicts, limit=3)

            # Get past chat history for context
            history = db.query(ChatHistory).filter(ChatHistory.user_id == current_user.id).order_by(ChatHistory.created_at.asc()).all()
            history_dicts = [{"role": h.role, "content": h.content} for h in history]

            # Format doc contexts for our generator
            rag_context = []
            for hit in retrieved_docs:
                full_doc = db.query(Document).filter(Document.id == hit["doc_id"]).first()
                rag_context.append({
                    "filename": hit["filename"],
                    "category": hit["category"],
                    "text": full_doc.ocr_text if full_doc else hit["text"]
                })

            ai_reply = NLPService.generate_rag_response(
                user_query=user_query,
                retrieved_docs=rag_context,
                chat_history=history_dicts
            )

    # Save User Message & Assistant Response
    user_msg = ChatHistory(user_id=current_user.id, role="user", content=user_query)
    assistant_msg = ChatHistory(user_id=current_user.id, role="assistant", content=ai_reply)
    
    db.add(user_msg)
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)
    
    return assistant_msg

@router.get("/history", response_model=List[ChatMessageResponse])
def get_chat_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(ChatHistory).filter(ChatHistory.user_id == current_user.id).order_by(ChatHistory.created_at.asc()).all()

@router.delete("/history")
def clear_chat_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(ChatHistory).filter(ChatHistory.user_id == current_user.id).delete()
    db.commit()
    return {"message": "Chat history cleared successfully"}
