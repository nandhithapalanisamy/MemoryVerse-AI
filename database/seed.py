import os
import sys
import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Append parent directory to search path
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

from backend.app.db.models import Base, User, Skill, Project, Certificate, Internship, Achievement, Timeline, KnowledgeGraph, Setting, Notification
from backend.app.routers.auth import get_password_hash
from backend.app.config import settings

DATABASE_URL = settings.DATABASE_URL

def seed_database():
    engine = create_engine(DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()
    
    try:
        # Check if database is already initialized with ANY user
        user_count = db.query(User).count()
        if user_count > 0:
            print("Database already initialized with users. Skipping seeding.")
            return

        # 1. Create Mock User
        user = User(
            email="student@university.edu",
            hashed_password=get_password_hash("password123"),
            full_name="Nandha Kumar"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # 2. Add Settings
        setting = Setting(user_id=user.id, theme="dark", language="en", privacy="private")
        db.add(setting)

        # 3. Add Skills
        skills = [
            Skill(user_id=user.id, name="Python", category="Language", proficiency="Advanced"),
            Skill(user_id=user.id, name="Javascript", category="Language", proficiency="Intermediate"),
            Skill(user_id=user.id, name="React", category="Framework", proficiency="Intermediate"),
            Skill(user_id=user.id, name="FastAPI", category="Framework", proficiency="Intermediate"),
            Skill(user_id=user.id, name="Machine Learning", category="Concept", proficiency="Advanced"),
            Skill(user_id=user.id, name="Docker", category="Tool", proficiency="Intermediate"),
        ]
        db.add_all(skills)

        # 4. Add Projects
        projects = [
            Project(
                user_id=user.id,
                name="AI Customer Support Agent",
                description="Built a RAG chatbot using LangChain, OpenAI, and ChromaDB to answer domain specific questions.",
                technologies="Python, FastAPI, LangChain, ChromaDB",
                organization="University Project",
                date="2025-11-20",
                url="https://github.com/student/ai-support"
            ),
            Project(
                user_id=user.id,
                name="MemoryVerse Web Portal",
                description="Full stack dashboard using React, Tailwind CSS, and FastAPI for managing student documents.",
                technologies="React, Javascript, Tailwind, FastAPI",
                organization="Personal",
                date="2026-06-15",
                url="https://github.com/student/memoryverse"
            )
        ]
        db.add_all(projects)

        # 5. Add Certificates
        certs = [
            Certificate(
                user_id=user.id,
                name="Deep Learning Specialization",
                authority="DeepLearning.AI (Coursera)",
                date="2025-05-14",
                credential_id="DL1029384"
            ),
            Certificate(
                user_id=user.id,
                name="AWS Certified Solutions Architect",
                authority="Amazon Web Services",
                date="2026-02-10",
                credential_id="AWS-ARCH-992"
            )
        ]
        db.add_all(certs)

        # 6. Add Internships
        internships = [
            Internship(
                user_id=user.id,
                role="Machine Learning Intern",
                organization="NeuroTech Labs",
                start_date="2025-06-01",
                end_date="2025-08-31",
                description="Engineered computer vision pipelines for automatic object sorting using OpenCV and PyTorch.",
                responsibilities="Built YOLO v8 models, cleaned label datasets, optimized model latency by 20% using TensorRT."
            )
        ]
        db.add_all(internships)

        # 7. Add Achievements
        achievements = [
            Achievement(
                user_id=user.id,
                title="Winner - National Smart India Hackathon",
                description="Designed an automatic document classification and extraction portal for regional court cases.",
                date="2025-10-18",
                organization="Ministry of Education"
            )
        ]
        db.add_all(achievements)

        # 8. Add Timeline Items
        timeline_items = [
            Timeline(user_id=user.id, year=2025, event_title="Deep Learning Specialization", event_type="Certificate", description="Completed specialization on deep neural networks.", date="2025-05"),
            Timeline(user_id=user.id, year=2025, event_title="NeuroTech Labs Internship", event_type="Internship", description="Worked as Machine Learning intern.", date="2025-06"),
            Timeline(user_id=user.id, year=2025, event_title="Hackathon Winner", event_type="Achievement", description="Won national smart india hackathon.", date="2025-10"),
            Timeline(user_id=user.id, year=2025, event_title="AI Customer Support Agent", event_type="Project", description="Created LangChain-based RAG support system.", date="2025-11"),
            Timeline(user_id=user.id, year=2026, event_title="AWS Architect Certificate", event_type="Certificate", description="Passed AWS solutions architect exam.", date="2026-02"),
            Timeline(user_id=user.id, year=2026, event_title="MemoryVerse Web Portal", event_type="Project", description="Launched personal digital identity operating system.", date="2026-06"),
        ]
        db.add_all(timeline_items)

        # 9. Add Knowledge Graph Relationships
        relations = [
            KnowledgeGraph(user_id=user.id, source_node="Python", source_type="Skill", target_node="AI Customer Support Agent", target_type="Project", relationship_type="USES"),
            KnowledgeGraph(user_id=user.id, source_node="FastAPI", source_type="Skill", target_node="AI Customer Support Agent", target_type="Project", relationship_type="USES"),
            KnowledgeGraph(user_id=user.id, source_node="Python", source_type="Skill", target_node="Deep Learning Specialization", target_type="Certificate", relationship_type="PROVES"),
            KnowledgeGraph(user_id=user.id, source_node="Machine Learning", source_type="Skill", target_node="NeuroTech Labs", target_type="Internship", relationship_type="GAINED_AT"),
            KnowledgeGraph(user_id=user.id, source_node="Docker", source_type="Skill", target_node="AWS Certified Solutions Architect", target_type="Certificate", relationship_type="PROVES"),
            KnowledgeGraph(user_id=user.id, source_node="React", source_type="Skill", target_node="MemoryVerse Web Portal", target_type="Project", relationship_type="USES"),
            KnowledgeGraph(user_id=user.id, source_node="Javascript", source_type="Skill", target_node="MemoryVerse Web Portal", target_type="Project", relationship_type="USES"),
        ]
        db.add_all(relations)

        # 10. Add Notification
        notif = Notification(
            user_id=user.id,
            type="System Initialized",
            message="Welcome to MemoryVerse AI! Your sample student records have been successfully seeded. Go ahead and chat with the AI assistant or preview your resume/portfolio."
        )
        db.add(notif)

        db.commit()
        print("Database successfully seeded with student data.")
        print("Credentials: Email: student@university.edu | Password: password123")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
