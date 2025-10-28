"""Domain models for document and tagging support."""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Iterable, Optional, Set


class Visibility(str, Enum):
    """Visibility levels for a document."""

    PRIVATE = "private"
    INTERNAL = "internal"
    PUBLIC = "public"


@dataclass(slots=True)
class Tag:
    """Tag that can be associated with one or more documents."""

    name: str
    slug: str
    description: Optional[str] = None

    def __post_init__(self) -> None:
        normalized = self.slug.strip().lower().replace(" ", "-")
        if not normalized:
            raise ValueError("Tag slug cannot be blank")
        object.__setattr__(self, "slug", normalized)


@dataclass(slots=True)
class Document:
    """A document that can belong to multiple categories and tags."""

    id: str
    title: str
    category: str
    client: Optional[str]
    visibility: Visibility
    owner_id: str
    allowed_user_ids: Set[str] = field(default_factory=set)
    tag_slugs: Set[str] = field(default_factory=set)

    def allow_users(self, *user_ids: str) -> None:
        self.allowed_user_ids.update(user_ids)

    def deny_user(self, user_id: str) -> None:
        self.allowed_user_ids.discard(user_id)

    def attach_tag(self, tag: Tag) -> None:
        self.tag_slugs.add(tag.slug)

    def detach_tag(self, tag: Tag | str) -> None:
        slug = tag.slug if isinstance(tag, Tag) else tag
        self.tag_slugs.discard(slug)

    def has_any_tag(self, tags: Iterable[str]) -> bool:
        return bool(set(tags) & self.tag_slugs)


@dataclass(slots=True)
class DocumentSearchFilters:
    """Filters that can be applied while searching for documents."""

    tags: Set[str] = field(default_factory=set)
    category: Optional[str] = None
    client: Optional[str] = None
    visibility: Optional[Visibility] = None

    @classmethod
    def from_query_params(cls, params: dict[str, str | list[str]]) -> "DocumentSearchFilters":
        tags: Set[str] = set()
        raw_tags = params.get("tags")
        if isinstance(raw_tags, list):
            for value in raw_tags:
                tags.update(_split_tag_query(value))
        elif isinstance(raw_tags, str):
            tags.update(_split_tag_query(raw_tags))

        category = None
        category_value = params.get("category")
        if category_value is not None:
            stripped_category = str(category_value).strip()
            if stripped_category:
                category = stripped_category

        client = None
        client_value = params.get("client")
        if client_value is not None:
            stripped_client = str(client_value).strip()
            if stripped_client:
                client = stripped_client
        visibility_value = params.get("visibility")
        visibility: Optional[Visibility] = None
        if visibility_value:
            try:
                visibility = Visibility(str(visibility_value))
            except ValueError as exc:
                raise ValueError(f"Unsupported visibility '{visibility_value}'") from exc
        return cls(tags=tags, category=category, client=client, visibility=visibility)


def _split_tag_query(query_value: str) -> Set[str]:
    return {value.strip().lower() for value in query_value.split(",") if value.strip()}
