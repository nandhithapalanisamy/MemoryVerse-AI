import re
import json
import logging
import datetime

from typing import Any, Dict, List, Optional, Tuple
import urllib.request
from backend.app.config import settings

logger = logging.getLogger("memoryverse.nlp")

# Curated lists of technical skills for extraction
TECH_SKILLS = [
    "python", "java", "javascript", "typescript", "c++", "c#", "ruby", "go", "rust", "php", "swift", "kotlin", "scala",
    "html", "css", "sql", "nosql", "mongodb", "postgresql", "mysql", "sqlite", "redis", "cassandra", "neo4j",
    "react", "angular", "vue", "next.js", "nuxt.js", "svelte", "express", "django", "flask", "fastapi", "spring boot",
    "git", "github", "docker", "kubernetes", "aws", "azure", "gcp", "firebase", "jenkins", "terraform", "ansible",
    "pytorch", "tensorflow", "keras", "scikit-learn", "numpy", "pandas", "scipy", "nltk", "spacy", "opencv",
    "tesseract", "langchain", "llama", "bert", "gpt", "rag", "vector database", "chromadb", "weaviate", "pinecone",
    "machine learning", "deep learning", "natural language processing", "computer vision", "artificial intelligence",
    "agile", "scrum", "jira", "ci/cd", "rest api", "graphql", "web scraping", "linux", "unix", "bash", "powershell"
]

class NLPService:
    @staticmethod
    def categorize_and_extract(text: str, filename: str) -> Dict[str, Any]:
        """
        Main entry point that first tries to call an LLM (OpenAI or Ollama)
        and falls back to rule-based parsing if no LLM is configured or if the API call fails.
        """
        # 1. Try OpenAI if configured
        if settings.OPENAI_API_KEY:
            try:
                res = NLPService._extract_with_openai(text, filename)
                if "metadata" not in res:
                    res["metadata"] = {}
                if "document_title" not in res["metadata"] or not res["metadata"]["document_title"]:
                    res["metadata"]["document_title"] = NLPService._extract_semantic_title(text, filename, res.get("category", "Resume"))
                return res
            except Exception as e:
                logger.error(f"OpenAI extraction failed: {str(e)}. Falling back to local rules.")

        # 2. Try Ollama if configured and reachable
        if settings.OLLAMA_HOST and not settings.OPENAI_API_KEY:
            try:
                res = NLPService._extract_with_ollama(text, filename)
                if "metadata" not in res:
                    res["metadata"] = {}
                if "document_title" not in res["metadata"] or not res["metadata"]["document_title"]:
                    res["metadata"]["document_title"] = NLPService._extract_semantic_title(text, filename, res.get("category", "Resume"))
                return res
            except Exception as e:
                logger.debug(f"Ollama extraction failed: {str(e)}. Falling back to local rules.")

        # 3. Fallback to local heuristic extraction
        return NLPService._extract_with_rules(text, filename)

    @staticmethod
    def _extract_with_rules(text: str, filename: str) -> Dict[str, Any]:
        """
        Extracts information using regex and dictionary lookups.
        """
        text_lower = text.lower()
        
        # 1. Determine Category
        category = "Resume" # Default
        cat_scores = {
            "Resume": 0,
            "Certificate": 0,
            "Project": 0,
            "Internship Letter": 0,
            "Research Paper": 0,
            "Marksheet": 0,
            "Achievement": 0,
            "Recommendation Letter": 0
        }

        # Scoring heuristics
        if any(w in text_lower for w in ["resume", "cv", "curriculum vitae", "work experience", "education", "hobbies"]):
            cat_scores["Resume"] += 5
        if any(w in text_lower for w in ["certificate", "certification", "certified", "credential", "successfully completed"]):
            cat_scores["Certificate"] += 7
        if any(w in text_lower for w in ["project report", "methodology", "system architecture", "proposed system", "implementation", "literature survey", "problem statement"]):
            cat_scores["Project"] += 12
        if any(w in text_lower for w in ["internship", "intern", "trainee", "training letter", "stipend", "completion letter"]):
            cat_scores["Internship Letter"] += 12
        if any(w in text_lower for w in ["research paper", "abstract", "proceedings", "journal", "ieee", "doi:", "authors"]):
            cat_scores["Research Paper"] += 8
        if any(w in text_lower for w in ["marksheet", "transcript", "grade sheet", "cgpa", "gpa", "sgpa", "marks", "percentage", "semester"]):
            cat_scores["Marksheet"] += 8
        if any(w in text_lower for w in ["recommendation", "letter of recommendation", "recommend", "he is", "she is", "endorse"]):
            cat_scores["Recommendation Letter"] += 6
        if any(w in text_lower for w in ["achievement", "award", "winner", "won", "hackathon", "first place", "runner-up", "certificate of appreciation"]):
            cat_scores["Achievement"] += 5

        # Check filename hints
        fn_lower = filename.lower()
        if "resume" in fn_lower or "cv" in fn_lower:
            cat_scores["Resume"] += 15
        if "cert" in fn_lower:
            cat_scores["Certificate"] += 10
        if "project" in fn_lower or "report" in fn_lower:
            cat_scores["Project"] += 15
        if "intern" in fn_lower:
            cat_scores["Internship Letter"] += 15
        if "paper" in fn_lower or "research" in fn_lower:
            cat_scores["Research Paper"] += 10
        if "mark" in fn_lower or "grade" in fn_lower or "transcript" in fn_lower:
            cat_scores["Marksheet"] += 10
        if "recommend" in fn_lower or "lor" in fn_lower:
            cat_scores["Recommendation Letter"] += 10
        if "award" in fn_lower or "win" in fn_lower or "hackathon" in fn_lower:
            cat_scores["Achievement"] += 10

        # Fine-tune Certificate vs Internship Letter overlap
        if "intern" in text_lower and any(w in text_lower for w in ["certificate", "completion", "certified", "successfully completed"]):
            cat_scores["Internship Letter"] += 10
        if "intern" in fn_lower and any(w in fn_lower for w in ["certificate", "completion"]):
            cat_scores["Internship Letter"] += 15

        category = max(cat_scores, key=cat_scores.get)

        # 2. Extract Generic Entities
        # Skills
        extracted_skills = []
        for skill in TECH_SKILLS:
            # Word boundary matching
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, text_lower):
                extracted_skills.append(skill.capitalize())

        # Dates / Years
        years = [int(y) for y in re.findall(r'\b(20\d{2})\b', text)]
        years = list(set(years))
        years.sort()
        year = years[-1] if years else datetime.datetime.now().year

        # Email / URL / Contact info
        emails = re.findall(r'[\w\.-]+@[\w\.-]+\.\w+', text)
        email = emails[0] if emails else None
        
        urls = re.findall(r'https?://[^\s<>"]+|www\.[^\s<>"]+', text)
        url = urls[0] if urls else None

        # Grades / CGPA
        gpa_match = re.search(r'\b(?:cgpa|gpa|sgpa):?\s*(\d+(?:\.\d+)?)\b', text_lower)
        grade = gpa_match.group(1) if gpa_match else None

        # 3. Extracted Details & Title
        document_title = NLPService._extract_semantic_title(text, filename, category)

        result = {
            "category": category,
            "skills": extracted_skills,
            "emails": emails,
            "urls": urls,
            "year": year,
            "metadata": {
                "name": NLPService._extract_name(text),
                "organization": NLPService._extract_org(text),
                "date": f"{year}" if year else "",
                "grade": grade,
                "document_title": document_title,
                "description": text[:500] + "..." if len(text) > 500 else text
            }
        }

        # Refining categories
        if category == "Certificate":
            result["metadata"]["certificate_name"] = document_title
            result["metadata"]["authority"] = result["metadata"]["organization"] or "Online Provider"
            result["metadata"]["credential_id"] = re.search(r'id:\s*(\w+)', text_lower).group(1) if re.search(r'id:\s*(\w+)', text_lower) else ""
        elif category == "Project":
            result["metadata"]["project_name"] = document_title
            result["metadata"]["technologies"] = ", ".join(extracted_skills[:5])
        elif category == "Internship Letter":
            # Extract role
            role_match = re.search(r'role:\s*([\w\s]+)', text_lower)
            if role_match:
                result["metadata"]["role"] = role_match.group(1).strip().title()
            else:
                role_match = re.search(r'\b([a-zA-Z]+(?:\s+[a-zA-Z]+){0,2})\s+intern\b', text_lower)
                if role_match:
                    role_str = role_match.group(1).strip()
                    stop_words = {"worked", "as", "an", "a", "the", "he", "she", "completed", "his", "her", "their", "is", "was"}
                    role_words = [w for w in role_str.split() if w not in stop_words]
                    result["metadata"]["role"] = f"{' '.join(role_words).title()} Intern" if role_words else "Intern"
                else:
                    role_match = re.search(r'\binternship\s+in\s+([a-zA-Z]+(?:\s+[a-zA-Z]+){0,1})\b', text_lower)
                    result["metadata"]["role"] = f"{role_match.group(1).strip().title()} Intern" if role_match else "Intern"
            result["metadata"]["organization"] = result["metadata"]["organization"] or "Company"
        elif category == "Achievement":
            result["metadata"]["achievement_title"] = document_title
            result["metadata"]["organization"] = result["metadata"]["organization"] or "Event Host"

        return result

    @staticmethod
    def _extract_semantic_title(text: str, filename: str, category: str) -> str:
        """
        Extracts a clean, human-readable title based on document content.
        """
        import os
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        text_lower = text.lower()
        
        # Clean fallback filename (e.g. smart_yield.pdf -> Smart Yield)
        fallback_title = os.path.splitext(filename)[0].replace("_", " ").replace("-", " ")
        fallback_title = " ".join([w.capitalize() for w in fallback_title.split()])

        if not lines:
            return fallback_title

        if category == "Resume":
            for line in lines[:5]:
                if len(line) < 30 and not any(w in line.lower() for w in ["resume", "cv", "curriculum", "email", "phone", "contact"]):
                    return f"{line.strip()} Resume"
            return f"Resume Document"

        elif category == "Project":
            # 1. Look for Cover Page Title patterns
            for idx, line in enumerate(lines[:15]):
                line_lower = line.lower()
                if any(p in line_lower for p in ["project report on", "a project on", "report on", "title:"]):
                    # Look at the next few lines for the actual title
                    for next_line in lines[idx+1:idx+4]:
                        if len(next_line) > 5 and not any(w in next_line.lower() for w in ["submitted", "by", "under", "in partial", "department", "degree", "guided", "mentor"]):
                            return next_line.strip()
            
            # 2. Look for first line with multiple words in ALL CAPS (usually cover page title)
            for line in lines[:10]:
                if line.isupper() and 3 < len(line.split()) < 10:
                    return line.strip()

            return fallback_title

        elif category == "Internship Letter":
            org = None
            role = "Internship"
            
            # Org extraction regex (matching capitalized proper nouns preceding business suffixes)
            org_match = re.search(r'\b([A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*){0,2}\s+(?:Technologies|Labs|Solutions|Pvt\s+Ltd|Ltd|Inc|Corp|Corporation))\b', text)
            if org_match:
                org = org_match.group(1).strip()
            else:
                # Fallback to line search
                org_keywords = ["technologies", "labs", "solutions", "pvt", "ltd", "inc", "corporation", "software", "university", "institute"]
                for line in lines[:10]:
                    if any(kw in line.lower() for kw in org_keywords) and len(line) < 60:
                        org = line.strip()
                        break
            
            # Role extraction patterns: match at most 3 words before "intern" or "internship"
            role_match = re.search(r'\b([a-zA-Z]+(?:\s+[a-zA-Z]+){0,3})\s+(?:internship|intern)\b', text_lower)
            if role_match:
                role_str = role_match.group(1).strip()
                stop_words = {"worked", "as", "an", "a", "the", "he", "she", "completed", "his", "her", "their", "is", "was", "completed", "successful", "successfully"}
                role_words = [w for w in role_str.split() if w not in stop_words]
                if role_words:
                    role = f"{' '.join(role_words).title()} Intern"
                else:
                    role = "Intern"
            else:
                role_match = re.search(r'\binternship\s+in\s+([a-zA-Z]+(?:\s+[a-zA-Z]+){0,1})\b', text_lower)
                if role_match:
                    role = f"{role_match.group(1).strip().title()} Intern"
            
            if org:
                clean_org = re.sub(r'(?i)\b(pvt|ltd|pvt\s+ltd|inc|llp|solutions|technologies)\b.*', '', org).strip()
                clean_org = clean_org.strip(",. ")
                return f"{clean_org} {role} Certificate"
            
            if "certificate" in fallback_title.lower() or "letter" in fallback_title.lower():
                return f"{role} Certificate"
            return f"{fallback_title} {role} Certificate"

        elif category == "Certificate":
            cert_name = None
            for idx, line in enumerate(lines[:10]):
                line_lower = line.lower()
                if any(p in line_lower for p in ["successfully completed", "certificate of", "certified in", "completion of"]):
                    # Look at next lines
                    for next_line in lines[idx+1:idx+3]:
                        if 2 < len(next_line.split()) < 10:
                            cert_name = next_line.strip()
                            break
                    if cert_name:
                        break

            org = None
            org_keywords = ["coursera", "udemy", "microsoft", "google", "aws", "oracle", "cisco", "nptel", "great learning", "simplilearn"]
            for kw in org_keywords:
                if kw in text_lower:
                    org = kw.upper() if len(kw) <= 5 else kw.title()
                    break

            if cert_name:
                if org:
                    return f"{org} {cert_name} Certificate"
                return f"{cert_name} Certificate"
            
            if "certificate" in fallback_title.lower():
                return f"{fallback_title}"
            return f"{fallback_title} Certificate"

        elif category == "Research Paper":
            for line in lines[:5]:
                if len(line.split()) > 3 and len(line) < 100:
                    return line.strip()
            return fallback_title

        return fallback_title

    @staticmethod
    def _extract_name(text: str) -> Optional[str]:
        # Simple heuristic to extract a possible title/name at the beginning
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        for line in lines[:3]:
            if len(line) < 50 and not any(w in line.lower() for w in ["resume", "cv", "curriculum", "page", "email", "phone"]):
                return line
        return "Document Entry"

    @staticmethod
    def _extract_org(text: str) -> Optional[str]:
        org_keywords = ["university", "institute", "college", "corporation", "inc.", "ltd", "google", "microsoft", "coursera", "udemy", "hackerearth", "hackerrank"]
        for line in text.split("\n"):
            line_l = line.lower()
            if any(kw in line_l for kw in org_keywords):
                if len(line.strip()) < 80:
                    return line.strip()
        return None

    @staticmethod
    def _extract_with_openai(text: str, filename: str) -> Dict[str, Any]:
        # Simple URL-based post to OpenAI API to keep it simple and clean
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}"
        }
        
        prompt = f"""
        Analyze the following text extracted from a student document ({filename}).
        Categorize the document into one of these: Resume, Certificate, Project, Internship Letter, Research Paper, Marksheet, Achievement, Recommendation Letter.
        Extract the following attributes:
        - Category
        - Identified Skills (list of programming languages, tools, frameworks)
        - Specific attributes depending on the category:
          * Resume: name, email, skills, experience (list of company, role, duration), projects (list of name, technologies)
          * Certificate: name, authority (issuer), date, credential_id, url
          * Project: project_name, technologies (comma separated), description, organization, url, date
          * Internship Letter: role, organization, start_date, end_date, description, responsibilities
          * Marksheet: institute, marks/grade/GPA, date, semester
          * Achievement: title, organization, date, description
          * Recommendation Letter: recommender, organization, content_summary
          
        Text:
        {text[:4000]}
        
        Respond ONLY with a valid JSON object matching this structure:
        {{
           "category": "...",
           "skills": ["...", "..."],
           "year": 202X,
           "emails": ["..."],
           "urls": ["..."],
           "metadata": {{
               // Specific attributes as requested above, e.g., name, organization, date, etc.
           }}
        }}
        """
        
        data = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": "You are a highly precise document parser. Respond only with JSON."},
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1
        }
        
        req = urllib.request.Request(
            url, 
            data=json.dumps(data).encode("utf-8"),
            headers=headers,
            method="POST"
        )
        
        with urllib.request.urlopen(req, timeout=15) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            content = res_body["choices"][0]["message"]["content"]
            return json.loads(content)

    @staticmethod
    def _extract_with_ollama(text: str, filename: str) -> Dict[str, Any]:
        url = f"{settings.OLLAMA_HOST}/api/chat"
        prompt = f"""
        Analyze this student document text ({filename}).
        Categorize into: Resume, Certificate, Project, Internship Letter, Research Paper, Marksheet, Achievement, Recommendation Letter.
        Extract attributes (Category, Skills, metadata like name, organization, date, GPA, etc.).
        
        Text:
        {text[:2000]}
        
        Respond ONLY with a valid JSON object matching this structure:
        {{
           "category": "...",
           "skills": ["...", "..."],
           "year": 202X,
           "emails": ["..."],
           "urls": ["..."],
           "metadata": {{
               "name": "...",
               "organization": "...",
               "date": "..."
           }}
        }}
        """
        
        data = {
            "model": "llama3",
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "stream": False,
            "format": "json"
        }
        
        req = urllib.request.Request(
            url, 
            data=json.dumps(data).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        
        with urllib.request.urlopen(req, timeout=15) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            content = res_body["message"]["content"]
            return json.loads(content)
            
    @staticmethod
    def generate_rag_response(user_query: str, retrieved_docs: List[Dict[str, Any]], chat_history: List[Dict[str, str]] = None) -> str:
        """
        Generates a RAG response based on retrieved document text. Falls back to local prompt format.
        """
        context = "\n\n".join([f"Document: {d['filename']}\nCategory: {d['category']}\nContent: {d['text'][:1000]}" for d in retrieved_docs])
        
        history_str = ""
        if chat_history:
            history_str = "\n".join([f"{h['role'].capitalize()}: {h['content']}" for h in chat_history[-5:]])

        # Try LLM
        if settings.OPENAI_API_KEY:
            try:
                url = "https://api.openai.com/v1/chat/completions"
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {settings.OPENAI_API_KEY}"
                }
                data = {
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": "You are MemoryVerse AI Chatbot, an assistant helping students navigate their academic and career achievements using their documents as ground truth. Answer questions based on the retrieved context."},
                        {"role": "user", "content": f"Chat History:\n{history_str}\n\nContext:\n{context}\n\nQuestion: {user_query}\nAnswer:"}
                    ],
                    "temperature": 0.5
                }
                req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers, method="POST")
                with urllib.request.urlopen(req, timeout=15) as response:
                    res_body = json.loads(response.read().decode("utf-8"))
                    return res_body["choices"][0]["message"]["content"]
            except Exception as e:
                logger.error(f"OpenAI RAG generation failed: {str(e)}")

        # Heuristic fallback (answering using keyword matches in retrieved context)
        # We will parse the content and summarize findings
        if not retrieved_docs:
            return "I couldn't find any documents in your MemoryVerse database matching that query. Try uploading more certificates or resumes!"
            
        # Analyze retrieved docs
        ans = f"Based on your documents, here is what I found:\n\n"
        for doc in retrieved_docs:
            ans += f"📄 **{doc['filename']}** ({doc['category']}):\n"
            # Find matching sentences
            query_words = [w for w in user_query.lower().split() if len(w) > 3]
            sentences = doc['text'].split("\n")
            matches = []
            for s in sentences:
                if any(qw in s.lower() for qw in query_words):
                    matches.append(s.strip())
            if matches:
                ans += "  - " + "\n  - ".join(matches[:3]) + "\n"
            else:
                ans += f"  - Contains references to: {', '.join(doc.get('skills', [])[:5])}\n"
                
        ans += "\nLet me know if you would like me to compile these details into an ATS resume or a public portfolio website!"
        return ans
