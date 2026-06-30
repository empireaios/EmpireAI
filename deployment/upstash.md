# Upstash Redis — Cache, sessions, and queues

EmpireAI Brain uses Redis for:

- Session storage (production)
- BullMQ job queues
- Event bus / pub-sub
- Cross-instance coordination (Railway API + worker)

**Upstash Redis** is compatible with Brain via standard `REDIS_URL` — no code changes required for TLS.

---

## Setup

1. [console.upstash.com](https://console.upstash.com) → Create Redis database.
2. Choose region near your Railway services.
3. Copy the **Redis URL** — use the **`rediss://`** (TLS) variant for production.

Example:

```env
REDIS_URL=rediss://default:AbCdEf123456@us1-example-12345.upstash.io:6379
```

4. Set `REDIS_URL` on **both** Railway services (API + worker).

---

## Compatibility

Brain uses `ioredis` and BullMQ. Both support:

- `redis://` — local development
- `rediss://` — TLS (Upstash production default)

No additional TLS options are required in Brain env for typical Upstash URLs.

---

## Production requirements

| Setting | Production | Development |
|---------|------------|---------------|
| `REDIS_URL` | Upstash `rediss://` URL | `redis://127.0.0.1:6379` |
| `REDIS_OPTIONAL` | **unset** or `false` | `true` allowed |
| `NODE_ENV` | `production` | `development` |

If Redis is unreachable in production (non-Vercel), Brain **throws at startup** unless `REDIS_OPTIONAL=true` — do not use optional mode in managed production.

---

## Degraded mode (avoid in production)

Brain allows degraded in-memory fallback when:

- `NODE_ENV=development`, or
- `REDIS_OPTIONAL=true`, or
- `VERCEL` is set (legacy serverless)

Managed production on Railway must **not** set `VERCEL` or `REDIS_OPTIONAL=true`.

Symptoms of degraded mode:

- Sessions not shared across instances
- BullMQ queues in-memory only
- Event bus not durable

---

## Local development without Upstash

```bash
# Option A — local Redis
redis-server

# Option B — npm script (Docker convenience, optional)
cd backend && npm run dev:redis

# Option C — Upstash dev database (same as production pattern)
REDIS_URL=rediss://...
```

Docker is **one option among several** for local Redis — not mandatory.

---

## Worker dependency

The Railway **worker** service consumes BullMQ queues from the same Upstash instance. API and worker must share identical `REDIS_URL`.

---

## Verification checklist

- [ ] Upstash database created
- [ ] `REDIS_URL` set on Railway API + worker
- [ ] Brain logs show Redis connected (not degraded)
- [ ] `GET /health` reports healthy subsystems
- [ ] Async job completes (queue consumer on worker)

See [railway.md](./railway.md) and [MANAGED_DEPLOYMENT.md](./MANAGED_DEPLOYMENT.md).
