"""Domain models for document and folder management."""
from __future__ import annotations

from dataclasses import dataclass, field, asdict
from datetime import datetime
from enum import Enum
from threading import Lock
from typing import Dict, Iterable, List, Optional, Set
from uuid import uuid4


class DocumentCategory(str, Enum):
    """Category values available for documents and folders."""

    ID_DOCUMENT = "id_document"
    FINAL_SUBMISSION = "final_submission"
    INTERNAL_WORK = "internal_work"
    FOLDER = "folder"


class Visibility(str, Enum):
    """Visibility values that control document and folder permissions."""

    PUBLIC = "public"
    RESTRICTED = "restricted"
    ACCOUNT_SPECIFIC = "account_specific"


@dataclass
class DocumentVersion:
    """Represents a stored version of a document."""

    number: int
    file_path: str
    file_name: str
    uploaded_at: datetime
    uploaded_by: str


@dataclass
class Folder:
    """Folder metadata."""

    id: str
    name: str
    visibility: Visibility
    owner_account_id: str
    parent_id: Optional[str] = None
    allowed_account_ids: Set[str] = field(default_factory=set)
    category: DocumentCategory = DocumentCategory.FOLDER
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> Dict:
        data = asdict(self)
        data["visibility"] = self.visibility.value
        data["category"] = self.category.value
        data["allowed_account_ids"] = list(self.allowed_account_ids)
        return data

    def can_view(self, account_id: Optional[str]) -> bool:
        if self.visibility == Visibility.PUBLIC:
            return True
        if self.visibility == Visibility.ACCOUNT_SPECIFIC:
            return account_id == self.owner_account_id
        return bool(account_id) and (
            account_id == self.owner_account_id or account_id in self.allowed_account_ids
        )

    def can_edit(self, account_id: Optional[str]) -> bool:
        return account_id == self.owner_account_id

    def touch(self) -> None:
        self.updated_at = datetime.utcnow()


@dataclass
class Document:
    """Document metadata with version information."""

    id: str
    name: str
    category: DocumentCategory
    visibility: Visibility
    owner_account_id: str
    file_name: str
    folder_id: Optional[str] = None
    description: Optional[str] = None
    allowed_account_ids: Set[str] = field(default_factory=set)
    versions: List[DocumentVersion] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> Dict:
        data = asdict(self)
        data["category"] = self.category.value
        data["visibility"] = self.visibility.value
        data["allowed_account_ids"] = list(self.allowed_account_ids)
        data["versions"] = [
            {
                "number": version.number,
                "file_path": version.file_path,
                "file_name": version.file_name,
                "uploaded_at": version.uploaded_at.isoformat(),
                "uploaded_by": version.uploaded_by,
            }
            for version in self.versions
        ]
        return data

    @property
    def latest_version(self) -> Optional[DocumentVersion]:
        return self.versions[-1] if self.versions else None

    def add_version(self, version: DocumentVersion) -> None:
        self.versions.append(version)
        self.updated_at = datetime.utcnow()

    def can_view(self, account_id: Optional[str]) -> bool:
        if self.visibility == Visibility.PUBLIC:
            return True
        if self.visibility == Visibility.ACCOUNT_SPECIFIC:
            return account_id == self.owner_account_id
        return bool(account_id) and (
            account_id == self.owner_account_id or account_id in self.allowed_account_ids
        )

    def can_edit(self, account_id: Optional[str]) -> bool:
        return account_id == self.owner_account_id


class DocumentRepository:
    """In-memory repository to store documents and folders.

    The repository provides thread-safe CRUD helpers so the API layer can
    focus on orchestrating storage and permission checks.
    """

    def __init__(self) -> None:
        self._documents: Dict[str, Document] = {}
        self._folders: Dict[str, Folder] = {}
        self._lock = Lock()

    # Folder operations -------------------------------------------------
    def create_folder(
        self,
        *,
        name: str,
        visibility: Visibility,
        owner_account_id: str,
        parent_id: Optional[str] = None,
        allowed_account_ids: Optional[Iterable[str]] = None,
    ) -> Folder:
        with self._lock:
            if parent_id and parent_id not in self._folders:
                raise KeyError("Parent folder does not exist")
            folder_id = uuid4().hex
            folder = Folder(
                id=folder_id,
                name=name,
                visibility=visibility,
                owner_account_id=owner_account_id,
                parent_id=parent_id,
                allowed_account_ids=set(allowed_account_ids or []),
            )
            self._folders[folder_id] = folder
            return folder

    def get_folder(self, folder_id: str) -> Folder:
        try:
            return self._folders[folder_id]
        except KeyError as exc:
            raise KeyError("Folder not found") from exc

    def update_folder(
        self,
        folder_id: str,
        *,
        name: Optional[str] = None,
        visibility: Optional[Visibility] = None,
        allowed_account_ids: Optional[Iterable[str]] = None,
    ) -> Folder:
        with self._lock:
            folder = self.get_folder(folder_id)
            if name:
                folder.name = name
            if visibility:
                folder.visibility = visibility
            if allowed_account_ids is not None:
                folder.allowed_account_ids = set(allowed_account_ids)
            folder.touch()
            return folder

    def delete_folder(self, folder_id: str) -> None:
        with self._lock:
            if any(doc.folder_id == folder_id for doc in self._documents.values()):
                raise ValueError("Folder is not empty")
            if any(folder.parent_id == folder_id for folder in self._folders.values()):
                raise ValueError("Folder contains child folders")
            self._folders.pop(folder_id, None)

    def list_folders(self) -> List[Folder]:
        return list(self._folders.values())

    # Document operations -----------------------------------------------
    def create_document(
        self,
        *,
        name: str,
        category: DocumentCategory,
        visibility: Visibility,
        owner_account_id: str,
        file_name: str,
        folder_id: Optional[str] = None,
        description: Optional[str] = None,
        allowed_account_ids: Optional[Iterable[str]] = None,
    ) -> Document:
        with self._lock:
            if folder_id and folder_id not in self._folders:
                raise KeyError("Folder does not exist")
            document_id = uuid4().hex
            document = Document(
                id=document_id,
                name=name,
                category=category,
                visibility=visibility,
                owner_account_id=owner_account_id,
                file_name=file_name,
                folder_id=folder_id,
                description=description,
                allowed_account_ids=set(allowed_account_ids or []),
            )
            self._documents[document_id] = document
            return document

    def add_document_version(
        self, document_id: str, *, version: DocumentVersion
    ) -> Document:
        with self._lock:
            document = self.get_document(document_id)
            document.add_version(version)
            return document

    def get_document(self, document_id: str) -> Document:
        try:
            return self._documents[document_id]
        except KeyError as exc:
            raise KeyError("Document not found") from exc

    def update_document(
        self,
        document_id: str,
        *,
        name: Optional[str] = None,
        category: Optional[DocumentCategory] = None,
        visibility: Optional[Visibility] = None,
        description: Optional[str] = None,
        allowed_account_ids: Optional[Iterable[str]] = None,
        folder_id: Optional[str] = None,
        file_name: Optional[str] = None,
    ) -> Document:
        with self._lock:
            document = self.get_document(document_id)
            if folder_id is not None:
                if folder_id and folder_id not in self._folders:
                    raise KeyError("Target folder does not exist")
                document.folder_id = folder_id
            if name:
                document.name = name
            if category:
                document.category = category
            if visibility:
                document.visibility = visibility
            if description is not None:
                document.description = description
            if allowed_account_ids is not None:
                document.allowed_account_ids = set(allowed_account_ids)
            if file_name:
                document.file_name = file_name
            document.updated_at = datetime.utcnow()
            return document

    def delete_document(self, document_id: str) -> None:
        with self._lock:
            self._documents.pop(document_id, None)

    def list_documents(self) -> List[Document]:
        return list(self._documents.values())

    def list_documents_in_folder(self, folder_id: Optional[str]) -> List[Document]:
        return [
            doc
            for doc in self._documents.values()
            if (folder_id and doc.folder_id == folder_id)
            or (folder_id is None and doc.folder_id is None)
        ]


__all__ = [
    "Document",
    "DocumentCategory",
    "DocumentRepository",
    "DocumentVersion",
    "Folder",
    "Visibility",
]
