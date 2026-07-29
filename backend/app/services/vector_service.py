import os
import logging
from typing import List, Dict, Any, Optional
import numpy as np

# Try to import chromadb and sentence_transformers
try:
    import chromadb
    from sentence_transformers import SentenceTransformer
    CHROMA_AVAILABLE = True
except ImportError:
    CHROMA_AVAILABLE = False

logger = logging.getLogger("memoryverse.vector")

class VectorService:
    _encoder = None
    _chroma_client = None
    _collection = None

    @classmethod
    def initialize(cls):
        global CHROMA_AVAILABLE
        if not CHROMA_AVAILABLE:
            logger.warning("ChromaDB or SentenceTransformers not available. Falling back to local TF-IDF semantic search.")
            return

        try:
            # Initialize sentence transformer model
            logger.info("Initializing SentenceTransformer (all-MiniLM-L6-v2)...")
            cls._encoder = SentenceTransformer("all-MiniLM-L6-v2")
            
            # Initialize ChromaDB persistent client
            chroma_dir = "./database/chroma_db"
            os.makedirs(chroma_dir, exist_ok=True)
            cls._chroma_client = chromadb.PersistentClient(path=chroma_dir)
            cls._collection = cls._chroma_client.get_or_create_collection("student_documents")
            logger.info("ChromaDB initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB: {str(e)}. Falling back to TF-IDF semantic search.")
            CHROMA_AVAILABLE = False

    @classmethod
    def add_document(cls, user_id: int, doc_id: int, text: str, metadata: Dict[str, Any]):
        """
        Embeds a document and adds it to the vector store.
        """
        if not text or not text.strip():
            return

        # Initialize if not already done
        if cls._encoder is None and CHROMA_AVAILABLE:
            cls.initialize()

        if CHROMA_AVAILABLE and cls._collection is not None:
            try:
                # Chunk text if too long (e.g. 1000 characters chunks)
                chunks = cls._chunk_text(text, 1000)
                for idx, chunk in enumerate(chunks):
                    # Generate embedding
                    embedding = cls._encoder.encode(chunk).tolist()
                    
                    # Prepare meta
                    meta = {
                        "user_id": user_id,
                        "doc_id": doc_id,
                        "filename": metadata.get("filename", ""),
                        "category": metadata.get("category", ""),
                        "chunk_idx": idx
                    }
                    
                    cls._collection.add(
                        embeddings=[embedding],
                        documents=[chunk],
                        ids=[f"usr_{user_id}_doc_{doc_id}_chk_{idx}"],
                        metadatas=[meta]
                    )
                logger.info(f"Added document {doc_id} to ChromaDB with {len(chunks)} chunks.")
                return
            except Exception as e:
                logger.error(f"Error adding to ChromaDB: {str(e)}")

        # Fallback logging
        logger.info(f"Document {doc_id} registered for local text-match index search.")

    @classmethod
    def search_documents(cls, user_id: int, query: str, limit: int = 5, doc_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Searches documents for a user using query embedding.
        """
        if cls._encoder is None and CHROMA_AVAILABLE:
            cls.initialize()

        if CHROMA_AVAILABLE and cls._collection is not None:
            try:
                query_embedding = cls._encoder.encode(query).tolist()
                
                # Build where clause
                where_clause = {"user_id": user_id}
                if doc_id is not None:
                    where_clause["doc_id"] = doc_id
                    
                results = cls._collection.query(
                    query_embeddings=[query_embedding],
                    n_results=limit * 2 if doc_id is None else limit,
                    where=where_clause
                )
                
                hits = []
                if results and "documents" in results and results["documents"]:
                    docs = results["documents"][0]
                    metas = results["metadatas"][0]
                    distances = results["distances"][0] if "distances" in results else [0.0] * len(docs)
                    
                    for doc, meta, dist in zip(docs, metas, distances):
                        hits.append({
                            "doc_id": meta["doc_id"],
                            "filename": meta["filename"],
                            "category": meta["category"],
                            "text": doc,
                            "score": float(1.0 - dist)
                        })
                
                if doc_id is not None:
                    # Skip de-duplication to return multiple relevant chunks from the same document
                    return hits[:limit]
                
                # De-duplicate by doc_id to show top matching documents
                unique_hits = []
                seen_docs = set()
                for hit in hits:
                    if hit["doc_id"] not in seen_docs:
                        seen_docs.add(hit["doc_id"])
                        unique_hits.append(hit)
                    if len(unique_hits) >= limit:
                        break
                return unique_hits
            except Exception as e:
                logger.error(f"ChromaDB search failed: {str(e)}. Using local keyword fallback.")

        # Fallback to local keyword search (implemented below)
        return []

    @classmethod
    def _chunk_text(cls, text: str, chunk_size: int = 1000) -> List[str]:
        words = text.split()
        chunks = []
        current_chunk = []
        current_size = 0
        
        for word in words:
            current_chunk.append(word)
            current_size += len(word) + 1
            if current_size >= chunk_size:
                chunks.append(" ".join(current_chunk))
                current_chunk = []
                current_size = 0
                
        if current_chunk:
            chunks.append(" ".join(current_chunk))
            
        return chunks if chunks else [text]

    @staticmethod
    def local_tfidf_fallback_search(query: str, documents: List[Dict[str, Any]], limit: int = 5) -> List[Dict[str, Any]]:
        """
        A pure Python fallback keyword similarity matcher.
        """
        query_words = set(query.lower().split())
        results = []

        for doc in documents:
            doc_text = doc.get("ocr_text", "")
            if not doc_text:
                continue
                
            doc_words = doc_text.lower().split()
            if not doc_words:
                continue
                
            # Score based on keyword overlap
            matches = sum(1 for w in query_words if w in doc_words)
            score = matches / len(query_words) if query_words else 0.0
            
            if score > 0:
                results.append({
                    "doc_id": doc["id"],
                    "filename": doc["filename"],
                    "category": doc["category"],
                    "text": doc_text[:1000],
                    "score": score
                })
        
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:limit]
