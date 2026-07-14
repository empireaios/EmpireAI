# EmpireAI — Pillow Architecture

> **Canonical Pillow Architecture (P3-02):** [`docs/architecture/EMPIREAI_PILLOW_ARCHITECTURE.md`](docs/architecture/EMPIREAI_PILLOW_ARCHITECTURE.md) — permanent stewardship · synchronization · subsystems  
> **This document:** BL-B companion — Bootstrap · Context Builder · Operating Modes (retained)

**Canonical label:** Pillow Architecture (BL-B companion)  
**Status:** ✅ Bootstrap/modes doctrine · **Runtime PILLOW-002→019 implemented** — normative architecture at P3-02 path above  
**Registered:** BL-B Items 008, 011, 012, 013 (2026-06-29)  
**Canonical owners:** Pillow Architecture · AI Cognitive Doctrine · Repository Governance

---

## 1. Purpose

Pillow is the **Executive Intelligence of EmpireAI** — not a chatbot or autonomous agent. This document defines Bootstrap, Context Builder, Operating Modes, and Bootstrap success criteria for the executive intelligence surface Grand King uses to guide the Empire.

**Constitutional authority:** `EMPIREAI_PILLOW_CONSTITUTION.md`

**Platform hierarchy:** Pillow is the sole technical owner of EmpireAI. Brain, EKLS, Executive AI Engines, Business Engines, Grand King Cockpit, Registry, Mission System, Executive Audit System, Guardian, and future platform services are **Pillow-owned subsystems** — Brain is not a peer of Pillow. See Constitution §17.

**Bootstrap prepares Pillow. It never replaces or limits Pillow's intelligence.**

After Bootstrap, Pillow retains full OpenAI reasoning: strategic thinking, critiquing, forecasting, executive recommendations, general world knowledge, and EmpireAI operational reasoning — through **one continuous conversation**.

### 1.1 Presentation layer separation (ADR-047)

Pillow is **Executive Intelligence** — not a UI component.

| Layer | Component | Role |
|---|---|---|
| Intelligence | **Pillow** | Reasoning, synthesis, recommendations, constitutional discipline |
| Interaction | **GC-05** Global AI Assistant | Conversational interface to Executive Intelligence |
| Attention | **GC-03** Notifications Center | Priorities, events, alerts requiring awareness |

GC-05 and GC-03 expose Pillow capabilities **without embedding intelligence in the UI**. See `docs/governance/EXECUTIVE_UX_LAYER_ARCHITECTURE.md`.

---

## 2. Bootstrap Engine

**Pillow shall never begin a session without first understanding the current state of the Empire.**

### Auto-trigger events

* First login  
* Browser refresh  
* New session  
* Recovery session  
* Workstation replacement  

### Bootstrap synchronizes

Journey · Journey Audit · Soul · Decision Register · Project Status · Current UX Progress · Current REAL Progress · Latest Executive Audits · Active Backlog Release · Current Repository State · Live Frontend State · Live Backend State · Current Deployment State · Current Logged-in User

### Bootstrap sequence

```
Bootstrap Engine
        ↓
Repository Synchronization
        ↓
Context Builder
        ↓
Operational Readiness Check
        ↓
    Pillow Ready
```

---

## 3. Bootstrap success criteria (mandatory)

Pillow shall **not** report **"Ready"** until **all** criteria pass:

| # | Criterion |
|---|---|
| ✓ | Repository synchronized |
| ✓ | Journey synchronized |
| ✓ | Journey Audit synchronized |
| ✓ | Soul synchronized |
| ✓ | Decision Register synchronized |
| ✓ | Project Status synchronized |
| ✓ | Active Backlog Release identified |
| ✓ | Current UX position identified |
| ✓ | Current REAL position identified |
| ✓ | Latest Executive Audit loaded |
| ✓ | Context Builder initialized |
| ✓ | Repository health verified |
| ✓ | Operational state established |
| ✓ | Logged-in user verified |

---

## 4. Context Builder subsystem

Permanent architectural subsystem (see also `EMPIREAI_PILLOW_MEMORY_DOCTRINE.md`).

**Doctrine:** Determine the **minimum** repository knowledge required before every OpenAI API request. Never transmit unnecessary repository artifacts.

**Purpose:** Reduce API cost · improve speed · minimize tokens · improve reasoning quality.

---

## 5. Operating modes (automatic)

Pillow selects mode internally — Grand King never chooses manually.

| Mode | Examples |
|---|---|
| **General Intelligence** | Weather, news, learning, everyday conversation |
| **Empire Operations** | Journey, repository, UX, architecture, commercial strategy, executive decisions |
| **Engineering Operations** | Generate Cursor missions, review Executive Audits, synchronize repository, validate implementation |

---

## 6. Subsystems map

| Subsystem | Document | Runtime status |
|---|---|---|
| Bootstrap Engine | This document §2–3 | ✅ PILLOW-002 |
| Context Builder | This document §4 · Memory Doctrine | ✅ PILLOW-004 |
| Operating Mode Router | This document §5 | ✅ OpenAI layer |
| Empire Recovery Assessment | `EMPIREAI_EMPIRE_RECOVERY_DOCTRINE.md` | 🔵 Doctrine |

---

## 7. Engineering priority (BL-B Item 005)

```
UX Complete (UX-001…023)
        ↓
UX Master Executive Audit
        ↓
      Pillow
        ↓
Go-Live Preparation
```
