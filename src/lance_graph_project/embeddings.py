from __future__ import annotations

import os
from functools import cached_property

from sentence_transformers import SentenceTransformer


DEFAULT_EMBED_MODEL = "sentence-transformers/all-MiniLM-L6-v2"


class EmbeddingPipeline:
    def __init__(self, model_name: str | None = None) -> None:
        self.model_name = model_name or os.getenv("EMBED_MODEL", DEFAULT_EMBED_MODEL)

    @cached_property
    def model(self) -> SentenceTransformer:
        return SentenceTransformer(self.model_name)

    def embed(self, text: str) -> list[float]:
        vector = self.model.encode(text, normalize_embeddings=True)
        return vector.tolist()

    def embed_work_item_text(self, title: str, description: str, notes: str = "") -> list[float]:
        combined = "\n\n".join(part for part in [title.strip(), description.strip(), notes.strip()] if part)
        return self.embed(combined)

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        vectors = self.model.encode(texts, normalize_embeddings=True)
        return [vector.tolist() for vector in vectors]
