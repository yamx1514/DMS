from __future__ import annotations

import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from backend.app.main import app  # noqa: E402


def _request_documents(user_id: str, roles: list[str], assignments: list[str], delegated: list[str]):
    headers = {
        "X-User-Id": user_id,
        "X-User-Roles": ",".join(roles),
        "X-User-Assignments": ",".join(assignments),
        "X-Delegated-Teams": ",".join(delegated),
    }
    return app.handle("GET", "/documents", headers)


def test_regular_user_sees_only_assigned_documents():
    response = _request_documents(
        user_id="user-alice",
        roles=["employee"],
        assignments=["doc-employee-handbook"],
        delegated=[],
    )
    assert response.status_code == 200
    payload = response.body
    assert {doc["id"] for doc in payload} == {"doc-employee-handbook"}


def test_sub_admin_sees_delegated_scope():
    response = _request_documents(
        user_id="user-sam",
        roles=["sub_admin"],
        assignments=[],
        delegated=["north"],
    )
    assert response.status_code == 200
    payload = response.body
    ids = {doc["id"] for doc in payload}
    assert "doc-north-ops" in ids
    assert "doc-south-ops" not in ids
    assert "doc-employee-handbook" not in ids


def test_admin_sees_everything():
    response = _request_documents(
        user_id="user-root",
        roles=["admin"],
        assignments=[],
        delegated=["north"],
    )
    assert response.status_code == 200
    payload = response.body
    ids = {doc["id"] for doc in payload}
    assert ids == {
        "doc-employee-handbook",
        "doc-north-ops",
        "doc-south-ops",
        "doc-finance-plan",
    }
