# 04 — Canonical Architecture Tree

**Normative reference:** `docs/architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md`  
**Operational reference:** `docs/ARCHITECTURE.md`  
**This tree:** Permanent naming and layering for Constitution era

---

## Permanent Architecture Hierarchy

```
PRODUCTION PLANE
├── Client Layer
│   ├── Cockpit (Grand King Executive UI)     → empireai-web/     [recommended canonical UX]
│   ├── Founder Shell (marketing + login)       → frontend/         [entry + redirect]
│   └── Browser session                         → cookie empireai_session
│
├── Edge / BFF Layer
│   └── Cockpit Proxy (Next.js /api/*)        → empireai-web/app/api/
│       ├── /api/auth/*   → Brain /auth/*
│       ├── /api/brain/*  → Brain /brain/*
│       └── /api/pillow/* → Brain /api/pillow/*
│
├── Execution Layer — Brain (Railway)
│   ├── Brain Core                              → backend/src/brain/
│   │   ├── Orchestrator (dispatch)
│   │   ├── LLM Router
│   │   ├── Tool Registry
│   │   ├── Task Queue (BullMQ)
│   │   ├── Event Bus
│   │   └── Agent / Workflow engines
│   ├── Guardian                                → backend/src/guardian/
│   ├── Auth                                    → backend/src/auth/
│   ├── Pillow Host (in-process COI)            → orchestration/pillow-host/
│   └── HTTP Surface
│       ├── Critical routes (always on in prod)
│       │   ├── /health/live, /health
│       │   ├── /auth/*
│       │   ├── /brain/dispatch
│       │   ├── /brain/events/stream
│       │   └── /api/pillow/*
│       └── Extension routes (~150 modules)     → EMPIRE_ENABLE_EXTENSION_ROUTES
│
├── Intelligence Layer — Pillow Package
│   └── @empireai/pillow                         → pillow/src/
│       ├── Bootstrap & governance
│       ├── Repository intelligence
│       ├── Technical chief · UX designer
│       ├── Cursor bridge
│       ├── Infrastructure commander
│       ├── Commerce intelligence
│       ├── Empire commander
│       ├── Empire operating system
│       └── Continuous evolution
│
├── Domain Layer
│   ├── Foundation (soul, doctrine, constitution, KPI, policy)
│   ├── Orchestration (business engines, commerce, reality integration)
│   ├── Runtime modules (REAL mission namespace)
│   ├── Intelligence engines (G3 product/market/supplier/…)
│   ├── Execution (CJ, Stripe, publishing, meta ads)
│   ├── Revenue (payments, loops, Grand King's revenue)
│   ├── Eye (connectors: Amazon, Google Trends, …)
│   └── Domain views (Executive Home, cockpit panels)
│
├── Builder Layer
│   ├── Cursor Bridge                           → pillow/cursor-bridge/
│   ├── Approval Gate                           → pillow-approval/
│   └── Store Builder agent                     → agents/definitions/
│
└── Persistence & Infrastructure Layer
    ├── SQLite (Brain primary DB)               → brain/sqlite-database.ts
    ├── Redis (sessions, queue, pub/sub)          → Upstash
    ├── Postgres (migration path)               → brain/postgres/
    ├── Railway (Brain API + optional worker)
    └── Vercel (Cockpit and/or Founder shell)
```

---

## Architecture Naming — Permanent Terms

| Use this term | Not this | Points to |
|---------------|----------|-----------|
| **Brain** | Backend API, server, Railway app | `backend/` execution kernel |
| **Cockpit** | Dashboard, platform, admin | `empireai-web/` executive UI |
| **Cockpit Proxy** | BFF, API routes | `empireai-web/app/api/` |
| **Founder Shell** | Frontend app, Vite app | `frontend/` marketing/login |
| **Pillow** | AI assistant, chatbot, OpenAI layer | `pillow/` + host |
| **Pillow Host** | Pillow server | `orchestration/pillow-host/` |
| **Guardian** | Health check, monitor | `guardian/` |
| **Runtime modules** | REAL (alone) | `backend/src/runtime/` |
| **Orchestration engines** | Business modules | `backend/src/orchestration/` |
| **Intelligence engines** | G3 (in prose) | `backend/src/intelligence/` |
| **Builder** | Cursor, bridge | Cursor Bridge subsystem |
| **Dispatch** | Module load, API call | `POST /brain/dispatch` |
| **Executive Home** | Command view, home page | dispatch module `executive-home` |
| **Critical routes** | Core routes | Production default HTTP surface |
| **Extension routes** | All REAL HTTP modules | Opt-in production surface |

---

## Architecture Documents — Permanent Roles

| Document | Role | Status |
|----------|------|--------|
| `EMPIREAI_CANONICAL_ARCHITECTURE.md` | Normative target | CANONICAL |
| `docs/ARCHITECTURE.md` | Developer operational map | OPERATIONAL |
| `PILLOW_ARCHITECTURE_CONTRACT.md` | Pillow interface contract | CANONICAL |
| `EMPIREAI_PILLOW_ARCHITECTURE.md` | Pillow domain design | CANONICAL |
| `EMPIREAI_EYE_ARCHITECTURE.md` | Connector architecture | CANONICAL |
| `EMPIREAI_ARCHITECTURE.md` | Living memory / changelog style | OPERATIONAL MEMORY |
| `docs/SYSTEM_ARCHITECTURE.md` | Pre-Pillow draft | HISTORICAL |

---

## Production Architecture Truth (Must Be Documented)

These are **architectural facts** that must appear in `EMPIREAI_PRODUCTION_TRUTH.md`:

1. Extension routes off by default in production Brain
2. Pillow production chat uses minimal LLM path
3. Pillow lazy boot on first session/chat
4. Workers/scheduler disabled at production API boot
5. Redis required for durable sessions; degraded = in-memory
6. SQLite sql.js single-process; debounced persist
7. Pillow chat sessions in-memory only

---

## Architecture Tree vs Intended Mission Brief

| Mission brief | Permanent architecture placement |
|---------------|----------------------------------|
| Brain | Execution Layer |
| Cockpit | Client + BFF |
| Builder / Cursor Bridge | Builder Layer |
| Runtime | Domain Layer — Runtime modules |
| Commerce | Domain Layer — Orchestration + Intelligence + Execution |
| Business Engines | Domain Layer — Orchestration |
| Production | Persistence & Infrastructure Layer |
| EmpireAI OS | Intelligence Layer (Pillow EOS) + Domain orchestration concept |
