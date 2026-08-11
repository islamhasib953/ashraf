"""
Knowledge Base Management using ChromaDB (local vector store).
Each user gets their own isolated ChromaDB collection.
"""
import logging
import os
from typing import List, Dict, Any

logger = logging.getLogger(__name__)


def _get_chroma_client():
    """Get or create a persistent ChromaDB client."""
    import chromadb
    from core.config import settings

    os.makedirs(settings.CHROMA_DB_PATH, exist_ok=True)
    return chromadb.PersistentClient(path=settings.CHROMA_DB_PATH)


def _collection_name(user_id: int, kb_id: str) -> str:
    """Generate a unique ChromaDB collection name per user per knowledge base."""
    return f"user_{user_id}_kb_{kb_id}"


def add_documents(user_id: int, kb_id: str, texts: List[str], metadatas: List[Dict] = None) -> int:
    """
    Add documents to a user's knowledge base.
    Returns the number of documents added.
    """
    from ai.local_embedder import embed_texts

    client = _get_chroma_client()
    collection = client.get_or_create_collection(
        name=_collection_name(user_id, kb_id),
        metadata={"user_id": user_id, "kb_id": kb_id},
    )

    embeddings = embed_texts(texts)
    ids = [f"doc_{i}_{hash(t)}" for i, t in enumerate(texts)]
    metadatas = metadatas or [{}] * len(texts)

    collection.add(documents=texts, embeddings=embeddings, ids=ids, metadatas=metadatas)
    logger.info(f"Added {len(texts)} documents to KB {kb_id} for user {user_id}")
    return len(texts)


def search_documents(user_id: int, kb_id: str, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """
    Search the knowledge base using semantic similarity.
    Returns top_k most relevant document chunks.
    """
    from ai.local_embedder import embed_query

    client = _get_chroma_client()
    collection_name = _collection_name(user_id, kb_id)

    try:
        collection = client.get_collection(name=collection_name)
    except Exception:
        return []

    query_embedding = embed_query(query)
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(top_k, collection.count()),
    )

    output = []
    if results and results.get("documents"):
        for i, doc in enumerate(results["documents"][0]):
            output.append({
                "text": doc,
                "distance": results["distances"][0][i] if results.get("distances") else None,
                "metadata": results["metadatas"][0][i] if results.get("metadatas") else {},
            })
    return output


def delete_knowledge_base(user_id: int, kb_id: str) -> bool:
    """Delete an entire knowledge base collection."""
    client = _get_chroma_client()
    try:
        client.delete_collection(name=_collection_name(user_id, kb_id))
        return True
    except Exception:
        return False
