# DMS

Documents sorting, sharing and reading.

## Backend

The backend is a small FastAPI application that exposes document search and tagging
capabilities.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

This will start the API at `http://127.0.0.1:8000`. Available endpoints include:

- `GET /documents/tags` – list all tags.
- `POST /documents/{document_id}/tags` – add a tag to a document for the requesting user.
- `DELETE /documents/{document_id}/tags/{tag_slug}` – remove a tag from a document.
- `GET /documents/search` – search documents by tag, category, client and visibility
  while applying permission checks.

## Frontend

The frontend contains a reusable `SearchBar` React component under
`frontend/src/components/SearchBar`. The component offers tag suggestions, tag chips,
filter inputs and integrates with the backend search endpoint.

Example usage:

```tsx
import { SearchBar } from "./components/SearchBar";

<SearchBar actorId="alice" onResults={(documents) => console.log(documents)} />;
```

The component expects CSS modules to be supported by your build toolchain.
