# MemoryVerse AI – AI-Powered Digital Identity & Knowledge Repository

MemoryVerse AI is a production-ready, full-stack personal Operating System designed to help students curate, structure, search, and visualize their academic and professional digital identity. 

Instead of treating documents as passive files in folder archives, MemoryVerse AI reads uploaded files (Resumes, Certificates, Project Reports, Internships, Marksheets, Achievements) using OCR and NLP, categorizes them automatically, registers extracted skills, maps visual career relationships (Knowledge Graph), creates an animated Digital Journey Timeline, and supports semantic query answering using Retrieval-Augmented Generation (RAG).

---

## 🚀 Key Modules & Features

1. **Secure Authentication (Module 1):** JWT token authorizations, encrypted passwords (bcrypt), profile management, and a persistent dark mode toggle.
2. **Interactive Dashboard (Module 2):** Quick stats, Career Readiness Score calculation, dynamic AI career summaries, and upload trends.
3. **Upload Center (Module 3):** Drag-and-drop file imports (PDF, DOCX, ZIP, PPT, PNG, JPG) and URL references (GitHub, Portfolio, LinkedIn) with version control.
4. **AI Processing & OCR (Module 4):** Text extractions via PyMuPDF / docx and PyTesseract OCR. Details like skills, marks, dates, and organizations are automatically extracted.
5. **Intelligent Categorization (Module 5):** Automated folder mapping into Projects, Skills, Certificates, Internships, Academics, and Achievements.
6. **Interactive Knowledge Graph (Module 6):** Canvas SVG-based node-link chart illustrating dependencies (e.g. `Python Skill -> Uses -> AI Project -> Gained At -> Company Internship`).
7. **Journey Timeline (Module 7):** Beautiful, chronologically-ordered vertical timeline showing student milestones by year with micro-animations.
8. **Semantic Search (Module 8):** Vector search similarity index (Sentence-Transformers + ChromaDB) allowing students to query documents by natural concepts.
9. **RAG AI Assistant (Module 9):** Intelligent chat screen integrating LangChain-style prompts. Suggests learning paths and reviews missing skill profiles.
10. **ATS Resume Builder (Module 10):** Direct Word (`.docx`) resume downloads pre-seeded with extracted credentials.
11. **One-Click Portfolio Generator (Module 11):** Downloadable ZIP web bundle containing an interactive, Tailwind-powered static website.
12. **Analytics & Insights (Modules 12 & 13):** Radar skills mapping, pie charts by domain, and role readiness breakdowns for web, ML, and cloud roles.

---

## 🛠️ Technology Stack

- **Frontend:** React.js, Vite, Tailwind CSS, Framer Motion, Recharts, React Icons, Axios, React Router.
- **Backend:** FastAPI, Python, Uvicorn, SQLAlchemy.
- **Database:** PostgreSQL (with a self-initializing SQLite engine fallback).
- **Vector DB:** ChromaDB (with local TF-IDF similarity fallback).
- **AI Processing:** Sentence Transformers (`all-MiniLM-L6-v2`), Tesseract OCR, PyMuPDF, `python-docx`, `python-pptx`, Regex Heuristics.

---

## 📐 System Architecture & AI Workflow

```mermaid
flowchart TD
    A[Upload File / URL] --> B[Parser Service: PDF/Docx/Image]
    B --> C[PyTesseract OCR / PDF Text Extraction]
    C --> D[NLP Service: Entity & Skill Extraction]
    D --> E[Embeddings Generation: Sentence Transformers]
    E --> F[Vector DB: ChromaDB / SQLite fallback]
    D --> G[Database Tables: Skills/Projects/Certs]
    G --> H[Knowledge Graph Mapper]
    G --> I[Journey Timeline Builder]
    F --> J[Semantic Search Controller]
    F & J --> K[RAG AI Chatbot Assistant]
```

---

## 💻 Running the Application

### ⚡ One-Click Startup (Recommended for Windows)
If you are on Windows, we provide a unified startup batch script that automatically sets up and runs the entire stack simultaneously:
1. Ensure your PostgreSQL server is running and you have created a database:
   ```sql
   CREATE DATABASE memoryverse;
   ```
2. Double-click the **`run_all.bat`** file in the project root directory (or run `.\run_all.bat` in your PowerShell terminal).
3. The script will automatically:
   - Check and seed your PostgreSQL database with a default student profile (if empty).
   - Start the FastAPI backend server on `http://localhost:8000`.
   - Install frontend packages (on first run) and start the React client on `http://localhost:3000`.

---

## ⚙️ Environment Configuration

Create a `.env` file at the root of the project to set up variables:
```env
# Database Settings
DATABASE_URL=postgresql://postgres:password@localhost:5432/memoryverse

# JWT Authentication
JWT_SECRET=supersecretjwtkeychangeinproduction1234567890
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# OpenAI Integration (Optional: falls back to offline heuristic processing when empty)
OPENAI_API_KEY=sk-proj-...
```

---

## 🐳 Docker Deployment

To launch the entire containerized stack (PostgreSQL + FastAPI + React + ChromaDB):
```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

---

## 🧪 Verification and Usage Guide

1. **Sign Up & Login:** Create a new account or log in using the seeded test account:
   - **Email:** `student@university.edu`
   - **Password:** `password123`
2. **AI Document Processing:** Go to the Upload Center and upload a resume, certificate, or project report.
   - The system automatically extracts text using OCR (via Tesseract) or local Parsers.
   - It runs the NLP Pipeline to identify skills, CGPA, dates, and category.
   - **Semantic Title Extraction:** Instead of using the raw file name (like `project_report.pdf`), the AI extracts the document's actual title (e.g. `AI Powered Smart Yield Prediction System`) and updates the display filename.
3. **Context-Routing Chat Assistant:** Open the AI Chat Assistant. 
   - Ask specific questions like *"Summarize my project report"*.
   - The chatbot's intent router automatically identifies which document you are asking about, restricts search boundaries, and retrieves answers **only** from that file (preventing data mixing).
   - If a query is ambiguous (e.g., you have multiple projects and ask *"Explain my project"*), the chatbot will ask a clarification question listing your specific project titles.
4. **Knowledge Graph & Timeline:** Navigate to the respective sidebars to view your dynamic interactive node graph and your animated chronological vertical milestone timeline.
5. **ATS Resume & Portfolio Website:** Export a Word doc resume or download a static static portfolio web package.
