# EMPIREAI PILLOW ARCHITECTURE

> **Classification:** CANONICAL — Tier 5 Normative Architecture (Pillow)  
> **Document ID:** P3-02  
> **Constitutional phase:** P3 — Architecture Foundation  
> **Dependencies:** P1 complete · P2 complete · P3-01 · Architecture Law · Pillow Constitution §17  
> **Owner:** Pillow (constitutional steward) · Chief Architect (normative maintainer)  
> **Authority:** CANONICAL — single permanent Pillow architecture; **subordinate to CTD · Pillow Constitution · Architecture Law**  
> **Parent:** [`EMPIREAI_ARCHITECTURE_LAW.md`](./EMPIREAI_ARCHITECTURE_LAW.md) · [`EMPIREAI_CANONICAL_ARCHITECTURE.md`](./EMPIREAI_CANONICAL_ARCHITECTURE.md) §3.4  
> **Ratified:** 2026-07-05 (P3-02)  
> **Role:** Permanent architecture of Pillow — constitutional operating intelligence; reconstructed from repository, not a rewrite

**Identity law:** [`EMPIREAI_PILLOW_CONSTITUTION.md`](../../EMPIREAI_PILLOW_CONSTITUTION.md)  
**Implementation contract:** [`PILLOW_ARCHITECTURE_CONTRACT.md`](../../PILLOW_ARCHITECTURE_CONTRACT.md) (frozen V1 mission order)  
**BL-B companion:** [`EMPIREAI_PILLOW_ARCHITECTURE.md`](../../EMPIREAI_PILLOW_ARCHITECTURE.md) (bootstrap · modes doctrine)  
**Brain interface:** [`EMPIREAI_BRAIN_ARCHITECTURE.md`](./EMPIREAI_BRAIN_ARCHITECTURE.md) (P3-01)  
**Platform placement:** [`EMPIREAI_HIERARCHY.md`](../governance/EMPIREAI_HIERARCHY.md) — Pillow = Tier 1 stewardship · Tier 5 runtime ownership

---

## 1. Purpose

Pillow is **not** merely an AI assistant. Pillow is the **permanent constitutional steward** of EmpireAI — the **constitutional operating intelligence** that continuously understands, synchronizes, protects, and recommends.

| Pillow IS | Pillow IS NOT |
|-----------|---------------|
| Constitutional steward · sole technical owner | Runtime execution engine (Brain) |
| Continuous integrity guardian (architecture · engineering · constitution · production) | Builder (Cursor implementation channel) |
| Mission-start synchronization authority | Cockpit (visualization shell) |
| Supervisor governance owner | Grand King (sovereign decisions) |
| Recommendation and drift detection | Constitution author |
| Repository · Journey · Vision continuity | Autonomous production mutator without approval |

**The principle:** Pillow owns stewardship · Brain executes · Builder implements · Cockpit visualises · Grand King decides.

---

## 2. Constitutional Relationships

```
Grand King (Tier 0 — sovereign)
        ↓
Vision · Soul (WHY · WHO — Pillow synchronizes, never owns)
        ↓
CTD · Constitutions · Doctrine System (law — Pillow detects drift, never amends)
        ↓
Roadmap · Hierarchy · Architecture Law (WHAT NEXT · HOW governed)
        ↓
Pillow (this document — continuous stewardship)
        ↓
Brain · Cockpit · Builder · Guardian (owned subsystems)
        ↓
Production · Evidence
```

| System | Relationship |
|--------|--------------|
| **Vision · Soul** | Mandatory read at mission start; Vision Accumulation post-mission |
| **CTD · Engineering Constitution** | Drift detection; never silent override |
| **Architecture Law · Canonical Architecture** | Architectural integrity duty; compares normative vs repository vs production |
| **Documentation Law** | Documentation health in continuous duties |
| **Brain** | Pillow-owned execution kernel — HTTP host, LLM adapter, dispatch boundary |
| **Cockpit** | Pillow intelligence surfaced via GC-03/GC-05; no embedded reasoning in UI |
| **Builder** | Supervised via Cursor Supervisor + Approval Gate; no direct repo write |
| **Guardian** | Pillow-owned Brain module — pre-dispatch protection |
| **Commerce · Business Engines** | Pillow stewards; Brain executes tools |
| **Production Truth** | Production synchronization and drift detection |

---

## 3. Ownership & Stewardship

| Field | Definition |
|-------|------------|
| **Constitutional owner** | Pillow (steward role under Grand King) |
| **Normative maintainer** | Chief Architect |
| **Steward** | Pillow COI — continuous observation |
| **Consumers** | Grand King · Chief Architect · Builder (supervised) · Cockpit (display) |
| **Runtime package** | `pillow/src/` (library) |
| **HTTP host** | `backend/src/orchestration/pillow-host/` (Brain process) |
| **Approval gate** | `backend/src/orchestration/pillow-approval/` |
| **EKLS** | `backend/src/orchestration/pillow/ekls/` — institutional memory governance |

**Rule:** Pillow is sole technical owner per Pillow Constitution §17. Brain is **not** a peer.

---

## 4. Pillow Responsibilities

### 4.1 Continuous stewardship (owns)

| Duty | Mechanism |
|------|-----------|
| Continuous technical stewardship | Subsystem registry · Orchestrator · Infrastructure Commander |
| Vision synchronization | Vision Sync Policy · Bootstrap · Context Builder |
| Constitutional synchronization | Bootstrap catalog · Doctrine reads · drift detection |
| Roadmap synchronization | Journey First · Mission Planner · `JOURNEY.md` |
| Repository synchronization | Bootstrap · Synchronizer · Watcher |
| Production synchronization | Infrastructure Commander · Production Truth reads |
| Architectural integrity | Due Diligence · Intelligence · Architecture Law comparison |
| Engineering integrity | Technical Chief · Supervisor · Recovery Manager |
| Runtime observation | Watcher · Orchestrator · health probes |
| Continuous improvement | Improvement Engine · Continuous Evolution · BL-C alignment |
| Recommendation generation | Due Diligence · Executive Perspectives · Mission Planner |
| Constitutional drift detection | Intelligence health · Doctrine tools · Framework reads |
| Architectural drift detection | Architecture Law §8 chain · Guardian architecture-validator |
| Engineering drift detection | Supervisor · Audit Reviewer · validation pipeline |
| Production drift detection | Infrastructure Commander · STATUS · deploy manifests |

### 4.2 Explicit boundaries (does NOT)

| Forbidden | Owner instead |
|-----------|---------------|
| Execute runtime dispatch | **Brain** (`POST /brain/dispatch`) |
| Replace Brain orchestration | Brain mandatory path |
| Replace Builder | **Cursor** under Supervisor |
| Replace Cockpit | **empireai-web** · **frontend/** |
| Replace Grand King | Tier 0 sovereignty |
| Replace Constitution | CTD · domain law bodies |
| Modify production without approval | Approval Gate · Grand King |
| Own business decisions | Grand King · Commerce governance |

---

## 5. Mandatory Synchronization Model

Every future mission **begins** with this chain (extends Vision Sync Policy with Architecture · Repository · Production):

```
Vision
        ↓
Soul
        ↓
Constitution (CTD · Hierarchy · applicable law)
        ↓
Roadmap (Lock · domain roadmap · Journey)
        ↓
Hierarchy (Constitution Hierarchy · platform Hierarchy)
        ↓
Architecture (Canonical · Brain · Pillow · subsystem law)
        ↓
Repository (Structure · Master Index · git truth)
        ↓
Production (Production Truth · STATUS · deploy)
        ↓
Mission Context
        ↓
Mission Generation
```

**Implementation anchors:**

| Step | Primary document / subsystem |
|------|------------------------------|
| Vision | `EMPIREAI_VISION.md` · [`EMPIREAI_VISION_SYNCHRONIZATION_SYSTEM.md`](../governance/EMPIREAI_VISION_SYNCHRONIZATION_SYSTEM.md) (P4-02) · [`EMPIREAI_CONTEXT_SYNCHRONIZATION_SYSTEM.md`](../governance/EMPIREAI_CONTEXT_SYNCHRONIZATION_SYSTEM.md) (P4-03) · [`EMPIREAI_CURSOR_PROTOCOL.md`](../governance/EMPIREAI_CURSOR_PROTOCOL.md) (P4-04) · [`EMPIREAI_RECOVERY_DOCTRINE_SYSTEM.md`](../governance/EMPIREAI_RECOVERY_DOCTRINE_SYSTEM.md) (P4-05) |
| Soul | `EMPIREAI_SOUL.md` |
| Constitution | CTD · Framework · Engineering Constitution · Doctrine System |
| Roadmap | Constitution Lock · `JOURNEY.md` · domain roadmaps |
| Hierarchy | Constitution Hierarchy · `EMPIREAI_HIERARCHY.md` |
| Architecture | Architecture Law · Canonical Architecture · P3-01/02 docs |
| Repository | Repository Structure · Bootstrap · Intelligence |
| Production | Production Truth · Infrastructure Commander |
| Mission Context | Context Builder · Memory · Planner |
| Mission Generation | Mission Planner · Mission Generation Policy |

**Rule:** No implementation work until synchronization completes. Pillow Bootstrap enforces this at session start.

---

## 6. System Architecture

### 6.1 Layer diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│ GRAND KING — Cockpit (GC-03 Attention · GC-05 Interaction)               │
│  Pillow Chat UI · Executive Companion · Approval actions                 │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────────┐
│ PILLOW STEWARDSHIP PLANE (pillow/src/)                                   │
│  Bootstrap → Intelligence → Context → Memory → Planner → Supervisor        │
│  Due Diligence · Improvement · Watcher · Command · Objective             │
│  Executive Perspectives · Learning · Technical Chief · Cursor Bridge       │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ Approval Gate (Grand King)
┌───────────────────────────────▼─────────────────────────────────────────┐
│ BRAIN HTTP HOST (backend/)                                               │
│  pillow-host routes · pillow-approval · brain-llm-adapter                │
│  /brain/dispatch (Cockpit modules) · Guardian                            │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
   OpenAI Layer            EKLS Gateway           Builder Handoff
   (Context payloads)      (institutional memory)  (Cursor Bridge → SDK)
```

### 6.2 Presentation separation (ADR-047)

| Layer | Component | Role |
|-------|-----------|------|
| **Intelligence** | Pillow | Reasoning · synthesis · recommendations · constitutional discipline |
| **Interaction** | GC-05 Global AI Assistant | Conversational surface |
| **Attention** | GC-03 Notifications | Priorities · alerts |

Intelligence never lives inside Cockpit components.

---

## 7. Pillow Subsystems

Reconstructed from `pillow/src/orchestrator/subsystem-registry.ts` · `PILLOW_ARCHITECTURE_CONTRACT.md` Part 3.

### 7.1 Core runtime chain (PILLOW-002 → PILLOW-015)

| ID | Subsystem | Path | Mission | Role |
|----|-----------|------|---------|------|
| bootstrap | Repository Bootstrap | `bootstrap/` | PILLOW-002 | Session init · mandatory reads · readiness gate |
| intelligence | Repository Intelligence | `intelligence/` | PILLOW-003 | Classify · graph · health · query |
| context_builder | Context Builder | `context/` | PILLOW-004 | Minimum knowledge per LLM request |
| memory | Repository Memory | `memory/` | PILLOW-005 | Long-term operational memory |
| mission_planner | Mission Planner | `planner/` | PILLOW-006 | Strategic planning · Cursor-ready missions |
| cursor_supervisor | Cursor Supervisor | `supervisor/` | PILLOW-007 | Launch · monitor · stall recovery |
| recovery_manager | Recovery Manager | `recovery/` | PILLOW-008 | Engineering recovery per Recovery Doctrine |
| executive_audit_reviewer | Executive Audit Reviewer | `audit-reviewer/` | PILLOW-009 | Quality gate before acceptance |
| repository_synchronizer | Repository Synchronizer | `synchronizer/` | PILLOW-010 | Gated canonical artifact sync |
| due_diligence | Continuous Due Diligence | `due-diligence/` | PILLOW-011 | Self-initiated analysis · recommendations |
| autonomous_improvement | Autonomous Improvement | `improvement/` | PILLOW-012 | Observations → proposals → mission readiness |
| live_repository_watcher | Live Repository Watcher | `watcher/` | PILLOW-014 | Change detection · drift events |
| grand_king_command_interface | Grand King Command | `command/` | PILLOW-015 | NL intent → execution plan |
| objective_engine | Objective Orchestrator | `objective/` | PILLOW-019 | One Objective · autonomous runtime alignment |

### 7.2 Coordination & intelligence extensions

| Subsystem | Path | Role |
|-----------|------|------|
| **EmpireAI Orchestrator** | `orchestrator/` | PILLOW-013 — subsystem discovery · worker registry · workflow coordination |
| **OpenAI Integration** | `openai/` | Mode policy · Brain LLM adapter · operating modes |
| **Executive Perspectives** | `executive-perspectives/` | Internal multi-perspective reasoning · synthesis |
| **Executive Learning** | `learning/` | Conversation → organizational knowledge candidates |
| **Technical Chief** | `technical-chief/` | Engineering diagnosis · Cursor output review |
| **UX Designer** | `ux-designer/` | Cockpit UX intent · engineering specs |
| **Cursor Bridge** | `cursor-bridge/` | Builder handoff · SDK dispatch · validation pipeline |
| **Infrastructure Commander** | `infrastructure-commander/` | Railway · Vercel · GitHub · health · recovery |
| **Commerce Intelligence** | `commerce-intelligence/` | Product · supplier · market executive analysis |
| **Empire Commander** | `empire-commander/` | Cross-domain synthesis · strategic planning |
| **Empire Operating System** | `empire-operating-system/` | Company portfolio · governance guardian |
| **Continuous Evolution** | `continuous-evolution/` | Opportunity · risk · V1 certification tracking |
| **Master Audit** | `master-audit/` | Pillow subsystem health assessment |

### 7.3 Brain-hosted Pillow services

| Service | Path | Interface |
|---------|------|-----------|
| **Pillow Host** | `backend/src/orchestration/pillow-host/` | `/api/pillow/session` · `/api/pillow/chat` (SSE) |
| **Pillow Approval** | `backend/src/orchestration/pillow-approval/` | Cursor mission approval queue |
| **EKLS** | `backend/src/orchestration/pillow/ekls/` | Knowledge · learning · memory governance |
| **Brain LLM Adapter** | `backend/src/orchestration/pillow-host/brain-llm-adapter.ts` | Pillow → Brain LLMRouter (no direct provider bypass) |

### 7.4 Deferred managers (capability in Bootstrap until dedicated missions)

| Manager | Canonical artifact | Status |
|---------|-------------------|--------|
| Journey Manager | `JOURNEY.md` · `JOURNEY_AUDIT.md` | Partial via Bootstrap |
| Decision Manager | `EMPIREAI_DECISIONS.md` | Partial via Bootstrap |
| Status Manager | `EMPIREAI_STATUS.md` | Partial via Bootstrap |
| Executive Audit Reader | `COMBINED_EXECUTIVE_AUDIT_*.md` | Partial via Bootstrap catalog |
| Approval Gate (full) | pillow-approval routes | Runtime via Brain host |

---

## 8. Review Subsystems (mission mapping)

| Review type | Pillow subsystem(s) |
|-------------|---------------------|
| **Mission Generation** | Mission Planner · Improvement · Mission Generation Policy |
| **Architecture Review** | Due Diligence · Intelligence · Technical Chief · Architecture Law drift |
| **Repository Review** | Bootstrap · Intelligence · Watcher · Synchronizer |
| **Engineering Review** | Supervisor · Audit Reviewer · Recovery · Cursor Bridge validation |
| **Journey Review** | Bootstrap · Planner · Journey First Doctrine |
| **Knowledge** | EKLS · Memory · Empire Knowledge runtime tools |
| **Memory** | Repository Memory · EKLS · Strategic Memory (Brain foundation) |
| **Context** | Context Builder · catalog · intent detection |
| **Vision Accumulation** | Executive Learning · Vision Accumulation Policy |
| **Production Review** | Infrastructure Commander · Production Truth |
| **Executive Review** | Executive Perspectives · Executive Audit Reviewer · Command Interface |
| **Recommendation Engine** | Due Diligence · Improvement · Continuous Evolution · Perspectives |

---

## 9. External Interfaces

### 9.1 Brain interface

| Direction | Mechanism |
|-----------|-----------|
| Pillow → Brain LLM | `brain-llm-adapter` — sole provider path for Pillow chat |
| Pillow → Brain audit | Shared `AuditLogger` on pillow routes |
| Cockpit → Brain dispatch | Separate path — module actions, not Pillow reasoning |
| Guardian | Brain pre-dispatch — Pillow-owned module |

### 9.2 Cockpit interface

| Surface | Path |
|---------|------|
| Pillow Chat | `frontend/.../PillowChatPage.tsx` · GC-05 |
| Executive Companion | `PillowCompanionContext.tsx` |
| Module data | BFF → `/brain/dispatch` (Brain, not Pillow package) |

### 9.3 Builder interface

```
Mission Planner → Grand King approval → Cursor Bridge → SDK dispatch
                              ↑
                    Cursor Supervisor (progress · ETA · risks · recovery)
```

See [`EMPIREAI_SUPERVISOR_GOVERNANCE.md`](../governance/EMPIREAI_SUPERVISOR_GOVERNANCE.md).

### 9.4 Supervisor relationship

```
Supervisor (observes Builder continuously)
        ↓
Builder (implements approved missions only)
        ↓
Progress · ETA · Risks · Recovery signals
        ↓
Cockpit (visualizes status)
        ↓
Brain (executes when dispatch/tool invoked)
```

| Role | Owns |
|------|------|
| **Pillow** | Supervision **governance** — policies · recovery doctrine · mission format |
| **Supervisor** | Continuous **observation** — heartbeat · stall detection |
| **Cockpit** | **Visualization** |
| **Brain** | **Execution** |

### 9.5 Guardian interface

Guardian runs **inside Brain dispatch path**. Pillow owns Guardian as subsystem; Pillow does not duplicate Guardian checks in Pillow package — drift detection is separate from pre-dispatch safety.

---

## 10. Continuous Duties

| Health domain | Pillow mechanism | Signals |
|---------------|------------------|---------|
| **Repository** | Bootstrap · Watcher · Intelligence health | Missing artifacts · graph breaks |
| **Architecture** | Due Diligence · Architecture Law §8 comparison | Normative vs code drift |
| **Production** | Infrastructure Commander · STATUS sync | Deploy · health · env |
| **Mission** | Supervisor · Planner · Journey | Stall · scope · backlog |
| **Journey** | Bootstrap · Journey First | Position · audit sync |
| **Engineering** | Technical Chief · Audit Reviewer · Recovery | Validation failures |
| **Business** | Commerce Intelligence · Empire Commander | Commercial readiness |
| **Constitution** | Bootstrap doctrine reads · drift reports | Citation · orphan docs |
| **Documentation** | Intelligence classification · ECDS awareness | Misclassification |
| **Knowledge** | EKLS · Memory · Learning pipeline | Stale · unapproved learning |

---

## 11. Lifecycle

### 11.1 Session lifecycle

```
Trigger (login · refresh · recovery)
        ↓
Bootstrap (PILLOW-002) — mandatory artifact load
        ↓
Intelligence (PILLOW-003) — classify · health
        ↓
Readiness gate — all bootstrap criteria (see BL-B companion §3)
        ↓
Context Builder init
        ↓
Pillow Ready — OpenAI · modes · subsystems online
        ↓
Continuous (Watcher · Due Diligence · Supervisor ticks)
        ↓
Session end — ephemeral chat; repository memory persists
```

### 11.2 Mission lifecycle (Pillow role)

```
Synchronization chain (§5)
        ↓
Mission Planner draft
        ↓
Grand King approval (Approval Gate)
        ↓
Supervisor launches Builder
        ↓
Audit Reviewer evaluates output
        ↓
Synchronizer applies gated writes
        ↓
Vision Accumulation (if structural)
```

---

## 12. Governance

| Role | Duty |
|------|------|
| **Grand King** | Approve missions · irreversibles · repository mutations |
| **Pillow** | Continuous stewardship · synchronization · drift detection |
| **Chief Architect** | Maintain this document · Pillow Contract alignment |
| **Builder** | Implement approved scope only |
| **Brain** | Execute approved dispatch/tool paths |

**Amendment:** Architecture Law §10 — ADR for subsystem boundary changes. Pillow Contract Part 7 mission order frozen for V1.

---

## 13. Evolution Rules

| Rule | Requirement |
|------|-------------|
| **E1** | New Pillow subsystem → register in `subsystem-registry.ts` + Contract Part 3 row |
| **E2** | New HTTP surface → Brain host only; no duplicate Pillow servers |
| **E3** | Layer 2 Executive Intelligence → Pillow EI Constitution + EI library |
| **E4** | Repository writes → Approval Gate always |
| **E5** | No competing Pillow architecture doc — amend **this file** |

---

## 14. Examples

### Example 1 — Mission start (constitutional)

P3-02 mission begins: Vision read → Soul check → CTD bounds → Roadmap slot P3-02 → Hierarchy placement → Architecture Law → Repository scan → Production STATUS → then implementation.

### Example 2 — Bootstrap refusal

Bootstrap missing `JOURNEY.md` → readiness gate fails → Pillow reports **not Ready** — Grand King sees explicit failure report, not silent partial context.

### Example 3 — Supervisor stall

Cursor mission stalls → Supervisor detects heartbeat gap → Recovery Manager inspects git → Executive report to Cockpit → Grand King decides retry or abort. **Pillow does not auto-merge.**

### Example 4 — Wrong pattern

Pillow package calls OpenAI API without Context Builder → violates Memory Doctrine cost/quality rules.

---

## 15. Validation Checklist (P3-02)

| Check | Status |
|-------|--------|
| Aligns with Vision · Soul · CTD · Hierarchy | §2 · §5 |
| Aligns with Engineering Constitution · Architecture · Documentation Law | §2 · §4 |
| Aligns with Brain Architecture (P3-01) | §9.1 · no peer conflict |
| Aligns with Canonical Architecture §3.4 · Pillow Constitution §17 | §3 |
| No duplicated Pillow authority | §3 · single canonical doc |
| Subsystems validated against registry | §7 |
| Interfaces validated | §9 |
| Synchronization validated | §5 |
| Cross-references completed | §16 Related |

---

## 16. Ratification

| Field | Value |
|-------|-------|
| **Mission** | P3-02 — Pillow Architecture |
| **Ratification date** | 2026-07-05 |
| **Next architecture mission** | Phase P3 complete — P4-01 Engineering Standards |

---

## Revision History

| Version | Date | Authority | Change |
|---------|------|-----------|--------|
| 1.0.0 | 2026-07-05 | Grand King · P3-02 | Canonical Pillow Architecture — stewardship · sync · subsystems |

---

## Related

- [`EMPIREAI_PILLOW_CONSTITUTION.md`](../../EMPIREAI_PILLOW_CONSTITUTION.md) · [`PILLOW_ARCHITECTURE_CONTRACT.md`](../../PILLOW_ARCHITECTURE_CONTRACT.md)  
- [`EMPIREAI_PILLOW_ARCHITECTURE.md`](../../EMPIREAI_PILLOW_ARCHITECTURE.md) (BL-B bootstrap · modes)  
- [`EMPIREAI_BRAIN_ARCHITECTURE.md`](./EMPIREAI_BRAIN_ARCHITECTURE.md) · [`EMPIREAI_BUILDER_ARCHITECTURE.md`](./EMPIREAI_BUILDER_ARCHITECTURE.md) · [`EMPIREAI_COMMERCE_ARCHITECTURE.md`](./EMPIREAI_COMMERCE_ARCHITECTURE.md) · [`EMPIREAI_INFRASTRUCTURE_ARCHITECTURE.md`](./EMPIREAI_INFRASTRUCTURE_ARCHITECTURE.md) · [`EMPIREAI_CANONICAL_ARCHITECTURE.md`](./EMPIREAI_CANONICAL_ARCHITECTURE.md)  
- [`EMPIREAI_VISION_SYNCHRONIZATION_POLICY.md`](../governance/EMPIREAI_VISION_SYNCHRONIZATION_POLICY.md) · [`EMPIREAI_VISION_SYNCHRONIZATION_SYSTEM.md`](../governance/EMPIREAI_VISION_SYNCHRONIZATION_SYSTEM.md) (PILLOW-VS-001) · [`EMPIREAI_SUPERVISOR_GOVERNANCE.md`](../governance/EMPIREAI_SUPERVISOR_GOVERNANCE.md)  
- [`CANONICAL_EKLS_SPECIFICATION.md`](../../CANONICAL_EKLS_SPECIFICATION.md) · [`pillow/src/`](../../pillow/src/)
