from __future__ import annotations

from typing import Iterable, List, Sequence

from ..models import Document, UserContext


class DocumentRepository:
    """Simple in-memory repository for documents."""

    def __init__(self, documents: Iterable[Document] | None = None) -> None:
        self._documents: List[Document] = list(documents or [])

    def list_documents(self) -> List[Document]:
        return list(self._documents)

    def set_documents(self, documents: Sequence[Document]) -> None:
        self._documents = list(documents)


class DocumentService:
    """Encapsulates business rules for document access."""

    def __init__(self, repository: DocumentRepository) -> None:
        self._repository = repository

    def get_documents_for_user(self, user: UserContext) -> List[Document]:
        documents = self._repository.list_documents()
        if not user.is_authenticated:
            return []

        if user.is_admin:
            return documents

        visible: List[Document] = []
        for document in documents:
            if self._is_document_visible(document, user):
                visible.append(document)
        return visible

    def _is_document_visible(self, document: Document, user: UserContext) -> bool:
        if document.id in user.assignments:
            return True

        if user.user_id in document.assigned_user_ids:
            return True

        if document.required_roles and document.required_roles.intersection(user.roles):
            return True

        if user.is_sub_admin and document.team in user.delegated_teams:
            return True

        return False
