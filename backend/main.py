"""FastAPI application entry point for the DMS backend."""
from __future__ import annotations

from fastapi import FastAPI

from backend.api.routes import router as api_router

app = FastAPI(title="DMS Backend")
app.include_router(api_router)
