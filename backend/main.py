"""FastAPI application exposing document search APIs."""
from __future__ import annotations

from fastapi import FastAPI

from .documents.views import router as documents_router

app = FastAPI(title="Document Management Service")
app.include_router(documents_router)


@app.get("/healthz")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
