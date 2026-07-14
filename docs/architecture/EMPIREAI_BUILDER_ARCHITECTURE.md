# EMPIREAI BUILDER ARCHITECTURE

> **Classification:** CANONICAL — Tier 5 Normative Architecture (Builder)  
> **Document ID:** P3-04  
> **Constitutional phase:** P3 — Architecture Foundation  
> **Dependencies:** P1 complete · P2 complete · P3-01 → P3-03 · Engineering Constitution · Architecture Law  
> **Owner:** Grand King (mission scope) · Pillow (supervision governance)  
> **Authority:** CANONICAL — single permanent Builder architecture; **subordinate to CTD · Engineering Constitution · Pillow Constitution**  
> **Parent:** [`EMPIREAI_ARCHITECTURE_LAW.md`](./EMPIREAI_ARCHITECTURE_LAW.md) · [`EMPIREAI_CONSTITUTION.md`](../../EMPIREAI_CONSTITUTION.md) §8–§9  
> **Ratified:** 2026-07-05 (P3-04)  
> **Role:** Permanent architecture of the engineering execution engine — reconstructed from repository, not a rewrite

**Engineering law:** [`EMPIREAI_CONSTITUTION.md`](../../EMPIREAI_CONSTITUTION.md) (P2-03 · §8 Cursor · §9 Builder)  
**Supervision:** [`EMPIREAI_SUPERVISOR_GOVERNANCE.md`](../governance/EMPIREAI_SUPERVISOR_GOVERNANCE.md)  
**Engineering standards:** [`EMPIREAI_ENGINEERING_STANDARDS.md`](./EMPIREAI_ENGINEERING_STANDARDS.md) (P4-01) · [`EMPIREAI_CURSOR_OUTPUT_STANDARD.md`](../../EMPIREAI_CURSOR_OUTPUT_STANDARD.md)  
**Recovery:** [`EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md`](../../EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md)  
**Runtime evidence:** [`docs/audits/full-empireai-audit/10_BUILDER_CURSOR_AUDIT.md`](../audits/full-empireai-audit/10_BUILDER_CURSOR_AUDIT.md) (EVIDENCE)

---

## 1. Purpose

**Builder** is the **constitutional engineering execution engine** of EmpireAI — not merely Cursor IDE. Builder **converts approved constitutional intent into validated implementation**. Builder **executes**. Builder **never owns** Vision, Soul, Constitution, Architecture, business decisions, or Production Truth.

| Builder IS | Builder IS NOT |
|------------|----------------|
| Engineering execution channel (Cursor + governed agents) | Vision or Soul author |
| Repository modifier under approval | Constitution or architecture owner |
| Implementation · test · evidence producer | Pillow intelligence |
| Deployment **preparer** (not autonomous deployer) | Brain runtime executor |
| Supervisor-reporting worker | Cockpit or strategy decider |

**Canonical name:** **Builder** (ECNS-2) — implementation channel; **Cursor** is the primary IDE worker; **Cursor Bridge** is the Pillow handoff subsystem.

**The principle:** Pillow governs · Builder implements · Supervisor observes · Brain executes runtime · Cockpit visualizes · Grand King approves.

---

## 2. Constitutional Relationships

```
Grand King (approves scope · irreversibles)
        ↓
Pillow (generates missions · supervises · reviews output)
        ↓
Builder (this document — implements approved missions)
        ↓
Repository (git truth · Journey sync)
        ↓
Brain (runtime changed by Builder — Builder ≠ Brain)
        ↓
Production (validated separately · Production Truth)
```

| System | Relationship |
|--------|--------------|
| **Vision · Soul** | Builder synchronizes at start; never amends |
| **CTD · Engineering Constitution** | Hard bounds — Builder forbidden to override |
| **Pillow** | Generates missions · supervises · reviews · recommends |
| **Supervisor** | Continuous interrogation — Builder reports telemetry |
| **Brain** | Builder modifies Brain code; Brain executes at runtime |
| **Cockpit** | Visualizes queue · progress · ETA — never executes Builder |
| **Guardian** | Validates Brain behaviour post-implementation — not Builder UI |

---

## 3. Ownership & Stewardship

| Field | Definition |
|-------|------------|
| **Mission scope owner** | Grand King |
| **Supervision governance owner** | Pillow COI |
| **Normative architecture maintainer** | Chief Architect |
| **Primary worker** | Cursor IDE (Builder agent in Cursor) |
| **Mission artifacts** | `.cursor/missions/` · `bridge-*.md` queue |
| **Handoff runtime** | `pillow/src/cursor-bridge/` |
| **Supervision runtime** | `pillow/src/supervisor/` |
| **Approval persistence** | `backend/src/orchestration/pillow-approval/` |
| **HTTP surface** | `/api/pillow/cursor/*` · approval routes |

**Rule:** Every repository modification and engineering mission passes through Builder governance (sync → approval → supervision → validation → evidence).

---

## 4. Builder Responsibilities

| Responsibility | Mechanism |
|----------------|-----------|
| Mission execution | Cursor agent · approved Section 2 draft |
| Repository modification | Git working tree · gated writes via Approval |
| Implementation planning | Mission brief · dependency analysis in brief |
| Dependency analysis | Mission Planner · CON deps · module graph |
| Engineering validation | typecheck · tests · Guardian where scoped |
| Test execution | `npm run test` · validation pipelines |
| Documentation updates | In-scope ECDS docs · Journey · audits |
| Production deployment preparation | Deploy scripts · verify — **not** autonomous prod push |
| Acceptance evidence | Executive Audit · PROOF artifacts |
| Lessons learned | Vision Accumulation · BL-C registers |

---

## 5. Builder Does NOT

| Forbidden | Owner instead |
|-----------|---------------|
| Own Vision · Soul · Constitution | Grand King · CTD · Framework |
| Own Architecture normative truth | Chief Architect · Canonical Architecture |
| Own business decisions | Grand King · Commerce governance |
| Own Production Truth | Production Truth doctrine · STATUS |
| Replace Pillow | Pillow stewardship |
| Replace Brain execution | Brain Orchestrator |
| Replace Cockpit | empireai-web visualization |
| Expand scope without GK approval | Mission brief boundary |
| Deploy production without authorization | GVD · deployment gates |

---

## 6. Execution Pipeline (Mandatory)

Every Builder mission **shall** execute through:

```
Vision Synchronization
        ↓
Vision
        ↓
Soul
        ↓
Constitution (CTD · Hierarchy · Engineering Constitution)
        ↓
Roadmap (Lock · Journey · REAL/CON slot)
        ↓
Hierarchy (Constitution + platform placement)
        ↓
Architecture (Law · Brain · Pillow · Cockpit · subsystem)
        ↓
Repository (Structure · owners · classification)
        ↓
Production Truth (if production-facing)
        ↓
Mission Context (brief · Section 1 + Section 2)
        ↓
Dependency Analysis
        ↓
Architecture Review (scope vs normative · ADR if structural)
        ↓
Risk Review (Guardian · production · constitutional drift)
        ↓
Implementation (Section 2 — Cursor Draft only)
        ↓
Repository Validation (tests · typecheck · lint)
        ↓
Production Validation (if scoped · verify scripts)
        ↓
Grand King Validation (Executive Summary · irreversibles)
        ↓
Lessons Learned (mission report · blockers)
        ↓
Vision Accumulation (if structural · identity touch)
```

**Anchors:** [`EMPIREAI_VISION_SYNCHRONIZATION_SYSTEM.md`](../governance/EMPIREAI_VISION_SYNCHRONIZATION_SYSTEM.md) (P4-02) · [`EMPIREAI_CONTEXT_SYNCHRONIZATION_SYSTEM.md`](../governance/EMPIREAI_CONTEXT_SYNCHRONIZATION_SYSTEM.md) (P4-03) · [`EMPIREAI_CURSOR_PROTOCOL.md`](../governance/EMPIREAI_CURSOR_PROTOCOL.md) (P4-04) · [`EMPIREAI_RECOVERY_DOCTRINE_SYSTEM.md`](../governance/EMPIREAI_RECOVERY_DOCTRINE_SYSTEM.md) (P4-05) · [`EMPIREAI_BROWSER_TRUTH_SYSTEM.md`](../governance/EMPIREAI_BROWSER_TRUTH_SYSTEM.md) (P4-06) · Engineering Constitution §4.1 · §8–§9 · Pillow §5 synchronization (extended).

---

## 7. Mission Lifecycle

### 7.1 End-to-end flow

```
Pillow Mission Planner
        ↓
Cursor-ready mission document (Section 1 + Section 2)
        ↓
Grand King approval (Approval Gate)
        ↓
Cursor Bridge assemble → dispatch
        ↓
Supervisor.launchMission()
        ↓
Builder (Cursor) implements Section 2
        ↓
Supervisor heartbeats · progress · stall detection
        ↓
Validation pipeline (Technical Chief · Audit Reviewer)
        ↓
Executive Audit evidence
        ↓
Repository Synchronizer (gated) · Journey update
        ↓
Mission complete · Vision Accumulation
```

### 7.2 Mission artifact structure

| Section | Audience | Authority at handoff |
|---------|----------|---------------------|
| **Section 1 — Executive Summary** | Grand King verification | Traceability only |
| **Section 2 — Cursor Draft** | Builder (Cursor) | **Primary implementation authority** |

→ [`EMPIREAI_CURSOR_OUTPUT_STANDARD.md`](../../EMPIREAI_CURSOR_OUTPUT_STANDARD.md) · `.cursor/missions/README.md`

---

## 8. Mission States

### 8.1 Normative states (P3-04)

| State | Meaning |
|-------|---------|
| **Queued** | Approved · awaiting launch |
| **Preparing** | Bridge assembling mission · supervisor registering |
| **Synchronizing** | Vision/Soul/Constitution chain in progress |
| **Analysing** | Dependency · architecture · risk review |
| **Implementing** | Active code/doc changes |
| **Testing** | typecheck · unit/integration tests |
| **Validating** | Audit reviewer · acceptance criteria |
| **Deploying** | Deploy prep · verify (not silent prod) |
| **Awaiting Grand King** | Executive Summary sign-off |
| **Completed** | Audit passed · evidence filed |
| **Blocked** | Stall · deadlock · needs decision |
| **Recovering** | Recovery Doctrine active |
| **Cancelled** | GK or Pillow abort |

### 8.2 Runtime mapping (Supervisor — PILLOW-007)

Current `CursorMissionState` in `pillow/src/supervisor/types.ts`:

| Supervisor state | Maps to normative |
|------------------|-------------------|
| `queued` | Queued |
| `preparing` | Preparing |
| `repository_inspection` | Synchronizing · Analysing |
| `implementation` | Implementing |
| `validation` | Testing · Validating |
| `executive_audit` | Validating · Awaiting Grand King |
| `recovery` | Recovering |
| `completed` | Completed |
| `failed` | Blocked |
| `cancelled` | Cancelled |

**Future:** Explicit `deploying` · `awaiting_grand_king` states may extend Supervisor registry without breaking normative model.

---

## 9. Mission Telemetry

Builder **shall** continuously expose (via Supervisor → Cockpit):

| Field | Source |
|-------|--------|
| Current Mission | `SupervisedMission.document.title` |
| Current Roadmap Item | Mission brief CON/REAL/P slot |
| Current Step | `CursorMissionState` + progress events |
| Progress % | Supervisor health score · progress events |
| Estimated Remaining Time | Supervisor ETA heuristics (future explicit) |
| Elapsed Time | `launchedAt` → now |
| Dependencies | Mission Planner dependency list |
| Current Risks | `MissionHealth.riskLevel` · stall signals |
| Repository Changes | Progress events · git diff summary |
| Files Modified | Heartbeat `file_modified` events |
| Tests | Validation pipeline results |
| Production Status | Infrastructure readiness assessors |
| Acceptance Status | Audit Reviewer decision |

**Rule:** Supervisor never guesses · Builder never hides execution state.

→ Cockpit Mission Centre · Development Approvals · Supervisor tab (P3-03)

---

## 10. System Architecture

### 10.1 Component diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│ GRAND KING — approves Section 1 · irreversibles                          │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────────┐
│ PILLOW — Mission Planner · Approval Gate                                 │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
 Cursor Bridge            Cursor Supervisor        Audit Reviewer
 (assemble · dispatch)    (heartbeat · stall)      (acceptance gate)
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ BUILDER — Cursor IDE · governed agent                                    │
│  Reads Section 2 · modifies repository · runs validation               │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ REPOSITORY + EVIDENCE                                                    │
│  git · Journey · COMBINED_EXECUTIVE_AUDIT_* · tests                      │
└─────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Runtime locations

| Component | Path |
|-----------|------|
| **Cursor Bridge engine** | `pillow/src/cursor-bridge/` |
| **SDK dispatcher** | `pillow/src/cursor-bridge/sdk-dispatcher.ts` |
| **Mission assembler** | `pillow/src/cursor-bridge/mission-assembler.ts` |
| **Validation pipeline** | `pillow/src/cursor-bridge/validation-pipeline.ts` |
| **Cursor Supervisor** | `pillow/src/supervisor/` |
| **Recovery Manager** | `pillow/src/recovery/` (invoked by Supervisor) |
| **Audit Reviewer** | `pillow/src/audit-reviewer/` |
| **Approval Gate (HTTP)** | `backend/src/orchestration/pillow-approval/` |
| **CursorBridgeAdapter** | `pillow-approval/cursor-bridge-adapter.ts` |
| **Mission queue (artifacts)** | `.cursor/missions/pending/` |
| **Technical Chief review** | `pillow/src/technical-chief/` |

### 10.3 Dispatch modes

| Mode | Behaviour |
|------|-----------|
| `artifact` | Write mission file to `.cursor/missions/pending/` |
| `dry_run` | Queue without live Cursor launch (production default) |
| `sdk` | Programmatic dispatch when SDK available |

Production: `dryRunLaunch: true` unless V1 operational credentials + policy allow live launch.

---

## 11. External Interfaces

### 11.1 Pillow relationship

| Direction | Mechanism |
|-----------|-----------|
| Pillow → Builder | Approved mission document via Cursor Bridge |
| Builder → Pillow | Progress · validation · audit text |
| Pillow → Builder | Recovery instructions · scope corrections |
| Pillow reviews | Audit Reviewer · Technical Chief · Executive Audit Standard |

Builder **remains subordinate** to Pillow governance.

### 11.2 Supervisor relationship

Supervisor **continuously interrogates** Builder at checkpoints (mission start · mid-mission · pre-commit · blockage):

| Report | Content |
|--------|---------|
| Current Mission | Active supervised mission ID |
| Current Step | State + last progress event |
| Progress | Heartbeats · file events |
| ETA | Estimate to proof |
| Risks | Stall signals · scope creep |
| Recovery | Recovery Manager plan |
| Dependencies | Blockers from brief |
| Next Action | Recovery or continue |

### 11.3 Brain relationship

| Rule | Detail |
|------|--------|
| Brain executes runtime | `POST /brain/dispatch` |
| Builder changes Brain | Edits `backend/src/` under mission scope |
| Builder ≠ Brain | No bypass of Orchestrator for platform actions |
| Post-change validation | Guardian tests · brain validation suite |

**Distinction:** `store-builder` agent in Brain is a **commerce automation agent** — not the Builder engineering channel. ECNS-2 uses **Builder** for Cursor only.

### 11.4 Cockpit relationship

Cockpit **visualizes** (P3-03):

| Surface | Builder data |
|---------|--------------|
| Mission Centre | Queue · blockers · OMS missions |
| Development → Approvals | Pending approval rows |
| Development → Supervisor | Supervisor engine panel |
| Executive Home | Approval routing · next action |

Cockpit **never executes** Builder.

---

## 12. Governance & Validation

### 12.1 Governing documents

| Document | Role |
|----------|------|
| Engineering Constitution §8 | Cursor mission format |
| Engineering Constitution §9 | Builder 8-step governance |
| Cursor Output Standard | Section 1/2 structure |
| Cursor Recovery Doctrine | Stall recovery |
| Continuous Artifact Generation Workflow | Artifacts over chat |
| Mission Generation Policy | Brief authoring |
| Executive Audit Standard | Acceptance evidence |
| Development Doctrine | REAL mission rules |
| BL-C Constitution | Post-build improvement |

### 12.2 Validation gates

| Gate | When |
|------|------|
| Vision sync | Before implementation |
| Scope check | Supervisor at launch |
| typecheck | During Testing |
| Unit/integration tests | During Testing |
| Guardian (if Brain touched) | Repository Validation |
| Audit Reviewer | Before Completed |
| Grand King | Irreversibles · Executive Summary |
| Journey sync | After structural missions |

### 12.3 Recovery

When **Blocked** or **Recovering**:

1. Apply [`EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md`](../../EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md)  
2. Recovery Manager inspects git · diagnoses stall  
3. Supervisor coordinates · reports to Cockpit  
4. One fresh validation cycle after recovery  
5. Grand King informed if decision required  

---

## 13. Evolution Rules

| Rule | Requirement |
|------|-------------|
| **E1** | New Builder capability → extend Cursor Bridge + Supervisor registry |
| **E2** | New mission state → map to normative §8.1 + ADR |
| **E3** | No competing Builder architecture — amend **this file** |
| **E4** | SDK dispatch modes → document in Bridge + production policy |
| **E5** | Store Builder agent renamed in UI only — never conflate with Builder channel |

---

## 14. Examples

### Example 1 — Constitutional mission (P3-04)

Grand King approves P3-04 brief → Cursor Bridge writes artifact → Supervisor launches → Builder implements `docs/architecture/EMPIREAI_BUILDER_ARCHITECTURE.md` → tests pass → Audit Reviewer approves → Journey row updated.

### Example 2 — Production-facing REAL mission

Brief cites Production Truth → Builder runs verify scripts → does **not** deploy without GK · GVD gates → evidence in COMBINED_EXECUTIVE_AUDIT.

### Example 3 — Stall recovery

Builder waits on hung npm → Supervisor detects `waiting_npm` stall → Recovery Manager applies doctrine → Cockpit shows Recovering → fresh validation cycle.

### Example 4 — Violation

Builder amends CTD body without CONSTITUTIONAL REVIEW → forbidden · Guardian/engineering law violation.

---

## 15. Validation Checklist (P3-04)

| Check | Status |
|-------|--------|
| Aligns with Vision · Soul · CTD · Hierarchy | §2 · §6 |
| Aligns with Engineering Constitution · Architecture · Documentation Law | §12 |
| Aligns with Brain · Pillow · Cockpit Architecture | §11 |
| No duplicated Builder authority | §3 · single canonical doc |
| Execution pipeline validated | §6 |
| Mission lifecycle validated | §7 |
| Telemetry validated | §9 |
| Interfaces validated | §11 |
| Cross-references completed | §16 |

---

## 16. Ratification

| Field | Value |
|-------|-------|
| **Mission** | P3-04 — Builder Architecture |
| **Ratification date** | 2026-07-05 |
| **Next architecture mission** | Phase P3 complete — P4-01 Engineering Standards |

---

## Revision History

| Version | Date | Authority | Change |
|---------|------|-----------|--------|
| 1.0.0 | 2026-07-05 | Grand King · P3-04 | Canonical Builder Architecture — engineering execution engine |

---

## Related

- [`EMPIREAI_PILLOW_ARCHITECTURE.md`](./EMPIREAI_PILLOW_ARCHITECTURE.md) · [`EMPIREAI_BRAIN_ARCHITECTURE.md`](./EMPIREAI_BRAIN_ARCHITECTURE.md) · [`EMPIREAI_COCKPIT_ARCHITECTURE.md`](./EMPIREAI_COCKPIT_ARCHITECTURE.md) · [`EMPIREAI_COMMERCE_ARCHITECTURE.md`](./EMPIREAI_COMMERCE_ARCHITECTURE.md) · [`EMPIREAI_INFRASTRUCTURE_ARCHITECTURE.md`](./EMPIREAI_INFRASTRUCTURE_ARCHITECTURE.md)  
- [`EMPIREAI_SUPERVISOR_GOVERNANCE.md`](../governance/EMPIREAI_SUPERVISOR_GOVERNANCE.md) · [`EMPIREAI_MISSION_GENERATION_POLICY.md`](../governance/EMPIREAI_MISSION_GENERATION_POLICY.md)  
- [`pillow/src/cursor-bridge/`](../../pillow/src/cursor-bridge/) · [`pillow/src/supervisor/`](../../pillow/src/supervisor/) · [`.cursor/missions/README.md`](../../.cursor/missions/README.md)
