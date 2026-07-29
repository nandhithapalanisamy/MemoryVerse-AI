import logging
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.db.database import get_db
from backend.app.db.models import Document, User, Skill, Project, Certificate, Internship, Achievement, Timeline, KnowledgeGraph, Notification
from backend.app.routers.auth import get_current_user
from backend.app.services.parser_service import DocumentParser
from backend.app.services.nlp_service import NLPService
from backend.app.services.vector_service import VectorService

router = APIRouter(prefix="/api/ai", tags=["AI Processing"])
logger = logging.getLogger("memoryverse.ai_processing")

@router.post("/process/{doc_id}")
def process_document(doc_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    doc.status = "Processing"
    db.commit()

    try:
        # 1. Parse File Content
        if doc.file_type == "url":
            text = f"URL Content for {doc.filename}. Category: {doc.category}"
        else:
            text = DocumentParser.parse_file(doc.file_path)
            
        doc.ocr_text = text
        
        # 2. Extract Entities via NLP
        extracted = NLPService.categorize_and_extract(text, doc.filename)
        
        # Update title (filename display) and category
        doc.category = extracted.get("category", doc.category)
        category = doc.category
        metadata = extracted.get("metadata", {})
        
        # Apply semantic title if extracted successfully
        beautiful_title = metadata.get("document_title")
        if beautiful_title and beautiful_title.strip():
            doc.filename = beautiful_title.strip()
        
        # 3. Store Categorized Fields in Respective Tables
        # skills
        skills_added = []
        for sname in extracted.get("skills", []):
            existing_skill = db.query(Skill).filter(
                Skill.user_id == current_user.id,
                Skill.name.ilike(sname)
            ).first()
            if not existing_skill:
                new_skill = Skill(
                    user_id=current_user.id,
                    name=sname,
                    category="Technical",
                    proficiency="Intermediate",
                    source_doc_id=doc.id
                )
                db.add(new_skill)
                skills_added.append(sname)
        
        # specific schemas
        year = extracted.get("year", 2026)
        
        if category == "Certificate":
            cert = Certificate(
                user_id=current_user.id,
                name=metadata.get("certificate_name", doc.filename),
                authority=metadata.get("authority", "External"),
                date=metadata.get("date", f"{year}"),
                url=metadata.get("url", ""),
                credential_id=metadata.get("credential_id", ""),
                source_doc_id=doc.id
            )
            db.add(cert)
            
            # Add to Timeline
            timeline_evt = Timeline(
                user_id=current_user.id,
                year=year,
                event_title=cert.name,
                event_type="Certificate",
                description=f"Completed certificate from {cert.authority}.",
                date=cert.date,
                source_doc_id=doc.id
            )
            db.add(timeline_evt)
            
        elif category == "Project":
            proj = Project(
                user_id=current_user.id,
                name=metadata.get("project_name", doc.filename),
                description=metadata.get("description", ""),
                technologies=metadata.get("technologies", ""),
                organization=metadata.get("organization", ""),
                date=metadata.get("date", f"{year}"),
                url=metadata.get("url", ""),
                source_doc_id=doc.id
            )
            db.add(proj)
            
            # Add to Timeline
            timeline_evt = Timeline(
                user_id=current_user.id,
                year=year,
                event_title=proj.name,
                event_type="Project",
                description=proj.description[:200] if proj.description else "Created academic project.",
                date=proj.date,
                source_doc_id=doc.id
            )
            db.add(timeline_evt)
            
        elif category == "Internship Letter":
            intern = Internship(
                user_id=current_user.id,
                role=metadata.get("role", "Intern"),
                organization=metadata.get("organization", "Company"),
                start_date=metadata.get("start_date", f"{year}"),
                end_date=metadata.get("end_date", ""),
                description=metadata.get("description", ""),
                responsibilities=metadata.get("responsibilities", ""),
                source_doc_id=doc.id
            )
            db.add(intern)
            
            # Add to Timeline
            timeline_evt = Timeline(
                user_id=current_user.id,
                year=year,
                event_title=f"{intern.role} at {intern.organization}",
                event_type="Internship",
                description=intern.description[:200] if intern.description else "Worked as industry intern.",
                date=intern.start_date,
                source_doc_id=doc.id
            )
            db.add(timeline_evt)
            
        elif category == "Achievement":
            ach = Achievement(
                user_id=current_user.id,
                title=metadata.get("achievement_title", doc.filename),
                description=metadata.get("description", ""),
                date=metadata.get("date", f"{year}"),
                organization=metadata.get("organization", ""),
                source_doc_id=doc.id
            )
            db.add(ach)
            
            # Add to Timeline
            timeline_evt = Timeline(
                user_id=current_user.id,
                year=year,
                event_title=ach.title,
                event_type="Achievement",
                description=ach.description[:200] if ach.description else "Received professional award.",
                date=ach.date,
                source_doc_id=doc.id
            )
            db.add(timeline_evt)
            
        # 4. Generate Knowledge Graph Nodes & Edges
        # Create relationships: Skill -> gained from/used in -> Document/Project/Internship
        for skill_name in extracted.get("skills", []):
            if category == "Certificate":
                kg = KnowledgeGraph(
                    user_id=current_user.id,
                    source_node=skill_name,
                    source_type="Skill",
                    target_node=metadata.get("certificate_name", doc.filename),
                    target_type="Certificate",
                    relationship_type="PROVES"
                )
                db.add(kg)
            elif category == "Project":
                kg = KnowledgeGraph(
                    user_id=current_user.id,
                    source_node=skill_name,
                    source_type="Skill",
                    target_node=metadata.get("project_name", doc.filename),
                    target_type="Project",
                    relationship_type="USES"
                )
                db.add(kg)
            elif category == "Internship Letter":
                kg = KnowledgeGraph(
                    user_id=current_user.id,
                    source_node=skill_name,
                    source_type="Skill",
                    target_node=metadata.get("organization", "Company"),
                    target_type="Internship",
                    relationship_type="GAINED_AT"
                )
                db.add(kg)

        # 5. Embed & Vector Index
        VectorService.add_document(
            user_id=current_user.id,
            doc_id=doc.id,
            text=text,
            metadata={"filename": doc.filename, "category": category}
        )
        
        doc.status = "Processed"
        db.commit()
        
        # 6. Save Notifications
        notif1 = Notification(
            user_id=current_user.id,
            type="Document Processed",
            message=f"AI extraction completed for {doc.filename}. Identified as a {category}."
        )
        db.add(notif1)
        
        if skills_added:
            notif2 = Notification(
                user_id=current_user.id,
                type="Skill Added",
                message=f"Extracted new skills: {', '.join(skills_added[:3])}"
            )
            db.add(notif2)
            
        notif3 = Notification(
            user_id=current_user.id,
            type="Timeline Updated",
            message=f"Added a new event to your Career Timeline for year {year}."
        )
        db.add(notif3)
        
        db.commit()
        return {"status": "Success", "category": category, "skills": extracted.get("skills", [])}
        
    except Exception as e:
        logger.error(f"Processing failed for document {doc.id}: {str(e)}")
        doc.status = "Error"
        db.commit()
        
        err_notif = Notification(
            user_id=current_user.id,
            type="Document Processed",
            message=f"AI processing failed for {doc.filename}: {str(e)}"
        )
        db.add(err_notif)
        db.commit()
        raise HTTPException(status_code=500, detail=f"AI document processing failed: {str(e)}")

@router.get("/knowledge-graph")
def get_knowledge_graph(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    relationships = db.query(KnowledgeGraph).filter(KnowledgeGraph.user_id == current_user.id).all()
    
    # Format for UI graphing libraries (e.g., vis.js, cytoscape, custom SVG)
    nodes_map = {}
    edges = []
    
    # Helper to add node
    def add_node(name, ntype):
        node_id = f"{ntype.lower()}_{name.replace(' ', '_').lower()}"
        if node_id not in nodes_map:
            nodes_map[node_id] = {
                "id": node_id,
                "label": name,
                "type": ntype
            }
        return node_id
        
    for rel in relationships:
        s_id = add_node(rel.source_node, rel.source_type)
        t_id = add_node(rel.target_node, rel.target_type)
        edges.append({
            "source": s_id,
            "target": t_id,
            "label": rel.relationship_type
        })
        
    # Also seed user career goal node if user has one
    add_node("Career Ready", "Goal")
    
    return {"nodes": list(nodes_map.values()), "edges": edges}

@router.get("/timeline")
def get_timeline(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = db.query(Timeline).filter(Timeline.user_id == current_user.id).order_by(Timeline.year.asc()).all()
    return items
