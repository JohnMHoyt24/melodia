---
name: write-alembic-migration
description: Use when changing Melodia's database schema - models, columns, tables, pgvector columns/indexes, or Supabase-specific SQL - and a new Alembic migration is needed.
---

# Writing an Alembic migration for Melodia

Backend: `backend/`. Postgres on Supabase with pgvector; tests use SQLite.
Run all commands from `backend/` with its venv activated:
`python -m alembic ...`

`alembic/env.py` reads `DATABASE_URL` from app settings (`.env`), overriding
`alembic.ini`, and imports models from `app.models` so autogenerate sees them. New
models must be exported from `app/models/__init__.py` or autogenerate won't find them.

## Workflow

1. Edit the model in `app/models/`. Keep it SQLite-compatible for tests (see the
   `Vector(...).with_variant(JSON(), "sqlite")` pattern in `models/artist.py`).
2. Generate: `alembic revision --autogenerate -m "short description"`.
3. **Read and fix the generated file** - autogenerate is a draft:
   - It does not emit `CREATE EXTENSION`. Any migration that adds a `vector` column
     must run `op.execute("CREATE EXTENSION IF NOT EXISTS vector")` **first** in
     `upgrade()`, before `op.add_column` / `create_table` (see
     `ed911727f8df_add_characteristics_and_embedding_to_.py`). Without it Postgres
     fails on the unknown `vector` type.
   - It emits `import pgvector.sqlalchemy` and a
     `VECTOR(dim=N).with_variant(JSON, 'sqlite')` column - keep that import.
   - It does not track Supabase objects (storage buckets, RLS policies, `auth.uid()`
     policies). Write those by hand with `op.execute(...)` as in
     `a3c1f7d2b9e4_add_avatars_storage_bucket.py`, and make `downgrade()` reverse them.
   - Ensure `down_revision` chains to the current head (`alembic heads` must show one).
4. Write a real `downgrade()` (drop in reverse order).
5. Apply: `alembic upgrade head`. Verify against the real DB:
   `SELECT extname FROM pg_extension;` and
   `SELECT data_type FROM information_schema.columns WHERE table_name='artists';`
   (an embedding column should be `USER-DEFINED` / `vector`, not json).
6. Run tests: `python -m pytest -q`. They use
   `Base.metadata.create_all` on SQLite, so they do **not** exercise the migration -
   the live `upgrade head` in step 5 is the real check.

## pgvector specifics

- Changing embedding dimension: pgvector cannot cast between dimensions. Null or drop
  and re-add the column, then re-embed all artists (see `add-gemini-model-migration`).
  Update `EMBEDDING_DIM` in `app/core/constants.py` to match.
- Similarity indexes: the app queries with cosine distance (`<=>`), so use
  `op.execute("CREATE INDEX ... ON artists USING hnsw (embedding vector_cosine_ops)")`.

## Gotchas

- Connection strings: a wrong driver scheme (needs `postgresql+psycopg://`) or leftover
  `[brackets]` from `.env.example` placeholders are the usual causes of a failed
  connection.
- Never edit an already-applied migration; add a new one.
- If the change affects the data model, update `docs/ARCHITECTURE.md`.
