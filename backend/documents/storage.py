"""Storage helpers for persisting document binaries."""
from __future__ import annotations

from pathlib import Path
from typing import Iterable, Optional


class DocumentStorage:
    """Persist document binaries on a filesystem-like storage.

    The class can work with local or mounted cloud volumes. Each document is
    stored under ``<base_path>/<document_id>/`` with versioned file names to
    simplify retrieval.
    """

    def __init__(self, base_path: Path | str) -> None:
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)

    def _document_dir(self, document_id: str) -> Path:
        return self.base_path / document_id

    def put_version(
        self,
        document_id: str,
        version_number: int,
        *,
        file_name: str,
        content: bytes,
    ) -> Path:
        """Persist a new document version and return the stored path."""

        doc_dir = self._document_dir(document_id)
        doc_dir.mkdir(parents=True, exist_ok=True)
        extension = Path(file_name).suffix
        target_path = doc_dir / f"v{version_number}{extension}"
        target_path.write_bytes(content)
        return target_path

    def resolve_path(self, document_id: str, version_number: Optional[int] = None) -> Path:
        """Return a path for the latest or a specific version."""

        doc_dir = self._document_dir(document_id)
        if version_number is not None:
            for candidate in doc_dir.glob(f"v{version_number}.*"):
                return candidate
            raise FileNotFoundError("Document version not found")

        versions = sorted(doc_dir.glob("v*"))
        if not versions:
            raise FileNotFoundError("No versions stored for document")
        return versions[-1]

    def delete_document(self, document_id: str) -> None:
        """Remove all stored versions for a document."""

        doc_dir = self._document_dir(document_id)
        if not doc_dir.exists():
            return
        for path in doc_dir.glob("*"):
            path.unlink()
        doc_dir.rmdir()

    def iter_versions(self, document_id: str) -> Iterable[Path]:
        doc_dir = self._document_dir(document_id)
        if not doc_dir.exists():
            return []
        return sorted(doc_dir.glob("v*"))


__all__ = ["DocumentStorage"]
