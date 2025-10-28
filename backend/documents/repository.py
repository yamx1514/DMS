"""In-memory repository for documents and tags.

The repository is intentionally simple to keep the example self-contained.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Iterable, List, Optional

from .models import Document, Tag


@dataclass
class DocumentsRepository:
    """Stores documents and tags in-memory for prototyping."""

    documents: Dict[str, Document] = field(default_factory=dict)
    tags: Dict[str, Tag] = field(default_factory=dict)

    def add_document(self, document: Document) -> None:
        self.documents[document.id] = document

    def get_document(self, document_id: str) -> Optional[Document]:
        return self.documents.get(document_id)

    def list_documents(self) -> Iterable[Document]:
        return self.documents.values()

    def upsert_tag(self, tag: Tag) -> Tag:
        self.tags[tag.slug] = tag
        return tag

    def get_tag(self, slug: str) -> Optional[Tag]:
        return self.tags.get(slug)

    def list_tags(self) -> List[Tag]:
        return list(self.tags.values())
