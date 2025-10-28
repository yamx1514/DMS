from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping

from .models import Document, UserContext
from .services.documents import DocumentRepository, DocumentService


@dataclass(frozen=True)
class Response:
    status_code: int
    body: object


class DocumentAPI:
    """Minimal API facade for serving document requests."""

    def __init__(self, service: DocumentService) -> None:
        self._service = service

    def list_documents(self, headers: Mapping[str, str]) -> Response:
        user = UserContext.from_headers(headers)
        if not user.is_authenticated:
            return Response(status_code=401, body={"detail": "Missing user credentials"})

        documents = self._service.get_documents_for_user(user)
        return Response(
            status_code=200,
            body=[document.to_api_payload() for document in documents],
        )

    def handle(self, method: str, path: str, headers: Mapping[str, str]) -> Response:
        if method.upper() == "GET" and path == "/documents":
            return self.list_documents(headers)
        return Response(status_code=404, body={"detail": "Not found"})


_repository = DocumentRepository(
    documents=[
        Document(
            id="doc-employee-handbook",
            title="Employee Handbook",
            team="people",
            assigned_user_ids={"user-alice"},
            required_roles={"employee"},
        ),
        Document(
            id="doc-north-ops",
            title="Northern Operations Plan",
            team="north",
            required_roles={"operations"},
        ),
        Document(
            id="doc-south-ops",
            title="Southern Operations Plan",
            team="south",
            required_roles={"operations"},
        ),
        Document(
            id="doc-finance-plan",
            title="Finance Q1 Plan",
            team="finance",
            assigned_user_ids={"user-bob"},
            required_roles={"finance"},
        ),
    ]
)
_service = DocumentService(_repository)
app = DocumentAPI(_service)


__all__ = ["app", "DocumentAPI", "Response", "_repository", "_service"]
