from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from backend.app.db.database import get_db
from backend.app.db.models import User, Skill, Project, Certificate, Internship
from backend.app.routers.auth import get_current_user

router = APIRouter(prefix="/api/insights", tags=["Career Insights"])

# Job profiles and required skills
JOB_PROFILES = {
    "Full-Stack Web Developer": {
        "required": ["React", "Node.js", "Javascript", "HTML", "CSS", "SQL", "Git"],
        "recommended_certs": ["AWS Certified Developer", "Meta Front-End Developer Certificate"],
        "recommended_projects": ["E-Commerce Platform with Stripe", "Real-time Chat App using Socket.io"]
    },
    "Data Scientist / ML Engineer": {
        "required": ["Python", "Pandas", "PyTorch", "TensorFlow", "Scikit-Learn", "Machine Learning", "SQL"],
        "recommended_certs": ["DeepLearning.AI TensorFlow Developer", "Google Cloud Machine Learning Professional"],
        "recommended_projects": ["Predictive Analysis Dashboard using Regression", "Image Classification Pipeline using CNNs"]
    },
    "Cloud & DevOps Engineer": {
        "required": ["Docker", "Kubernetes", "AWS", "Git", "Linux", "Terraform", "CI/CD"],
        "recommended_certs": ["AWS Certified Solutions Architect", "Certified Kubernetes Administrator (CKA)"],
        "recommended_projects": ["Multi-tier Web App Deployment via Kubernetes", "Infrastructure provisioning using Terraform"]
    }
}

@router.get("/")
def get_career_insights(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Fetch user skills
    user_skills = db.query(Skill).filter(Skill.user_id == current_user.id).all()
    user_skill_names = {s.name.lower() for s in user_skills}
    
    analysis = []
    
    for profile, details in JOB_PROFILES.items():
        required = details["required"]
        # Find matching skills
        matching = [s for s in required if s.lower() in user_skill_names]
        missing = [s for s in required if s.lower() not in user_skill_names]
        
        # Calculate readiness percentage
        readiness_pct = int((len(matching) / len(required)) * 100) if required else 0
        
        # Filter recommendations based on missing skills
        recs_certs = details["recommended_certs"]
        recs_projs = details["recommended_projects"]
        
        analysis.append({
            "job_profile": profile,
            "readiness_score": readiness_pct,
            "matching_skills": matching,
            "missing_skills": missing,
            "recommended_certifications": recs_certs[:2] if missing else ["Profile complete for this role!"],
            "recommended_projects": recs_projs[:2] if missing else ["Build advanced custom projects!"],
            "recommended_internships": [f"Apply for Junior {profile} Internships on LinkedIn or Indeed"]
        })
        
    # Calculate overall job readiness
    overall_readiness = int(sum(a["readiness_score"] for a in analysis) / len(analysis)) if analysis else 0

    return {
        "job_readiness_score": overall_readiness,
        "role_readiness_breakdown": analysis,
        "career_advice": "Focus on building one end-to-end project to demonstrate your missing skills. Having verified projects is the fastest way to get noticed by recruiters!"
    }
