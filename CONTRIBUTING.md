# Contributing to Melodia

Thanks for your interest in Melodia! Bug reports, docs fixes, and features are all
welcome.

## Before you start

- For anything bigger than a small fix, please open an issue first so we can agree on
  the approach before you write code.
- By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Development setup

Follow [backend/README.md](backend/README.md) and
[frontend/README.md](frontend/README.md). You'll need your own free Supabase, Last.fm
and Gemini credentials to run the full app. The backend tests need none of them.

## Making changes

1. Fork the repo and create a branch from `main`, for example `fix/similar-artists-empty`.
2. Keep pull requests focused: one logical change per PR.
3. Run the checks for whatever you touched:

   ```bash
   # backend
   cd backend && python -m pytest -q

   # frontend
   cd frontend && npm run lint && npm run build
   ```

4. Add or update tests for backend behavior changes. Mock external APIs with `respx`.
   Tests must never call MusicBrainz, Last.fm or Gemini for real.
5. Open a pull request and fill in the template. CI runs the same checks.

## Conventions

- **Backend:** type hints on public functions, and a short module docstring explaining
  *why* a service is shaped the way it is. Routes stay thin, and logic lives in
  `app/services/`.
- **Frontend:** TypeScript with no `any` where avoidable, function components and hooks.
- **Schema changes** need a new Alembic migration. Never edit one that's already
  applied. See `.claude/skills/write-alembic-migration/SKILL.md` for the full checklist
  (it doubles as human-readable docs).
- **Gemini model changes:** see `.claude/skills/add-gemini-model-migration/SKILL.md`.
  Changing the embedding model requires re-embedding every artist.
- Be mindful of Gemini free-tier quotas. Avoid adding Gemini calls on hot paths
  without discussing it first.
- Never commit `.env` files, API keys or database URLs.

## Using Claude Code

The repo includes Claude Code skills in `.claude/skills/` for common workflows (ingest
and analyze an artist, write a migration, migrate a Gemini model). Using them is
optional.
