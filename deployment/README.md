# EmpireAI Deployment

Production-oriented stack for local and container deployment.

## Prerequisites

- Node.js 22+
- Redis 7+
- Docker & Docker Compose (optional)

## Local development

```bash
# Terminal 1 — Redis (or use Docker)
redis-server

# Terminal 2 — Brain API
cd backend
cp .env.example .env
npm install
npm run dev

# Terminal 3 — Next.js UI
cd empireai-web
npm install
npm run dev
```

Login: `founder@empireai.com` / `EmpireAI2026!`

## Validation gate (Phase 2.5+)

```powershell
cd backend
.\scripts\validate-phase25.ps1
```

Produces `phase25-report.json` with subsystem checklist, Guardian health, and test results.

## Docker Compose

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Web UI | http://localhost:3000 |
| Brain API | http://localhost:4000 |
| Redis | localhost:6379 |

## Environment variables

| Variable | Service | Description |
|----------|---------|-------------|
| `REDIS_URL` | Brain | BullMQ, sessions, event bus |
| `DATABASE_PATH` | Brain | SQLite path for domain + audit data |
| `GUARDIAN_ENABLED` | Brain | Safety gate on all dispatches |
| `BRAIN_API_URL` | Web | BFF proxy target (default `http://localhost:4000`) |
| `SESSION_SECRET` | Brain | Cookie signing (32+ chars in production) |
| `CORS_ORIGIN` | Brain | Allowed frontend origin |

## Health & observability

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /health` | Public | Brain + Guardian summary |
| `GET /metrics` | Admin | Request latency & error rates |
| `GET /guardian/health` | User | Full subsystem health report |

## Production checklist

- [ ] Change `SESSION_SECRET` and default user passwords
- [ ] Configure LLM API keys (`OPENAI_API_KEY`, etc.)
- [ ] Run `npm run validate:full` before deploy
- [ ] Enable TLS termination (reverse proxy)
- [ ] Back up SQLite database volume
- [ ] Run dedicated worker process: `npm run start:worker`
