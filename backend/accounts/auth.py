"""JWT authentication utilities and access control helpers."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Callable, Iterable, Optional, Sequence

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

from backend.config import ACCESS_TOKEN_EXPIRE, ALGORITHM, SECRET_KEY


class AuthenticatedUser(BaseModel):
    """Represents the authenticated principal extracted from a JWT token."""

    id: str = Field(..., alias="sub")
    roles: set[str] = Field(default_factory=set)
    permissions: set[str] = Field(default_factory=set)

    class Config:
        allow_population_by_field_name = True

    def has_role(self, required_roles: Iterable[str]) -> bool:
        """Return True when any of the required roles is present."""

        return any(role in self.roles for role in required_roles)

    def has_permissions(self, required_permissions: Iterable[str]) -> bool:
        """Return True when all permissions are present."""

        required = set(required_permissions)
        return required.issubset(self.permissions)


bearer_scheme = HTTPBearer(auto_error=False)


class TokenPayload(BaseModel):
    """The structure stored in the JWT payload."""

    sub: str
    roles: Sequence[str] = ()
    permissions: Sequence[str] = ()
    exp: int


class AccessTokenResponse(BaseModel):
    """Response payload when issuing an access token."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenIssuer:
    """Service class that handles JWT creation and decoding."""

    def __init__(self, *, secret_key: str, algorithm: str, default_expiry: timedelta):
        self._secret_key = secret_key
        self._algorithm = algorithm
        self._default_expiry = default_expiry

    def issue_token(
        self,
        subject: str,
        *,
        roles: Optional[Iterable[str]] = None,
        permissions: Optional[Iterable[str]] = None,
        expires_delta: Optional[timedelta] = None,
    ) -> AccessTokenResponse:
        """Return a signed JWT access token for the provided subject."""

        expire_delta = expires_delta or self._default_expiry
        expire_at = datetime.now(timezone.utc) + expire_delta
        payload = {
            "sub": subject,
            "roles": list(roles or ()),
            "permissions": list(permissions or ()),
            "exp": int(expire_at.timestamp()),
        }
        encoded_jwt = jwt.encode(payload, self._secret_key, algorithm=self._algorithm)
        return AccessTokenResponse(
            access_token=encoded_jwt,
            expires_in=int(expire_delta.total_seconds()),
        )

    def decode_token(self, token: str) -> TokenPayload:
        """Decode the provided JWT token and validate expiry."""

        try:
            payload = jwt.decode(
                token,
                self._secret_key,
                algorithms=[self._algorithm],
                options={"require": ["exp", "sub"]},
            )
        except jwt.ExpiredSignatureError as exc:  # pragma: no cover - passthrough for clarity
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired") from exc
        except jwt.InvalidTokenError as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

        return TokenPayload(**payload)


issuer = TokenIssuer(
    secret_key=SECRET_KEY,
    algorithm=ALGORITHM,
    default_expiry=ACCESS_TOKEN_EXPIRE,
)


def resolve_user_from_token(credentials: HTTPAuthorizationCredentials | None) -> AuthenticatedUser:
    """Resolve the authenticated user from the HTTP bearer credentials."""

    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing credentials")

    payload = issuer.decode_token(credentials.credentials)
    return AuthenticatedUser(
        sub=payload.sub,
        roles=set(payload.roles),
        permissions=set(payload.permissions),
    )


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> AuthenticatedUser:
    """FastAPI dependency that returns the current authenticated user."""

    return resolve_user_from_token(credentials)


def require_roles(*required_roles: str) -> Callable[[AuthenticatedUser], AuthenticatedUser]:
    """Dependency factory that ensures the current user has at least one required role."""

    if not required_roles:
        raise ValueError("At least one role must be specified")

    async def dependency(user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
        if not user.has_role(required_roles):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
        return user

    return dependency


def require_permissions(*required_permissions: str) -> Callable[[AuthenticatedUser], AuthenticatedUser]:
    """Dependency factory ensuring the current user has all required permissions."""

    if not required_permissions:
        raise ValueError("At least one permission must be specified")

    async def dependency(user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
        if not user.has_permissions(required_permissions):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Missing permissions")
        return user

    return dependency
