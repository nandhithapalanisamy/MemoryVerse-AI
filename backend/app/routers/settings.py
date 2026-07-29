from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json

from backend.app.db.database import get_db
from backend.app.db.models import User, Setting, Document, Skill, Project, Certificate, Internship, Achievement, Timeline
from backend.app.db.schemas import SettingResponse, SettingUpdate
from backend.app.routers.auth import get_current_user

router = APIRouter(prefix="/api/settings", tags=["Settings"])

@router.get("/", response_model=SettingResponse)
def get_settings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    setting = db.query(Setting).filter(Setting.user_id == current_user.id).first()
    if not setting:
        # Create default
        setting = Setting(user_id=current_user.id)
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting

@router.put("/", response_model=SettingResponse)
def update_settings(payload: SettingUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    setting = db.query(Setting).filter(Setting.user_id == current_user.id).first()
    if not setting:
        setting = Setting(user_id=current_user.id)
        db.add(setting)
        
    if payload.theme is not None:
        setting.theme = payload.theme
    if payload.language is not None:
        setting.language = payload.language
    if payload.privacy is not None:
        setting.privacy = payload.privacy
        
    db.commit()
    db.refresh(setting)
    return setting

@router.post("/export")
def export_user_data(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Package all user data into a JSON structure
    skills = db.query(Skill).filter(Skill.user_id == current_user.id).all()
    projects = db.query(Project).filter(Project.user_id == current_user.id).all()
    certs = db.query(Certificate).filter(Certificate.user_id == current_user.id).all()
    internships = db.query(Internship).filter(Internship.user_id == current_user.id).all()
    achievements = db.query(Achievement).filter(Achievement.user_id == current_user.id).all()
    timeline = db.query(Timeline).filter(Timeline.user_id == current_user.id).all()
    
    data = {
        "user": {
            "email": current_user.email,
            "full_name": current_user.full_name,
        },
        "skills": [{"name": s.name, "category": s.category, "proficiency": s.proficiency} for s in skills],
        "projects": [{"name": p.name, "description": p.description, "technologies": p.technologies, "url": p.url} for p in projects],
        "certificates": [{"name": c.name, "authority": c.authority, "date": c.date, "credential_id": c.credential_id} for c in certs],
        "internships": [{"role": i.role, "organization": i.organization, "start_date": i.start_date, "end_date": i.end_date, "description": i.description} for i in internships],
        "achievements": [{"title": a.title, "description": a.description, "date": a.date} for a in achievements],
        "timeline": [{"year": t.year, "event_title": t.event_title, "event_type": t.event_type} for t in timeline]
    }
    
    return {"message": "Data exported successfully", "data": data}

@router.delete("/delete-account")
def delete_user_account(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.delete(current_user)
    db.commit()
    return {"message": "Account deleted successfully. All uploaded documents and metadata have been purged."}
