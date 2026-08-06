# Failure Timeline — EmpireAI Production 502 Class (Root Cause)

## Lifecycle

```
Developer push → GitHub → Railway webhook → Nixpacks build
→ npm install pillow/backend → sync-pillow-governance → build
→ start: node backend/dist/index.js
→ env load (DATABASE_PATH, REDIS_URL, …)
→ SQLite sql.js open/migrate
→ Brain init + listen(:PORT)
→ Pillow host boot (async)
→ Cockpit opens → BFF → POST /api/pillow/session (N concurrent)
→ audit writes → sql.js dirty → sync export thrash (pre-fix)
→ event loop lag 15s–54s+
→ Railway edge timeout 15s → HTTP 502
→ process still ● Online (not crash loop)
→ health/login/chat all fail until manual redeploy
```

## FIRST origin (not first symptom)

**Origin:** Unbounded concurrent expensive work on a single Node event loop that also performs **synchronous sql.js `db.export()`**, with **no admission control** and **no reliable self-restart while wedged**.

Visible symptom (502) is the edge proxy timeout — secondary.

Amplifiers (ordered):
1. Default persist debounce 250ms (export thrash) — fixed in `a58d41d1`
2. Missing `/data` volume → ephemeral/wrong path — fixed ops + persistence gate
3. Build sync before `tsx` install — fixed `c303bdb1`
4. Cockpit dual session bootstrap + HTTP retries stampede — fixed `189ab8c8` (client)
5. Backend accepted unlimited session creates / no lag admission — **this change**
6. Continuity watchdog boot grace 180s + flush-guard forever — shortened + ceiling

## Permanent controls (this change set)

| Control | Purpose |
|---------|---------|
| sql.js persist throttle + atomic write | Stop export thrash |
| Frontend session coalesce + delayed recovery | Stop client stampede |
| Backend admission control (lag + concurrency) | Fail closed with 503 before wedge |
| Session getOrCreate reuse | Bound session allocation |
| Persistence gate (strict on Railway) | Fail deploy if not on `/data` |
| Continuity watchdog 60s grace + flush ceiling | Self-heal without manual redeploy |
