# GK Path Equivalence — Permanent Qualification Doctrine

**Effective:** 2026-09-07 (INFRASTRUCTURE_PATH_PARITY mission)

## Rule

No future claim of:

- `REAL_PATH`
- `PRODUCTION_PATH`
- `FIRST_VISIBLE_PRODUCTION`
- `PRODUCTION_FIRST_VISIBLE_PASS`

may be used as **Grand King readiness evidence** unless:

```
GK_PATH_EQUIVALENCE=YES
```

is reported with evidence.

## Material equivalence requirements

A qualification route is GK-equivalent only if it shares **all** of:

| Layer | Required |
|---|---|
| Origin | Cockpit BFF `https://empire-ai.co` (or same production frontend host) |
| Auth | Real `empireai_session` cookie via `/api/auth/login` |
| Session | `POST /api/pillow/session` |
| Chat | `POST /api/pillow/chat` (not Brain `/api/pillow/chat` direct) |
| Workspace | `screenId: "SCR-800"`, Pillow Centre path, `module: "executive"` preferred |
| Timeouts | Client ≥ 290s; BFF upstream 280s; must not invent a shorter harness-only deadline that masks BFF behavior |
| Failure accounting | Infrastructure-budget terminal **and** `bffRecovery: true` count as **FAIL** |
| Semantic SHA | Same Brain deployment as the chat under test |

## Canonical script

`backend/scripts/gk-path-qualification.mjs`

Evidence artifact: `docs/audits/capability-extraction/GK_PATH_QUALIFICATION.json`

## Anti-patterns (not GK-equivalent alone)

- Hitting Brain URL directly while skipping BFF sanitize/degrade
- Hardcoding `screenId: "pillow-centre"` without SCR-800
- Ignoring `bffRecovery` / infrastructure-budget terminal as “transport noise”
- Treating `/health/live` or deploy-gate PASS as proof of Grand King chat parity

## Historical root cause (2026-09-07)

BFF `looksLikeForbiddenInfraDecoration` replaced **substantive** executive answers containing protected-state footers (`product focus`, `realised commerce`, `Birth remains…`) with the infrastructure-budget terminal. Harness arithmetic probes often lacked those footers → false PRODUCTION PASS while Grand King NovaCart chat failed.

Fix: strip footers; degrade only on empty / non-2xx / transport failure. Tier-0 Fastify `requestTimeout` raised 150s → 300s to match recovery budget.
