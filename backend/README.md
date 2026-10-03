# Melodia backend

FastAPI service that ingests artists from MusicBrainz and Last.fm, analyzes them with
Google Gemini (characteristic scores and a 768-dimension embedding), and serves
similarity search, RAG answers, chat threads, and per-user libraries. Data lives in
Supabase Postgres with pgvector.

## Requirements

- Python 3.13
- A Supabase project (free tier is fine)
- A Last.fm API key and a Gemini API key (both free)

## Setup

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements-dev.txt
cp .env.example .env
```

Fill in `.env`. Every variable is documented in [.env.example](.env.example).

| Variable | Where to get it | Needed for |
| --- | --- | --- |
| `DATABASE_URL` | Supabase dashboard → Connect → Session pooler URI. Change the scheme to `postgresql+psycopg://` and replace the `[BRACKETED]` placeholders, brackets included. | Everything |
| `SUPABASE_URL` | Supabase dashboard → Settings → API | Signed-in routes (`/chat`, `/library`) |
| `LASTFM_API_KEY` | https://www.last.fm/api/account/create | Ingestion |
| `GEMINI_API_KEY` | https://aistudio.google.com/app/apikey | Analysis, chat, RAG |

### Database

Run the migrations against your Supabase database:

```bash
alembic upgrade head
```

The migrations enable the `vector` extension and create an `avatars` storage bucket
with row-level policies. The storage migration uses Supabase's `storage` schema, so
it only runs against Supabase, not plain Postgres.

## Running

```bash
fastapi dev app/main.py
```

The API runs at http://localhost:8000, with interactive docs at
http://localhost:8000/docs.

> **Gemini free-tier quota:** each analyzed artist costs 2 Gemini calls, and newly
> ingested artists are analyzed in the background by default. If you hit `429` errors,
> set `AUTO_ANALYZE=false` in `.env` and analyze artists on demand instead. See
> [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md#gemini-and-free-tier-quotas).

## Tests

```bash
python -m pytest -q
```

The suite uses in-memory SQLite and mocks every external API with `respx`, so it needs
no `.env`, no network access and no API keys. pgvector queries (similarity search and
RAG retrieval) can't run on SQLite, so those code paths are stubbed in tests. Verify
them manually against a real Supabase database.

## MCP server

[mcp_server.py](mcp_server.py) exposes the library to MCP clients such as Claude Code:
`list_artists`, `get_artist`, `ingest_artist`, `analyze_artist`,
`find_similar_artists` and `ask_music_question`. It uses the same `.env` as the API.

To register it with Claude Code, copy `.mcp.json.example` from the repo root to
`.mcp.json`. On macOS and Linux, change `command` to `backend/.venv/bin/python`.

## Layout

```text
app/api/        FastAPI routers (artists, albums, search, chat, library, health)
app/core/       Settings, database session, Supabase JWT auth, constants
app/models/     SQLAlchemy models
app/schemas/    Pydantic request/response models
app/services/   MusicBrainz, Last.fm and Gemini clients; ingest, analysis, similarity,
                RAG, chat, background analysis queue
alembic/        Migrations
tests/          pytest suite
```
