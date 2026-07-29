from pydantic import BaseModel, EmailStr
from typing import Optional, List
import datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

# Settings Schemas
class SettingBase(BaseModel):
    theme: str = "dark"
    language: str = "en"
    privacy: str = "private"

class SettingUpdate(BaseModel):
    theme: Optional[str] = None
    language: Optional[str] = None
    privacy: Optional[str] = None

class SettingResponse(SettingBase):
    id: int
    user_id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

# Document Schemas
class DocumentBase(BaseModel):
    filename: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    category: Optional[str] = None

class DocumentResponse(DocumentBase):
    id: int
    user_id: int
    file_path: str
    ocr_text: Optional[str] = None
    version: int
    parent_id: Optional[int] = None
    status: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class DocumentUpdate(BaseModel):
    category: Optional[str] = None
    status: Optional[str] = None

# Skill Schemas
class SkillBase(BaseModel):
    name: str
    category: Optional[str] = None
    proficiency: str = "Intermediate"

class SkillCreate(SkillBase):
    source_doc_id: Optional[int] = None

class SkillResponse(SkillBase):
    id: int
    user_id: int
    source_doc_id: Optional[int] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Project Schemas
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    technologies: Optional[str] = None
    organization: Optional[str] = None
    date: Optional[str] = None
    url: Optional[str] = None

class ProjectCreate(ProjectBase):
    source_doc_id: Optional[int] = None

class ProjectResponse(ProjectBase):
    id: int
    user_id: int
    source_doc_id: Optional[int] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Certificate Schemas
class CertificateBase(BaseModel):
    name: str
    authority: Optional[str] = None
    date: Optional[str] = None
    url: Optional[str] = None
    credential_id: Optional[str] = None

class CertificateCreate(CertificateBase):
    source_doc_id: Optional[int] = None

class CertificateResponse(CertificateBase):
    id: int
    user_id: int
    source_doc_id: Optional[int] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Internship Schemas
class InternshipBase(BaseModel):
    role: str
    organization: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None
    responsibilities: Optional[str] = None

class InternshipCreate(InternshipBase):
    source_doc_id: Optional[int] = None

class InternshipResponse(InternshipBase):
    id: int
    user_id: int
    source_doc_id: Optional[int] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Achievement Schemas
class AchievementBase(BaseModel):
    title: str
    description: Optional[str] = None
    date: Optional[str] = None
    organization: Optional[str] = None

class AchievementCreate(AchievementBase):
    source_doc_id: Optional[int] = None

class AchievementResponse(AchievementBase):
    id: int
    user_id: int
    source_doc_id: Optional[int] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Timeline Schemas
class TimelineBase(BaseModel):
    year: int
    event_title: str
    event_type: str
    description: Optional[str] = None
    date: Optional[str] = None

class TimelineCreate(TimelineBase):
    source_doc_id: Optional[int] = None

class TimelineResponse(TimelineBase):
    id: int
    user_id: int
    source_doc_id: Optional[int] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Knowledge Graph Schemas
class KnowledgeGraphBase(BaseModel):
    source_node: str
    source_type: str
    target_node: str
    target_type: str
    relationship_type: str

class KnowledgeGraphResponse(KnowledgeGraphBase):
    id: int
    user_id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Chat Schemas
class ChatMessageBase(BaseModel):
    role: str
    content: str

class ChatMessageCreate(BaseModel):
    content: str

class ChatMessageResponse(ChatMessageBase):
    id: int
    user_id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Notification Schemas
class NotificationBase(BaseModel):
    type: str
    message: str
    read: bool = False

class NotificationResponse(NotificationBase):
    id: int
    user_id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Dashboard Stats Schema
class DashboardStats(BaseModel):
    career_score: int
    total_documents: int
    certificates_count: int
    projects_count: int
    internships_count: int
    skills_detected: int
    achievements_count: int
    recent_insights: List[str]
