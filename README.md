# Jarvis

Personal assistant app: daily briefing, habits, notes, weekly menu, budget, fitness, bike activities, work transcription, and Blajeni house project — in one dark, mobile-first PWA.

## Stack
- **Backend:** Node.js, Express, SQLite (better-sqlite3)
- **Frontend:** React, Vite, Tailwind CSS, React Query, Zustand
- **AI:** Claude API (`claude-sonnet-4-6`), OpenAI Whisper
- **Integrations:** Gmail OAuth2, Komoot, FIT file parsing (Garmin/Coros)

## Development

```bash
# Backend (port 3001)
cd backend && npm install && cp ../.env.example .env && npm run dev

# Frontend (port 5173, proxies /api to backend)
cd frontend && npm install && npm run dev
```

## Deploy (Railway)
Push the repo to GitHub, create a Railway project from it — `railway.json` builds the frontend and serves it from the Express backend. Set the env vars from `.env.example` in the Railway dashboard. Attach a volume and point `DATABASE_URL` at it so SQLite persists across deploys.

## PWA on iPhone
Open the deployed URL in Safari → Share → "Add to Home Screen".
