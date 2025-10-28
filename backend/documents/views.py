"""FastAPI views implementing CRUD operations for documents and folders."""
from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from .models import (
    Document,
    DocumentCategory,
    DocumentRepository,
    DocumentVersion,
    Folder,
    Visibility,
)
from .storage import DocumentStorage

# Repository and storage singletons. In a real-world scenario these would be
# injected via dependency overrides for tests or configured in an application
# factory.
repository = DocumentRepository()
storage = DocumentStorage(Path("storage/documents"))


class RequestContext(BaseModel):
    account_id: Optional[str] = Field(default=None, description="Account id extracted from headers")


def get_request_context(x_account_id: Optional[str] = Header(default=None)) -> RequestContext:
    """Dependency that would typically inspect the request headers.

    For this example we pass ``account_id`` explicitly in the FastAPI dependency
    stack so unit tests can control the returned context.
    """

    return RequestContext(account_id=x_account_id)


class FolderResponse(BaseModel):
    id: str
    name: str
    visibility: Visibility
    owner_account_id: str
    parent_id: Optional[str]
    category: DocumentCategory
    allowed_account_ids: List[str]
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_folder(cls, folder: Folder) -> "FolderResponse":
        return cls(**folder.to_dict())


class DocumentVersionResponse(BaseModel):
    number: int
    file_path: str
    file_name: str
    uploaded_at: datetime
    uploaded_by: str

    @classmethod
    def from_version(cls, version: DocumentVersion) -> "DocumentVersionResponse":
        return cls(
            number=version.number,
            file_path=version.file_path,
            file_name=version.file_name,
            uploaded_at=version.uploaded_at,
            uploaded_by=version.uploaded_by,
        )


class DocumentResponse(BaseModel):
    id: str
    name: str
    category: DocumentCategory
    visibility: Visibility
    owner_account_id: str
    file_name: str
    folder_id: Optional[str]
    description: Optional[str]
    allowed_account_ids: List[str]
    created_at: datetime
    updated_at: datetime
    versions: List[DocumentVersionResponse]

    @classmethod
    def from_document(cls, document: Document) -> "DocumentResponse":
        return cls(
            id=document.id,
            name=document.name,
            category=document.category,
            visibility=document.visibility,
            owner_account_id=document.owner_account_id,
            file_name=document.file_name,
            folder_id=document.folder_id,
            description=document.description,
            allowed_account_ids=sorted(document.allowed_account_ids),
            created_at=document.created_at,
            updated_at=document.updated_at,
            versions=[DocumentVersionResponse.from_version(v) for v in document.versions],
        )


class FolderCreateRequest(BaseModel):
    name: str
    visibility: Visibility = Visibility.PUBLIC
    parent_id: Optional[str] = None
    allowed_account_ids: List[str] = Field(default_factory=list)


class FolderUpdateRequest(BaseModel):
    name: Optional[str] = None
    visibility: Optional[Visibility] = None
    allowed_account_ids: Optional[List[str]] = None


class DocumentUpdateRequest(BaseModel):
    name: Optional[str] = None
    category: Optional[DocumentCategory] = None
    visibility: Optional[Visibility] = None
    description: Optional[str] = None
    folder_id: Optional[str] = None
    allowed_account_ids: Optional[List[str]] = None


router = APIRouter(prefix="/documents", tags=["documents"])


def ensure_can_view_folder(folder: Folder, context: RequestContext) -> None:
    if not folder.can_view(context.account_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


def ensure_can_edit_folder(folder: Folder, context: RequestContext) -> None:
    if not folder.can_edit(context.account_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


def ensure_can_view_document(document: Document, context: RequestContext) -> None:
    if not document.can_view(context.account_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


def ensure_can_edit_document(document: Document, context: RequestContext) -> None:
    if not document.can_edit(context.account_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


@router.post("/folders", response_model=FolderResponse, status_code=status.HTTP_201_CREATED)
def create_folder(
    payload: FolderCreateRequest,
    context: RequestContext = Depends(get_request_context),
) -> FolderResponse:
    if not context.account_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing account context")

    try:
        folder = repository.create_folder(
            name=payload.name,
            visibility=payload.visibility,
            owner_account_id=context.account_id,
            parent_id=payload.parent_id,
            allowed_account_ids=payload.allowed_account_ids,
        )
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return FolderResponse.from_folder(folder)


@router.get("/folders", response_model=List[FolderResponse])
def list_folders(context: RequestContext = Depends(get_request_context)) -> List[FolderResponse]:
    visible = [folder for folder in repository.list_folders() if folder.can_view(context.account_id)]
    return [FolderResponse.from_folder(folder) for folder in visible]


@router.get("/folders/{folder_id}", response_model=FolderResponse)
def get_folder(
    folder_id: str,
    context: RequestContext = Depends(get_request_context),
) -> FolderResponse:
    try:
        folder = repository.get_folder(folder_id)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found") from exc
    ensure_can_view_folder(folder, context)
    return FolderResponse.from_folder(folder)


@router.patch("/folders/{folder_id}", response_model=FolderResponse)
def update_folder(
    folder_id: str,
    payload: FolderUpdateRequest,
    context: RequestContext = Depends(get_request_context),
) -> FolderResponse:
    try:
        folder = repository.get_folder(folder_id)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found") from exc

    ensure_can_edit_folder(folder, context)

    try:
        updated = repository.update_folder(
            folder_id,
            name=payload.name,
            visibility=payload.visibility,
            allowed_account_ids=payload.allowed_account_ids,
        )
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    return FolderResponse.from_folder(updated)


@router.delete("/folders/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_folder(
    folder_id: str,
    context: RequestContext = Depends(get_request_context),
) -> None:
    try:
        folder = repository.get_folder(folder_id)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found") from exc

    ensure_can_edit_folder(folder, context)

    try:
        repository.delete_folder(folder_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    name: str = Form(...),
    category: DocumentCategory = Form(...),
    visibility: Visibility = Form(...),
    description: Optional[str] = Form(default=None),
    folder_id: Optional[str] = Form(default=None),
    allowed_account_ids: Optional[str] = Form(default=None),
    context: RequestContext = Depends(get_request_context),
) -> DocumentResponse:
    if not context.account_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing account context")

    allowed = []
    if allowed_account_ids:
        allowed = [item.strip() for item in allowed_account_ids.split(",") if item.strip()]

    try:
        document = repository.create_document(
            name=name,
            category=category,
            visibility=visibility,
            owner_account_id=context.account_id,
            file_name=file.filename or name,
            folder_id=folder_id,
            description=description,
            allowed_account_ids=allowed,
        )
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    payload = await file.read()
    storage_path = storage.put_version(
        document.id,
        1,
        file_name=file.filename or document.file_name,
        content=payload,
    )

    version = DocumentVersion(
        number=1,
        file_path=str(storage_path),
        file_name=file.filename or document.file_name,
        uploaded_at=datetime.utcnow(),
        uploaded_by=context.account_id,
    )
    repository.add_document_version(document.id, version=version)

    return DocumentResponse.from_document(document)


@router.get("", response_model=List[DocumentResponse])
def list_documents(context: RequestContext = Depends(get_request_context)) -> List[DocumentResponse]:
    visible = [doc for doc in repository.list_documents() if doc.can_view(context.account_id)]
    return [DocumentResponse.from_document(doc) for doc in visible]


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: str,
    context: RequestContext = Depends(get_request_context),
) -> DocumentResponse:
    try:
        document = repository.get_document(document_id)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found") from exc

    ensure_can_view_document(document, context)
    return DocumentResponse.from_document(document)


@router.get("/{document_id}/download")
def download_document(
    document_id: str,
    version: Optional[int] = None,
    context: RequestContext = Depends(get_request_context),
) -> FileResponse:
    try:
        document = repository.get_document(document_id)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found") from exc

    ensure_can_view_document(document, context)

    try:
        path = storage.resolve_path(document_id, version)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    return FileResponse(path, filename=document.file_name)


@router.patch("/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: str,
    payload: DocumentUpdateRequest,
    file: Optional[UploadFile] = File(default=None),
    context: RequestContext = Depends(get_request_context),
) -> DocumentResponse:
    try:
        document = repository.get_document(document_id)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found") from exc

    ensure_can_edit_document(document, context)

    allowed_ids = payload.allowed_account_ids
    if allowed_ids is not None:
        allowed_ids = [item for item in allowed_ids if item]

    try:
        updated = repository.update_document(
            document_id,
            name=payload.name,
            category=payload.category,
            visibility=payload.visibility,
            description=payload.description,
            allowed_account_ids=allowed_ids,
            folder_id=payload.folder_id,
            file_name=file.filename if file else None,
        )
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    if file:
        payload_bytes = await file.read()
        version_number = len(updated.versions) + 1
        storage_path = storage.put_version(
            document_id,
            version_number,
            file_name=file.filename or updated.file_name,
            content=payload_bytes,
        )
        version = DocumentVersion(
            number=version_number,
            file_path=str(storage_path),
            file_name=file.filename or updated.file_name,
            uploaded_at=datetime.utcnow(),
            uploaded_by=context.account_id or updated.owner_account_id,
        )
        repository.add_document_version(document_id, version=version)

    return DocumentResponse.from_document(updated)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: str,
    context: RequestContext = Depends(get_request_context),
) -> None:
    try:
        document = repository.get_document(document_id)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found") from exc

    ensure_can_edit_document(document, context)

    repository.delete_document(document_id)
    storage.delete_document(document_id)


__all__ = ["router", "get_request_context", "repository", "storage"]
