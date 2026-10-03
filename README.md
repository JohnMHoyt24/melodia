# Melodia

Melodia is an AI-assisted music discovery app. Chat about what you want to hear, and
Melodia suggests real artists, verified against MusicBrainz. It builds a library where
every artist is scored on six characteristics (energy, valence, melody, aggression,
danceability, complexity) and embedded as a vector, so you can find similar artists and
ask questions about your library.

- **Frontend:** Vite + React + TypeScript, Supabase Auth
- **Backend:** FastAPI, SQLAlchemy, Alembic, Postgres + pgvector (Supabase)
- **Data sources:** MusicBrainz (canonical metadata), Last.fm (tags)
- **AI:** Google Gemini (characteristic scoring, embeddings, chat, RAG answers)
- **MCP server:** exposes the library to MCP clients such as Claude Code

```text
frontend (Vite + React)  ──►  backend (FastAPI)
                                 │
        ┌────────────────┬───────┴────────┬─────────────┐
        ▼                ▼                ▼             ▼
  Supabase          Google Gemini     MusicBrainz     Last.fm
  Postgres+pgvector (scores, embed-   (metadata,      (tags)
  Auth, Storage      dings, chat)      no auth)
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the pieces fit together.

## Quick start

You'll need **Python 3.13**, **Node.js 22+**, and free accounts for
[Supabase](https://supabase.com), [Last.fm API](https://www.last.fm/api/account/create)
and [Google AI Studio](https://aistudio.google.com/app/apikey) (Gemini).

```bash
git clone https://github.com/JohnMHoyt24/melodia.git
cd melodia
```

1. **Backend:** follow [backend/README.md](backend/README.md) (create a venv, fill in
   `.env`, run `alembic upgrade head`, start the API on port 8000).
2. **Frontend:** follow [frontend/README.md](frontend/README.md) (fill in `.env`,
   `npm install`, `npm run dev`, open http://localhost:5173).

## Repository layout

```text
backend/     FastAPI app, Alembic migrations, tests, MCP server
frontend/    Vite + React + TypeScript single-page app
docs/        Architecture notes
.claude/     Claude Code skills for common Melodia workflows
```

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) and the
[Code of Conduct](CODE_OF_CONDUCT.md). To report a security issue, see
[SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) © 2026 John Hoyt
