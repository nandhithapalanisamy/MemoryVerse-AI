from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any, List
from collections import Counter

from backend.app.db.database import get_db
from backend.app.db.models import User, Document, Skill, Project, Certificate, Internship, Achievement, Timeline
from backend.app.routers.auth import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["Analytics & Dashboard"])

@router.get("/dashboard-stats")
def get_dashboard_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 1. Count totals
    total_docs = db.query(Document).filter(Document.user_id == current_user.id).count()
    total_skills = db.query(Skill).filter(Skill.user_id == current_user.id).count()
    total_projects = db.query(Project).filter(Project.user_id == current_user.id).count()
    total_certs = db.query(Certificate).filter(Certificate.user_id == current_user.id).count()
    total_internships = db.query(Internship).filter(Internship.user_id == current_user.id).count()
    total_achievements = db.query(Achievement).filter(Achievement.user_id == current_user.id).count()
    
    # 2. Compute Career Score (Algorithm)
    # Start with base score of 30.
    # Add: 5 pts per skill (max 25), 10 pts per project (max 30), 15 pts per internship (max 30), 5 pts per certificate (max 15)
    skill_pts = min(total_skills * 5, 25)
    proj_pts = min(total_projects * 10, 30)
    intern_pts = min(total_internships * 15, 30)
    cert_pts = min(total_certs * 5, 15)
    
    career_score = min(30 + skill_pts + proj_pts + intern_pts + cert_pts, 100)
    
    # 3. Dynamic Recent Insights
    insights = []
    if career_score < 50:
        insights.append("Upload more projects or certificates to boost your career readiness score.")
    elif career_score < 85:
        insights.append("Your profile is looking strong! Consider adding an internship to break into the 80s.")
    else:
        insights.append("Outstanding career score! Your digital identity is highly professional and ATS-ready.")
        
    if total_skills == 0:
        insights.append("AI did not detect any technical skills yet. Add resumes or certifications to extract skills.")
    else:
        insights.append(f"AI extracted {total_skills} skills. Your primary domain looks like software engineering.")
        
    if total_certs > 0:
        insights.append(f"You have completed {total_certs} certifications! Your learning trend is upwards.")

    return {
        "career_score": career_score,
        "total_documents": total_docs,
        "certificates_count": total_certs,
        "projects_count": total_projects,
        "internships_count": total_internships,
        "skills_detected": total_skills,
        "achievements_count": total_achievements,
        "recent_insights": insights
    }

@router.get("/charts")
def get_analytics_charts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 1. Skills distribution
    skills = db.query(Skill).filter(Skill.user_id == current_user.id).all()
    # Categorize skills dynamically
    skills_map = {
        "Languages": ["Python", "Java", "Javascript", "Typescript", "C++", "C#", "Go", "Rust", "Php", "Swift", "Kotlin", "Scala", "Html", "Css", "Sql"],
        "Frameworks & Libraries": ["React", "Angular", "Vue", "Next.js", "Nuxt.js", "Svelte", "Express", "Django", "Flask", "Fastapi", "Spring Boot", "Pytorch", "Tensorflow", "Keras", "Scikit-learn", "Numpy", "Pandas", "Scipy", "Nltk", "Spacy", "Opencv", "Langchain"],
        "Tools & Platforms": ["Git", "Github", "Docker", "Kubernetes", "Aws", "Azure", "Gcp", "Firebase", "Jenkins", "Terraform", "Ansible", "Jira"],
        "Concepts": ["Machine Learning", "Deep Learning", "Natural Language Processing", "Computer Vision", "Artificial Intelligence", "Rag", "Vector Database"]
    }
    
    distribution = Counter()
    for s in skills:
        matched = False
        for category, list_s in skills_map.items():
            if s.name in list_s or s.name.capitalize() in list_s or s.name.lower() in [x.lower() for x in list_s]:
                distribution[category] += 1
                matched = True
                break
        if not matched:
            distribution["Other Skills"] += 1
            
    skills_chart = [{"name": k, "value": v} for k, v in distribution.items()]
    if not skills_chart:
        skills_chart = [{"name": "No Skills", "value": 0}]

    # 2. Certificates by year
    certs = db.query(Certificate).filter(Certificate.user_id == current_user.id).all()
    years_count = Counter()
    for c in certs:
        # try to parse year from date
        year = "2026"
        for y in ["2023", "2024", "2025", "2026"]:
            if y in str(c.date):
                year = y
                break
        years_count[year] += 1
        
    certs_chart = [{"year": k, "count": v} for k, v in sorted(years_count.items())]
    if not certs_chart:
        certs_chart = [{"year": "2026", "count": 0}]

    # 3. Projects by domain
    projects = db.query(Project).filter(Project.user_id == current_user.id).all()
    domains = Counter()
    for p in projects:
        desc = (p.description or "").lower()
        tech = (p.technologies or "").lower()
        if "ml" in desc or "machine learning" in desc or "deep learning" in desc or "ai" in desc or "pytorch" in tech or "tensorflow" in tech:
            domains["AI & Machine Learning"] += 1
        elif "react" in tech or "angular" in tech or "vue" in tech or "frontend" in desc or "css" in tech:
            domains["Frontend Web"] += 1
        elif "node" in tech or "django" in tech or "fastapi" in tech or "flask" in tech or "sql" in tech or "backend" in desc:
            domains["Backend Dev"] += 1
        else:
            domains["General Engineering"] += 1
            
    projects_chart = [{"domain": k, "count": v} for k, v in domains.items()]
    if not projects_chart:
        projects_chart = [{"domain": "No Projects", "count": 0}]

    return {
        "skills_distribution": skills_chart,
        "certs_by_year": certs_chart,
        "projects_by_domain": projects_chart
    }
