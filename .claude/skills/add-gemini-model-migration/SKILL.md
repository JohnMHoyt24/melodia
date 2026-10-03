---
name: add-gemini-model-migration
description: Use when a Gemini model in Melodia is retired, renamed (404s), rate-limited, or being swapped for another - covers the generation model and the embedding model, including the re-embedding that an embedding change forces.
---

# Migrating a Gemini model in Melodia

Gemini model names churn: `gemini-2.0-flash` and `text-embedding-004` both 404'd
after being chosen. Free-tier quotas also differ per
model (`gemini-flash-latest` is capped at ~20 requests/day; `gemini-flash-lite-latest`
has more headroom). Confirm current names and limits at
https://ai.google.dev/gemini-api/docs/models and .../rate-limits before choosing - do
not rely on memory.

## Where model names live

- `backend/app/core/config.py` - `gemini_generation_model` and
  `gemini_embedding_model` (the single source of truth; overridable via `.env`).
- `backend/tests/test_gemini.py` - hardcodes `gemini-embedding-001` in mocked
  URLs and a fake `Settings`; update these to match.
- `backend/app/core/constants.py` - `EMBEDDING_DIM` and its docstring
  (mentions the embedding model by name).
- `backend/.env.example` and `docs/ARCHITECTURE.md` - document the defaults.
- A local `.env` may override the defaults - check it.

Grep for the old name across the repo (excluding `.venv`) to catch stragglers.

## Generation model swap

1. Change the default in `config.py` (and `.env` if overridden).
2. Update test fixtures that reference it.
3. Structured output (`responseSchema` in `classify_characteristics` and `chat_turn`)
   is model-sensitive - run the live check below, not just the mocked tests.
4. If rate limits were the motivation, note the number and date in the `config.py`
   comment, as is done today.

## Embedding model swap (the dangerous one)

Embeddings from different models live in different vector spaces, even at the same
dimension. Mixing them silently ruins `find_similar_artists` and RAG retrieval.

1. Change `gemini_embedding_model`. `embed_text` pins `outputDimensionality` to
   `EMBEDDING_DIM` (768) - `gemini-embedding-001`'s native size is larger, so keep
   pinning it.
2. If the new dimension is not 768:
   - change `EMBEDDING_DIM` in `constants.py`;
   - write an Alembic migration altering `artists.embedding` (see the
     `write-alembic-migration` skill); pgvector cannot cast between dimensions, so
     existing vectors must be nulled or the column dropped and re-added;
   - the sqlite test variant is JSON, so tests are unaffected.
3. **Re-embed every artist**: re-run `analyze_artist` for all rows with an embedding
   (see `ingest-and-analyze-artist`). Mind the free-tier quota: analyze costs 2 Gemini
   calls per artist (classification + embedding), so batch across days if needed.
   Until finished, similarity and RAG results mix spaces - consider nulling old
   embeddings first so they are excluded rather than wrong.

## Verify

1. `cd backend && python -m pytest -q` (mocked; catches
   fixture drift only).
2. Live check with a real `GEMINI_API_KEY`: call `POST /artists/{id}/analyze` on one
   artist and confirm 6 characteristic scores in [0,1] and a 768-length embedding.
   A 404 means the model name is wrong; a 429 with a daily-quota message means pick a
   model with more free-tier headroom.
3. Record the change and the reason in `docs/ARCHITECTURE.md` (Gemini section).
