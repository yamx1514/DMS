"""API layer exposing document search and tagging operations."""
from __future__ import annotations

from dataclasses import asdict
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from .models import Document, DocumentSearchFilters, Tag
from .services import DocumentService, PermissionError


def get_document_service() -> DocumentService:
    from .repository import DocumentsRepository
    from .services import seed_demo_data

    if not hasattr(get_document_service, "_service"):
        repository = DocumentsRepository()
        seed_demo_data(repository)
        get_document_service._service = DocumentService(repository)
    return get_document_service._service  # type: ignore[attr-defined]


class TagPayload(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None


class TagResponse(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None


class DocumentResponse(BaseModel):
    id: str
    title: str
    category: str
    client: Optional[str]
    visibility: str
    tags: List[str]

    @classmethod
    def from_document(cls, document: Document) -> "DocumentResponse":
        return cls(
            id=document.id,
            title=document.title,
            category=document.category,
            client=document.client,
            visibility=document.visibility.value,
            tags=sorted(document.tag_slugs),
        )


router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("/tags", response_model=List[TagResponse])
def list_tags(service: DocumentService = Depends(get_document_service)) -> List[TagResponse]:
    tags = service.list_tags()
    return [TagResponse(**asdict(tag)) for tag in tags]


@router.post("/{document_id}/tags", response_model=DocumentResponse)
def add_tag(
    document_id: str,
    payload: TagPayload,
    actor_id: str = Query(..., description="Identifier of the user making the request."),
    service: DocumentService = Depends(get_document_service),
) -> DocumentResponse:
    try:
        document = service.add_tag_to_document(document_id, Tag(**payload.dict()), actor_id)
    except PermissionError as exc:  # pragma: no cover - HTTP translation
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail=str(exc))
    except KeyError as exc:  # pragma: no cover - HTTP translation
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(exc))
    return DocumentResponse.from_document(document)


@router.delete("/{document_id}/tags/{tag_slug}", response_model=DocumentResponse)
def remove_tag(
    document_id: str,
    tag_slug: str,
    actor_id: str = Query(..., description="Identifier of the user making the request."),
    service: DocumentService = Depends(get_document_service),
) -> DocumentResponse:
    try:
        document = service.remove_tag_from_document(document_id, tag_slug, actor_id)
    except PermissionError as exc:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail=str(exc))
    except KeyError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(exc))
    return DocumentResponse.from_document(document)


@router.get("/search", response_model=List[DocumentResponse])
def search(
    tags: Optional[List[str]] = Query(None, description="Comma separated tags"),
    category: Optional[str] = None,
    client: Optional[str] = None,
    visibility: Optional[str] = Query(None, regex="^(private|internal|public)$"),
    actor_id: str = Query(..., description="Identifier of the user making the request."),
    service: DocumentService = Depends(get_document_service),
) -> List[DocumentResponse]:
    query_params = {
        "tags": tags or [],
        "category": category,
        "client": client,
        "visibility": visibility,
    }
    try:
        filters = DocumentSearchFilters.from_query_params(query_params)
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(exc))
    documents = service.search_documents(filters, actor_id=actor_id)
    return [DocumentResponse.from_document(document) for document in documents]
