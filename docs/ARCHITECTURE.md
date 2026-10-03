# Melodia architecture

## Overview

```text
frontend (Vite + React + TS)
   │  Supabase Auth (sign-in, sessions) ──► Supabase
   │  REST + Bearer JWT
   ▼
backend (FastAPI)
   ├─► Supabase Postgres + pgvector   (artists, albums, tracks, genres, chats, libraries)
   ├─► Google Gemini                  (characteristic scores, embeddings, chat, RAG)
   ├─► MusicBrainz                    (canonical artist/album/track metadata, no auth)
   └─► Last.fm                        (user-generated tags, stored as genres)
```

The frontend talks to Supabase only for authentication and avatar storage. Everything
else goes through the backend.

## Why these data sources

Spotify deprecated Audio Features, Audio Analysis, Recommendations and Related Artists
for new apps in November 2024. Melodia instead derives its own characteristic scores
with an LLM, using MusicBrainz for canonical metadata (free, open, no auth) and Last.fm
tags as genre signals.

## Data model

| Table | Purpose |
| --- | --- |
| `artists` | MusicBrainz ID, name, `characteristics` (JSON of six floats in [0, 1]), `embedding` (`vector(768)`) |
| `albums`, `tracks` | Discography from MusicBrainz, fetched on demand |
| `genres`, `artist_genres` | Last.fm tags |
| `chat_threads`, `chat_messages` | Per-user conversation history; assistant messages store the artists they cite (`sources`) |
| `user_artists` | Per-user library |

There is no local `users` table. Supabase's `auth.users` is the source of truth, and the
backend trusts the verified JWT `sub` claim as the user ID.

The six characteristics are defined in `backend/app/core/constants.py`: energy,
valence, melody, aggression, danceability and complexity.

`Artist.embedding` uses `Vector(768).with_variant(JSON(), "sqlite")`, so the same models
work against Postgres and against the SQLite test suite.

## Pipeline: ingest → analyze → query

1. **Ingest** (`app/services/ingest.py`) looks up the artist on MusicBrainz and pulls
   Last.fm tags. MusicBrainz allows about 1 request per second, so ingestion is
   throttled and runs on the request path. Two fast paths keep it responsive:
   - `album_limit=0` fetches only the artist and tags (1 MusicBrainz call instead of
     1 + 2N). Chat suggestions use this so they appear in seconds, not 30–90 seconds.
   - If an artist with the same name is already in the database, no external calls
     are made. Each artist pays the MusicBrainz and Last.fm cost once, no matter how
     often it's suggested.

   Album lists are fetched as lightweight "shells" in one call. Each album's tracklist
   is fetched only when someone opens it.

2. **Analyze** (`app/services/analyze.py`) makes two Gemini calls. One scores the six
   characteristics from the artist's name and genres (structured JSON output, clamped
   to [0, 1]). The other embeds a text summary into 768 dimensions. Analysis is kept
   separate from ingestion, so either can be redone independently, for example
   re-analyzing after a prompt change.

3. **Background analysis queue** (`app/services/analysis_queue.py`): newly ingested
   artists are analyzed by a single in-process worker thread with a pause between
   jobs, to stay under Gemini's per-minute limits. It deliberately isn't Redis or RQ.
   An artist needs analysis exactly when `artists.embedding IS NULL`, so nothing is
   lost on restart: the artist page or the next ingest re-queues it. Queue status
   (queued, running, failed) is held in memory. Whether analysis is done comes from
   the database. Set `AUTO_ANALYZE=false` to turn the queue off.

4. **Query**
   - **Similarity** (`app/services/similarity.py`) runs a pgvector cosine-distance
     search (`<=>`) over analyzed artists.
   - **RAG** (`app/services/rag.py`) embeds the question, retrieves the nearest
     artists, renders their genres and scores as context, and makes one Gemini call to
     answer. That's 2 Gemini calls per question.
   - **Chat** (`app/services/chat.py`) makes one structured Gemini call per turn, which
     both replies and suggests artists. It sends the thread's recent history, plus
     retrieved library artists as context. Every suggested name is checked against
     MusicBrainz through ingestion, so names Gemini makes up get dropped.

## Authentication

Supabase Auth runs entirely in the browser (supabase-js). The backend never sees a
password. Protected routes (`/chat/*`, `/library/*`) require a
`Authorization: Bearer <access token>` header. `app/core/auth.py` verifies the token
against the project's public JWKS
(`$SUPABASE_URL/auth/v1/.well-known/jwks.json`). Supabase signs tokens with a
per-project ES256 key, so the backend needs no shared secret.

Avatars live in a public Supabase Storage bucket, `avatars`. Row-level policies let
users write only under `avatars/<their uid>/`. These are created by migration
`a3c1f7d2b9e4`, which is why the migrations require Supabase rather than plain Postgres.

## Gemini and free-tier quotas

Melodia is built to run on Gemini's free tier, so it keeps Gemini calls to a minimum:

| Operation | Gemini calls |
| --- | --- |
| Analyze one artist | 2 (classify + embed) |
| RAG question | 2 (embed + generate) |
| Chat turn | 1 generation, plus 1 embedding for retrieval |

- **The default generation model is `gemini-flash-lite-latest`.** During development,
  `gemini-flash-latest` returned `429 RESOURCE_EXHAUSTED` after 20 requests per day per
  project. The lite model has more headroom.
- **The default embedding model is `gemini-embedding-001`.** Its output is pinned to
  768 dimensions with `outputDimensionality` to match the `vector(768)` column.
  Changing the embedding model means re-embedding every artist.
- Model names change often: `gemini-2.0-flash` and `text-embedding-004` were both
  retired during development. Override them with `GEMINI_GENERATION_MODEL` and
  `GEMINI_EMBEDDING_MODEL`, and check
  https://ai.google.dev/gemini-api/docs/rate-limits for current limits.
- The Gemini client retries on 429 (honoring `Retry-After`), 503 and read timeouts.
  The MusicBrainz client retries on 503 and read timeouts.

## Testing strategy

The backend suite (`backend/tests`) runs on in-memory SQLite, with every HTTP call
mocked by `respx` and auth overridden with a fixed test user. pgvector operators don't
exist in SQLite, so similarity search and RAG retrieval are stubbed in tests. Verify
those manually against a real Supabase database whenever you change them.
