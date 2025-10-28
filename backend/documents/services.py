"""Business logic for working with documents and tags."""
from __future__ import annotations

from typing import List

from .models import Document, DocumentSearchFilters, Tag, Visibility
from .repository import DocumentsRepository


class PermissionError(RuntimeError):
    """Raised when the caller is not allowed to perform the action."""


class DocumentService:
    def __init__(self, repository: DocumentsRepository) -> None:
        self._repository = repository

    # ------------------------------------------------------------------
    # Tag management
    # ------------------------------------------------------------------
    def add_tag_to_document(self, document_id: str, tag: Tag, actor_id: str) -> Document:
        document = self._require_document(document_id)
        self._ensure_actor_can_edit(document, actor_id)

        tag = self._repository.upsert_tag(tag)
        document.attach_tag(tag)
        return document

    def remove_tag_from_document(self, document_id: str, tag_slug: str, actor_id: str) -> Document:
        document = self._require_document(document_id)
        self._ensure_actor_can_edit(document, actor_id)

        document.detach_tag(tag_slug.lower())
        return document

    def list_tags(self) -> List[Tag]:
        return self._repository.list_tags()

    # ------------------------------------------------------------------
    # Search
    # ------------------------------------------------------------------
    def search_documents(self, filters: DocumentSearchFilters, actor_id: str) -> List[Document]:
        matches: List[Document] = []
        for document in self._repository.list_documents():
            if not self._is_visible_to_actor(document, actor_id):
                continue
            if filters.tags and not document.has_any_tag(filters.tags):
                continue
            if filters.category and document.category != filters.category:
                continue
            if filters.client and document.client != filters.client:
                continue
            if filters.visibility and document.visibility != filters.visibility:
                continue
            matches.append(document)
        return matches

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    def _require_document(self, document_id: str) -> Document:
        document = self._repository.get_document(document_id)
        if not document:
            raise KeyError(f"Document {document_id} not found")
        return document

    def _ensure_actor_can_edit(self, document: Document, actor_id: str) -> None:
        if document.owner_id != actor_id and actor_id not in document.allowed_user_ids:
            raise PermissionError("You do not have permission to edit this document")

    def _is_visible_to_actor(self, document: Document, actor_id: str) -> bool:
        if actor_id == document.owner_id or actor_id in document.allowed_user_ids:
            return True
        if document.visibility == Visibility.PUBLIC:
            return True
        if document.visibility == Visibility.INTERNAL:
            return False
        return False


def seed_demo_data(repository: DocumentsRepository) -> None:
    """Populate the repository with a couple of documents for demo purposes."""

    doc_1 = Document(
        id="proposal-001",
        title="Big Corp Proposal",
        category="proposal",
        client="Big Corp",
        visibility=Visibility.INTERNAL,
        owner_id="alice",
    )
    doc_1.allow_users("bob", "carol")

    doc_2 = Document(
        id="handbook-2023",
        title="Employee Handbook 2023",
        category="hr",
        client=None,
        visibility=Visibility.PUBLIC,
        owner_id="hr_team",
    )

    finance_tag = repository.upsert_tag(Tag(name="Finance", slug="finance"))
    hr_tag = repository.upsert_tag(Tag(name="HR", slug="hr"))

    doc_1.attach_tag(finance_tag)
    doc_2.attach_tag(hr_tag)

    repository.add_document(doc_1)
    repository.add_document(doc_2)
