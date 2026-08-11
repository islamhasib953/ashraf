"""
Local HuggingFace Embedding Model.
Downloads sentence-transformers/all-MiniLM-L6-v2 on first run (~80MB).
Zero cloud API cost — runs 100% locally.
"""
import logging
from typing import List
from functools import lru_cache

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_embedding_model():
    """Load the local embedding model (cached after first load)."""
    from sentence_transformers import SentenceTransformer
    from core.config import settings

    logger.info(f"Loading local embedding model: {settings.HF_EMBEDDING_MODEL}")
    model = SentenceTransformer(settings.HF_EMBEDDING_MODEL)
    logger.info("Embedding model loaded successfully")
    return model


def embed_texts(texts: List[str]) -> List[List[float]]:
    """Generate embeddings for a list of texts using the local model."""
    model = get_embedding_model()
    embeddings = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
    return embeddings.tolist()


def embed_query(query: str) -> List[float]:
    """Generate embedding for a single query string."""
    return embed_texts([query])[0]
