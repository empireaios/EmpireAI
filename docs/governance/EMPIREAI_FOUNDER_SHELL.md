# EMPIREAI FOUNDER SHELL

> **Classification:** CANONICAL — Tier 3 Law (Governance)  
> **Document ID:** P7-01 · FOUNDER_SHELL  
> **Parent:** [`EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md`](./EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md)  
> **Companion:** [`EMPIREAI_ZERO_HUMAN_AUTOMATION_ARCHITECTURE.md`](./EMPIREAI_ZERO_HUMAN_AUTOMATION_ARCHITECTURE.md) · [`EMPIREAI_EXECUTION_CONTROL_CENTER.md`](./EMPIREAI_EXECUTION_CONTROL_CENTER.md)  
> **Authority:** **Single permanent Founder Shell** — no competing founder experiences  
> **Runtime:** `pillow/src/founder-shell/` · **PILLOW-FS-001**

---

## 1. Purpose

Phase P6 established the complete Execution Foundation. P7-01 establishes the permanent **Founder Shell**.

The Founder Shell is NOT merely a dashboard. It is the canonical operating environment through which every Founder, including the Grand King, experiences EmpireAI.

The Grand King defines direction. EmpireAI provides one unified executive workspace.

**One login · One workspace · One navigation · One executive experience.**

---

## 2. Founder workspaces

| Workspace | Purpose |
|-----------|---------|
| **Executive Home** | Business · mission · builder · supervisor · production · revenue · alerts · recommendations |
| **Business Workspace** | Portfolio companies and business operations |
| **Pillow Workspace** | Primary executive advisor — conversation and intelligence |
| **Builder Workspace** | Mission progress · ETA · repository activity · validation · recovery |
| **Journey Workspace** | Empire journey position · roadmap · mission history |
| **Production Workspace** | Production truth · deployment · browser verification |
| **Commerce Workspace** | Store · launch · marketing · ads |
| **Knowledge** | Repository intelligence and executive knowledge |
| **Settings** | Governance settings and founder preferences |
| **Notifications** | Executive alerts and pending actions |
| **Mission Centre** | Active and queued missions |

**Runtime:** `FOUNDER_WORKSPACE_REGISTRY`

---

## 3. Founder navigation

```
Executive Home → Businesses → Pillow → Builder → Journey → Production → Commerce → Knowledge → Settings
```

Navigation shall remain consistent throughout the application.

**Runtime:** `FOUNDER_NAVIGATION_REGISTRY` · Cockpit sidebar Founder group

---

## 4. Founder context preservation

The Founder Shell preserves: Current Business · Current Mission · Current Journey · Current Context · Current Notifications · Current Recommendations · Current Session · Current Workspace.

**Runtime:** `syncFromRuntime()` · `FounderShellProvider`

---

## 5. Integration

| System | Relationship |
|--------|--------------|
| **Cockpit** | Founder Shell wraps Cockpit — entry experience into executive operating interface |
| **Pillow** | Primary advisor with workspace · business · journey · mission awareness |
| **Builder Monitor** | Builder workspace exposes progress · ETA · repository · recovery |
| **Supervisor** | Executive Home summarizes supervisor status |
| **Journey** | Journey workspace and context preservation |
| **Production** | Production workspace and executive home production status |
| **Commerce** | Business and commerce workspaces |
| **ECC** | Mission coordination visible in Mission Centre |

---

## 6. Grand King acceptance

The Grand King enters EmpireAI through one unified Founder Shell and immediately accesses Executive Home · Businesses · Pillow · Builder · Journey · Production · Commerce — without switching between disconnected interfaces.

**Runtime:** `getCockpitSnapshot()` · `buildExecutiveHomeSummary()`

---

**Ratified:** 2026-07-05 (P7-01)

**Successor:** P7-02 — Cockpit UX ✅ · P7-03 — Pillow UX

**Phase P7:** Experience — in progress
