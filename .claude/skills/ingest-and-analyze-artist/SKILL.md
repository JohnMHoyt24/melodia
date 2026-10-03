---
name: ingest-and-analyze-artist
description: Use when adding an artist to Melodia's library end to end - ingest metadata from MusicBrainz/Last.fm, analyze with Gemini (characteristics + embedding), then find similar artists or ask RAG questions. Also for debugging why an artist is missing from similarity results.
---

# Ingest -> analyze -> similar / ask

The pipeline is deliberately three separate steps (see the docstring in
`backend/app/services/analyze.py`) so an artist can be re-analyzed without
re-ingesting.

| Step | Service | HTTP route | MCP tool |
|---|---|---|---|
| Ingest | `services/ingest.py: ingest_artist` | `POST /artists/ingest {name, album_limit}` | `ingest_artist` |
| Analyze | `services/analyze.py: analyze_artist` | `POST /artists/{id}/analyze` | `analyze_artist` |
| Similar | `services/similarity.py: find_similar_artists` | `GET /artists/{id}/similar?limit=` | `find_similar_artists` |
| RAG | `services/rag.py: ask` | `POST /artists/ask {question, limit}` | `ask_music_question` |

The MCP server is `backend/mcp_server.py`, registered in `.mcp.json`.

## Steps

1. **Ingest.** MusicBrainz lookup plus Last.fm tags for genres. Synchronous and slow
   (MusicBrainz rate limit; `album_limit` bounds per-album track calls). 404 =
   `ArtistNotFound`. Needs `LASTFM_API_KEY` for genre tags; without genres the analysis
   is weak. Album tracklists load separately: `POST /artists/{id}/albums`, then
   `POST /albums/{id}/tracks`.
2. **Analyze.** Two Gemini calls: `classify_characteristics` (6 scores, see
   `core/constants.py`) and `embed_text` on `"<name> - genres: a, b"`. 503 =
   `GeminiNotConfigured` (no `GEMINI_API_KEY`). Retries handle 429/503/timeouts, but
   the free tier has a daily cap - batch many artists across days.
3. **Similar.** Cosine similarity over `artists.embedding` (pgvector `<=>`). 409 =
   `ArtistNotAnalyzed`.
4. **Ask (RAG).** Embeds the question, retrieves the nearest analyzed artists, and
   answers using only them. Returns `answer` and `sources`.

## Debugging "artist missing from results"

- `embedding IS NULL` means never analyzed (or nulled during a model migration). Only
  analyzed artists are candidates for similarity and RAG.
- Only two artists analyzed means tiny results; ingest and analyze more.
- Wrong or empty genres: re-ingest, then re-analyze (analysis reads stored genres).
- Similarity and RAG need real Postgres + pgvector; the SQLite test suite stubs
  retrieval, so verify live against Supabase.

## Doing it in code / tests

Tests mock Gemini and MusicBrainz with `respx` / `monkeypatch` - follow
`tests/test_analyze.py`, `tests/test_ingest.py`, `tests/test_rag.py`. Run:
`cd backend && python -m pytest -q`.
