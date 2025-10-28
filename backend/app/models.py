from __future__ import annotations

from dataclasses import dataclass, field
from typing import Iterable, Mapping, Set


@dataclass(frozen=True)
class Document:
    """Represents a document stored in the service."""

    id: str
    title: str
    team: str
    assigned_user_ids: Set[str] = field(default_factory=set)
    required_roles: Set[str] = field(default_factory=set)

    def to_api_payload(self) -> dict:
        """Return a serialisable payload for API responses."""

        return {
            "id": self.id,
            "title": self.title,
            "team": self.team,
            "requiredRoles": sorted(self.required_roles),
        }


@dataclass(frozen=True)
class UserContext:
    """Lightweight representation of the authenticated user."""

    user_id: str
    roles: Set[str] = field(default_factory=set)
    assignments: Set[str] = field(default_factory=set)
    delegated_teams: Set[str] = field(default_factory=set)

    @property
    def is_authenticated(self) -> bool:
        return bool(self.user_id)

    @property
    def is_admin(self) -> bool:
        return "admin" in self.roles

    @property
    def is_sub_admin(self) -> bool:
        return "sub_admin" in self.roles and not self.is_admin

    @classmethod
    def from_headers(cls, headers: Mapping[str, str]) -> "UserContext":
        """Create a user context from request headers."""

        user_id = (headers.get("x-user-id") or headers.get("X-User-Id") or "").strip()
        return cls(
            user_id=user_id,
            roles=_normalise_csv_header(headers.get("X-User-Roles")),
            assignments=_normalise_csv_header(headers.get("X-User-Assignments")),
            delegated_teams=_normalise_csv_header(headers.get("X-Delegated-Teams")),
        )

    def with_assignments(self, assignments: Iterable[str]) -> "UserContext":
        return UserContext(
            user_id=self.user_id,
            roles=set(self.roles),
            assignments=set(assignments),
            delegated_teams=set(self.delegated_teams),
        )


def _normalise_csv_header(raw: str | None) -> Set[str]:
    if not raw:
        return set()
    return {token.strip() for token in raw.split(",") if token.strip()}
