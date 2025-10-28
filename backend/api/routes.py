"""API routes demonstrating authorization enforced via the auth utilities."""
from __future__ import annotations

from typing import Dict

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from backend.accounts.auth import AuthenticatedUser, issuer, require_permissions, require_roles

router = APIRouter(prefix="/api")


class LoginRequest(BaseModel):
    username: str


# A fake user store used solely for example purposes.
_FAKE_USERS: Dict[str, Dict[str, list[str]]] = {
    "alice": {"roles": ["admin"], "permissions": ["documents:read", "documents:write"]},
    "bob": {"roles": ["editor"], "permissions": ["documents:read", "documents:write"]},
    "charlie": {"roles": ["viewer"], "permissions": ["documents:read"]},
}


@router.post("/auth/token")
def login(payload: LoginRequest):
    user_record = _FAKE_USERS.get(payload.username)
    if not user_record:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    return issuer.issue_token(
        subject=payload.username,
        roles=user_record["roles"],
        permissions=user_record["permissions"],
    )


@router.get("/documents")
def list_documents(current_user: AuthenticatedUser = Depends(require_roles("viewer", "editor", "admin"))):
    """Return a mock list of documents accessible to the authenticated user."""

    return {
        "user": current_user.id,
        "documents": [
            {"id": "doc-1", "title": "Onboarding", "owner": "alice"},
            {"id": "doc-2", "title": "Quarterly Report", "owner": "bob"},
        ],
    }


@router.post("/documents")
def create_document(
    document: Dict[str, str],
    current_user: AuthenticatedUser = Depends(require_permissions("documents:write")),
):
    """Create a mock document when the user has write permissions."""

    created = {"id": "doc-new", **document, "owner": current_user.id}
    return {"user": current_user.id, "document": created}


@router.get("/admin/reports")
def admin_reports(current_user: AuthenticatedUser = Depends(require_roles("admin"))):
    """Endpoint restricted to admin role."""

    return {
        "user": current_user.id,
        "reports": [
            {"name": "System Health", "status": "ok"},
            {"name": "Usage", "status": "growing"},
        ],
    }
