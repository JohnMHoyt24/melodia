# Melodia frontend

Vite + React + TypeScript single-page app for Melodia. Supabase Auth handles sign-up,
sign-in and password reset directly from the browser. Everything else goes through the
[backend](../backend/README.md) API.

## Requirements

- Node.js 22+
- The backend running locally (default http://localhost:8000)
- The same Supabase project the backend uses

## Setup

```bash
cd frontend
npm install
cp .env.example .env
```

| Variable | Value |
| --- | --- |
| `VITE_API_BASE_URL` | Backend URL, default `http://localhost:8000` |
| `VITE_SUPABASE_URL` | Supabase dashboard → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase dashboard → Settings → API → anon/public key (safe to expose in the browser) |

### Supabase Auth settings

In the Supabase dashboard, under **Authentication → URL Configuration**:

- **Site URL:** `http://localhost:5173`
- **Redirect URLs:** add `http://localhost:5173/reset-password` so password-reset
  emails link back to the app.

## Scripts

```bash
npm run dev       # dev server at http://localhost:5173
npm run lint      # oxlint
npm run build     # type-check and production build into dist/
npm run preview   # serve the production build
```

## Layout

```text
src/pages/        Route components: chat, artist, library, profile, auth, reset password
src/components/   Shared UI (characteristic bars, similar artists, library button, user bar)
src/lib/          API client, Supabase client, auth context, library hook
```
