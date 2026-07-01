# EMPIREAI DECISIONS

> Living memory document — architectural decision record

## ADR-001: Brain as single orchestration point

**Status:** Accepted  
**Decision:** All platform actions flow through the Brain Orchestrator.  
**Rationale:** Security, auditability, Guardian enforcement, consistent agent routing.  
**Consequences:** Frontend uses BFF proxy only; no direct provider calls.

## ADR-002: SQLite for Phase 1–3 persistence

**Status:** Accepted (with scale exit path)  
**Decision:** Use SQLite with WAL mode for domain, audit, ledger.  
**Rationale:** Zero-ops local dev, single-file backup, sufficient for early stage.  
**Consequences:** Must migrate to PostgreSQL before multi-tenant scale.  
**Backup provider:** PostgreSQL with row-level tenant isolation (TBD).

## ADR-003: Redis for async infrastructure

**Status:** Accepted  
**Decision:** BullMQ task queue, sessions, and event bus require Redis.  
**Rationale:** Industry-standard async patterns; integration tests degrade gracefully without Redis.

## ADR-004: Guardian pre-dispatch assessment

**Status:** Accepted  
**Decision:** Guardian runs before every orchestrator dispatch when `GUARDIAN_ENABLED=true`.  
**Rationale:** Fail-safe doctrine; blocks destructive payloads and integrity failures.

## ADR-005: Connector stub pattern

**Status:** Accepted (Phase 3)  
**Decision:** Catalog all connectors with stub implementations implementing `EmpireConnector`.  
**Rationale:** Provider-agnostic architecture before OAuth credentials exist.  
**Deferred:** Live OAuth for Shopify, Stripe, Meta.

## ADR-006: Append-only financial ledger

**Status:** Accepted  
**Decision:** All financial state from `financial_ledger_events`; no balance columns updated in place.  
**Rationale:** Full reconstructability; audit trail; treasury derivation.

## ADR-007: 10% EmpireAI royalty

**Status:** Accepted (framework constant)  
**Decision:** Royalty calculated as 10% of net profit in treasury engine.  
**Rationale:** Business model placeholder; configurable later.  
**Note:** Requires human approval before production billing enforcement.

## ADR-008: Retention preservation on cancellation

**Status:** Accepted  
**Decision:** Cancellation → `preserved` status; data retained.  
**Rationale:** Constitution Article VI; exit survey + AI retention recommendations.

## ADR-009: PIE explainability requirement

**Status:** Accepted  
**Decision:** Every product score includes dimension rationales and `why[]` array.  
**Rationale:** Founders must understand recommendations, not trust black boxes.

## ADR-010: Next.js BFF over direct Brain calls from browser

**Status:** Accepted  
**Decision:** Browser calls `/api/*`; server proxies to Brain with cookies.  
**Rationale:** Session security; hides Brain URL; CORS simplification.

---

## ADR-011: Commerce Canon (C001)

**Status:** Accepted  
**Decision:** `EMPIREAI_COMMERCE_CANON.md` is the single source of truth for commerce lifecycle, states, connector contract, and journeys.  
**Rationale:** Architectural maturity requires one orchestration standard before live marketplace integrations.  
**Consequences:** All new commerce work must map to canon phases; no parallel workflows; connectors extend existing modules.

---

## ADR-012: Marketplace Operating System (MOS-001) — Strategic Pivot

**Status:** Superseded by ADR-013  
**Date:** 2026-06-21  
**Decision:** Cancel R001–R010 as the active implementation roadmap. Establish Marketplace OS as interim strategic direction.  
**Note:** MOS superseded by COS-001 (ADR-013). Document preserved in `MARKETPLACE_OS_VISION.md`.

---

## ADR-013: Commerce Operating System Kernel (COS-001)

**Status:** Accepted  
**Date:** 2026-06-21  
**Decision:** EmpireAI is a **Commerce Operating System**, not a Marketplace OS or e-commerce platform. `COMMERCE_OS_BLUEPRINT.md` is the permanent kernel architecture beneath Soul File and Commerce Canon. All future connectors inherit fourteen domain kernels, universal object model, universal event bus, and Connector SDK specification.  
**Rationale:** Marketplace-only framing is insufficient — COS covers suppliers, payments, ads, logistics, CS, analytics, and automation as equal kernels. Architecture-first blueprint enables unlimited providers without redesign.  
**Consequences:**
- MOS-001 vision superseded; preserved not deleted.
- No live execution in COS-001 — blueprint only.
- Connectors implement SDK; Connector Kernel extends `reality-integration` (no duplication).
- Certification framework required before LIVE.
- Future missions: COS-002 (SDK implementation), COS-003+ (reference adapters).

---

## ADR-014: Journey as canonical living roadmap (BL-A)

**Status:** Accepted  
**Date:** 2026-06-28  
**Decision:** `JOURNEY.md` is the canonical roadmap and a permanent living artifact; `JOURNEY_AUDIT.md` is its change log. Before any future Pillow/Grand King mission, determine "does this change Journey?" — if yes, audit the repo, update Journey + Journey Audit, record differences, then continue. Journey must never fall behind repository reality.  
**Rationale:** Repository continuity, not chat history, is EmpireAI's permanent memory.  
**Consequences:** Rows are never silently removed/renamed/deleted; every structural change appears in `JOURNEY_AUDIT.md`; every Backlog Release ends by refreshing Journey. **BL-A is the canonical synchronization standard for all future Backlog Releases.**

## ADR-015: Milestone naming MS-A / MS-B (BL-A)

**Status:** Accepted  
**Date:** 2026-06-28  
**Decision:** Two profit milestones are canonized:  
- **MS-A** — First USD 100,000 cumulative net profit using **only the Grand King account**.  
- **MS-B** — First USD 1,000,000 cumulative net profit using **only the Grand King account**.  
Public rollout may only begin **after MS-B**.  
**Rationale:** Clear, account-scoped commercial milestones aligned to the SUCCESS-001 mission.  
**Consequences:** "SUCCESS-001" is retired **as a milestone name** (superseded by MS-A) but remains valid as the system/mission/module name (REAL-035, CTD-002). No runtime renames.

## ADR-016: Grand King sole-operation doctrine (BL-A)

**Status:** Accepted  
**Date:** 2026-06-28  
**Decision:** Grand King remains the **only operational account until MS-B**. Founder/customer (multi-tenant) operation is a **future capability only**.  
**Rationale:** Focus all operation and risk on a single proven account until USD 1M cumulative net profit is reached.  
**Consequences:** Aligns with GVD-001 (Grand King Platform Owner), GVD-002 (Founder is Customer), UID-001/002. No founder-operation features are activated pre-MS-B.

## ADR-017: Approved naming + retirements (BL-A)

**Status:** Accepted  
**Date:** 2026-06-28  
**Decision:** Approved canonical names: **Pillow** (strategic AI advisor / mission-authoring intelligence), **MS-A**, **MS-B**, **Grand King**. Retire documentation references to **Option C**, **Option C+**, **Option D**, and **SUCCESS-001 as a milestone name**.  
**Rationale:** Single, unambiguous vocabulary across continuity artifacts.  
**Consequences:** Historical references may remain only where required to preserve history. (Audit note: strategic "Option C/C+/D" have no active doc references; the only "Option C" in `backend/README.md` is an unrelated Redis-setup option and is left untouched.)

## ADR-018: Cost governance — CFO / CTO responsibilities (BL-A)

**Status:** Accepted  
**Date:** 2026-06-28  
**Decision:** Permanent governance responsibilities:  
- **CFO** monitors OpenAI API cost, Cursor cost, infrastructure cost, variable AI cost, and monthly operating cost; protects Grand King's operating budget.  
- **CTO** continuously recommends engineering optimizations before operating costs exceed the approved budget.  
**Rationale:** Protect Grand King's operating budget as a permanent obligation.  
**Consequences:** Governance-only; no runtime cost-engine changes are mandated by this ADR.

## ADR-019: Repository reality overrides planning (BL-A)

**Status:** Accepted  
**Date:** 2026-06-28  
**Decision:** Repository reality overrides planning. Journey reflects implemented reality; blueprints remain historical design references; simulation reports may update repository understanding of readiness. Repository continuity artifacts are EmpireAI's permanent memory; conversation history is temporary.  
**Rationale:** Prevents drift between aspirational design and shipped reality.  
**Consequences:** Continuity artifacts (Journey, Audit, Decision Register, Soul, Project State) are the authority; chat is not.

## ADR-020: Backlog routing model (BL-A replacement, ROUTE 11)

**Status:** Accepted  
**Date:** 2026-06-28  
**Decision:** Every Backlog Release synchronizes **repository owners, not generic ideas**. Each BL item must follow: **Source Discussion → Owner → Repository Action → Validation**. For every approved decision, Cursor must (1) identify the existing owner, (2) identify the exact file, (3) update the owner, (4) validate, (5) record the synchronization. If no suitable owner exists, **do not invent one** — record the missing ownership in the validation/synchronization report.  
**Per-release sequence:** Audit Repository → Refresh `JOURNEY.md` → Refresh `JOURNEY_AUDIT.md` → Repository Difference Report → Synchronization Report.  
**Rationale:** The first BL-A draft routed some decisions to generic locations instead of canonical owners; this model prevents that.  
**Consequences:** **BL-A is the canonical synchronization standard.** After BL-A closes, future approved discussions accumulate under **BL-B** (then BL-C, …). BL-A's outstanding backlog up to UX-002A is ZERO.

## ADR-021: Executive Audit Owner Justification (BL-B)

**Status:** Accepted  
**Decision:** Every Executive Audit shall include mandatory **Owner Justification** explaining why each repository owner was selected.  
**Owner:** `EMPIREAI_EXECUTIVE_AUDIT_STANDARD.md`  
**Rationale:** Prevents silent routing to wrong artifacts; aligns with Repository First doctrine.

## ADR-022: Backlog Release lifecycle and regeneration (BL-B)

**Status:** Accepted  
**Decision:** BL lifecycle = Accumulating → Review → Approved → Loaded → Executive Audit → Closed. Regenerate entire BL on change; never patch. Closed BL immutable.  
**Owner:** `EMPIREAI_BACKLOG_RELEASE_GOVERNANCE.md` · `BL-B.md`

## ADR-023: Post-UX engineering priority — Pillow (BL-B)

**Status:** Accepted  
**Decision:** After UX-023 + UX Master Executive Audit, **Pillow** is the primary engineering priority before Go-Live preparation.  
**Owner:** Journey · Project Status · `EMPIREAI_PILLOW_ARCHITECTURE.md`

## ADR-024: Pillow cognitive architecture (BL-B)

**Status:** Accepted  
**Decision:** Pillow uses Bootstrap Engine + Context Builder; remembers knowledge not conversations; operating modes automatic; Bootstrap success criteria mandatory before "Ready".  
**Owners:** `EMPIREAI_PILLOW_ARCHITECTURE.md` · `EMPIREAI_PILLOW_MEMORY_DOCTRINE.md`

## ADR-025: Empire Recovery (BL-B)

**Status:** Accepted  
**Decision:** No single device shall destroy the Empire; Pillow performs Empire Recovery Assessment and produces Empire Recovery Report.  
**Owner:** `EMPIREAI_EMPIRE_RECOVERY_DOCTRINE.md`

## ADR-026: Journey First + Repository First (BL-B)

**Status:** Accepted  
**Decision:** Journey synchronization evaluated before other owners; repository artifacts are permanent memory superseding conversation.  
**Owners:** `EMPIREAI_JOURNEY_FIRST_DOCTRINE.md` · `EMPIREAI_REPOSITORY_FIRST_DOCTRINE.md`

## ADR-027: Pillow Architecture Contract (PILLOW-001)

**Status:** Accepted  
**Date:** 2026-06-29  
**Decision:** Pillow is the primary executive operating interface. Implementation authority is frozen in `PILLOW_ARCHITECTURE_CONTRACT.md` defining 13 subsystems: Bootstrap Engine, Context Builder, Repository Reader, Journey Manager, Decision Manager, Status Manager, UX Enhancement Register Reader, Mission Generator, Cursor Bridge, Executive Audit Reader, Approval Gate, Pillow Chat UI, OpenAI API Integration Layer. PILLOW-001 is contract-only — no runtime.  
**Owner:** Pillow Architecture · `PILLOW_ARCHITECTURE_CONTRACT.md`  
**Rationale:** BL-B established Pillow as next priority; implementation requires frozen subsystem boundaries before code (mirrors UX-000B pattern).  
**Consequences:** Future PILLOW-002+ missions must cite this contract. All repository writes require Approval Gate. UX Enhancement Register Reader uses Journey fallback until canonical register exists.

## ADR-028: Pillow Bootstrap Engine (PILLOW-002)

**Status:** Accepted  
**Date:** 2026-06-29  
**Decision:** Pillow shall execute the Repository Bootstrap Engine as the mandatory first runtime process. Bootstrap is read-only, discovers governance artifacts from the repository, produces `EmpireBootstrapContext`, and enters Bootstrap Failure Mode when mandatory artifacts are unavailable. Implementation lives in `@empireai/pillow` (`pillow/` package).  
**Owner:** Pillow Bootstrap Engine · `PILLOW_ARCHITECTURE_CONTRACT.md` Part 4.1 · `pillow/src/bootstrap/`  
**Rationale:** Pillow must reconstruct Empire knowledge from repository artifacts without depending on prior conversations (Repository First + Pillow Memory doctrines).  
**Consequences:** All Pillow subsystems must call `startPillow()` before operational reasoning. PILLOW-003 Repository Intelligence consumes Bootstrap output. Bootstrap does not modify repository content.

## ADR-029: Repository Intelligence Engine (PILLOW-003)

**Status:** Accepted  
**Date:** 2026-06-29  
**Decision:** Pillow shall execute the Repository Intelligence Engine immediately after Bootstrap. Intelligence transforms Bootstrap discovery into structured operational knowledge: artifact classification, relationship graph, dependency graph, repository health detection (read-only), and natural query answers — without modifying repository content.  
**Owner:** Pillow Repository Intelligence · `pillow/src/intelligence/` · `PILLOW_ARCHITECTURE_CONTRACT.md`  
**Rationale:** Bootstrap knows what exists; Intelligence understands what everything means — required engineering knowledge layer before Context Builder, Mission Generator, and operational reasoning.  
**Consequences:** `startPillow()` chains PILLOW-002 → PILLOW-003. Context Builder (future mission) consumes Intelligence output. Intelligence never writes repository files.

## ADR-030: Pillow Architecture Synchronization

**Status:** Accepted  
**Date:** 2026-06-29  
**Decision:** Synchronize `PILLOW_ARCHITECTURE_CONTRACT.md` to the finalized Pillow architecture evolved during PILLOW-002/003 implementation. Repository Intelligence Engine is canonical subsystem #3 (PILLOW-003 ✅). Context Builder and OpenAI Integration Layer are split to PILLOW-004 and PILLOW-005. Approval Gate bundle, Chat UI, and Empire Recovery renumber to PILLOW-006…008. PILLOW-001 original decomposition preserved in contract Part 10 — **no completed implementation discarded**.  
**Owner:** Pillow Architecture · `PILLOW_ARCHITECTURE_CONTRACT.md` Part 10 · Decision Register  
**Rationale:** PILLOW-001 authored before runtime revealed that Bootstrap and Intelligence must precede Context Builder; mission order in original Part 7 no longer matched engineering reality.  
**Consequences:** All PILLOW-004+ missions cite synchronized Part 7. ADR-027/028/029 preserved. BL-B remains closed and immutable. JOURNEY_AUDIT historical entries not rewritten.

## ADR-031: Business Law C — Continuous Improvement Constitution (BL-C)

**Status:** Accepted  
**Date:** 2026-06-29  
**Decision:** Open BL-C as the **ACTIVE** Backlog Release governing continuous improvement. Canonical doctrine: `EMPIREAI_BL_C_CONTINUOUS_IMPROVEMENT_CONSTITUTION.md`. Establish canonical enhancement registers: `docs/governance/UX_ENHANCEMENT_REGISTER.md` and `docs/governance/PILLOW_ENHANCEMENT_REGISTER.md`. Executive Audits shall include mandatory **Future Enhancements** section (distinct from acceptance criteria). Enhancement registration does not authorize engineering execution — Grand King approval remains mandatory.  
**Owner:** Repository Governance · Continuous Improvement · `BL-C.md`  
**Rationale:** EmpireAI must evolve after implementation without continuously redesigning. BL-A implements; BL-B governs repository architecture; BL-C governs improvement accumulation.  
**Consequences:** Every completed UX/Pillow mission updates respective enhancement registers. BL-C accumulates until Grand King closes it. Pillow may recommend improvements but never write repository without Approval Gate.

## ADR-032: Context Builder (PILLOW-004)

**Status:** Accepted  
**Date:** 2026-06-29  
**Decision:** Pillow shall assemble the smallest complete operational context per request via the Context Builder. Input: Bootstrap + Intelligence output. Task profiles select relevant repository slices only. Runtime cache keyed by task + repository fingerprint; cache is ephemeral — not permanent memory. Context Builder is read-only. `startPillow()` initializes ContextBuilder after Intelligence.  
**Owner:** Context Builder · `pillow/src/context/` · `EMPIREAI_PILLOW_MEMORY_DOCTRINE.md`  
**Rationale:** Repository Intelligence knows everything; Context Builder decides what is needed now — reduces token cost and improves reasoning quality.  
**Consequences:** PILLOW-005 OpenAI layer shall consume `OperationalContext` manifests only. No full repository dumps.

## ADR-033: Repository Memory Engine (PILLOW-005)

**Status:** Accepted  
**Date:** 2026-06-29  
**Decision:** Pillow shall maintain long-term operational memory derived exclusively from repository artifacts — never from conversation history. Repository Memory initializes after Bootstrap and Intelligence, refreshes automatically when the repository fingerprint changes, and supports Context Builder and downstream modules via named memory services. Every memory domain item preserves provenance (`bootstrap`, `intelligence`, or `bootstrap+intelligence`). Repository Memory is read-only — it never modifies Journey, BL, audits, or any repository file.  
**Owner:** Repository Memory · `pillow/src/memory/` · `EMPIREAI_PILLOW_MEMORY_DOCTRINE.md`  
**Rationale:** Conversation memory is temporary; repository memory is permanent. Pillow must rebuild operational continuity from repository truth on every session without manual rebuilding.  
**Consequences:** PILLOW-006 Mission Planner shall consume Memory + Intelligence output. OpenAI Integration Layer renumbers to PILLOW-007 per contract Part 7.

## ADR-034: Mission Planner (PILLOW-006)

**Status:** Accepted  
**Date:** 2026-06-29  
**Decision:** Pillow shall determine the correct next engineering, repository, governance, architecture, or operational mission exclusively from repository state via the Mission Planner. Mission Planner assigns priority, validates dependencies, sequences missions, and generates standardized Cursor-ready mission documents with repository evidence — never from conversation history. Mission Planner is read-only: it generates missions only; execution belongs to Cursor; approval belongs to the Approval Gate. `startPillow()` initializes MissionPlanner after Repository Memory.  
**Owner:** Mission Planner · `pillow/src/planner/` · `PILLOW_ARCHITECTURE_CONTRACT.md` Part 4.16  
**Rationale:** Manual planning breaks operational continuity. Repository truth must drive mission sequencing across UX, REAL, Pillow, governance, and commercial domains.  
**Consequences:** OpenAI layer renumbers to PILLOW-008. Approval Gate + Cursor Bridge renumber to PILLOW-009. Chat UI → PILLOW-010. Empire Recovery → PILLOW-011. Contract Part 4.8 Mission Generator runtime absorbed by Mission Planner generation capability; dispatch remains gated.

## ADR-035: Cursor Supervisor (PILLOW-007)

**Status:** Accepted  
**Date:** 2026-06-29  
**Decision:** Pillow shall supervise Cursor engineering missions via the Cursor Supervisor — launch, monitor, detect stalls and dead agents, coordinate Recovery Mode per `EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md`, and verify Executive Audit production before mission completion. Cursor performs engineering work; Pillow supervises; the Grand King supervises Pillow. Supervisor maintains runtime mission registry with lifecycle states, heartbeat monitoring, and progress tracking. Supervisor is read-only — it never modifies repository files, Journey, BL, or approves implementations. `startPillow()` initializes CursorSupervisor after Mission Planner.  
**Owner:** Cursor Supervisor · `pillow/src/supervisor/` · `EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md`  
**Rationale:** Engineering supervision must not depend on manual observation. Agent stalls and detached validation waits are unacceptable per Recovery Doctrine; Pillow must orchestrate recovery automatically.  
**Consequences:** OpenAI layer renumbers to PILLOW-009. Approval Gate + Cursor Bridge → PILLOW-010. Chat UI → PILLOW-011. Empire Recovery → PILLOW-012.

## ADR-036: Recovery Manager (PILLOW-008)

**Status:** Accepted  
**Date:** 2026-06-29  
**Decision:** Pillow shall implement autonomous engineering recovery via the Recovery Manager, executing `EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md` exactly. Recovery activates only when invoked by the Cursor Supervisor. Recovery shall always resume — never restart — preserving completed implementation, repository continuity, and mission numbering. Recovery executes: repository inspection → mission diagnosis → strategy selection → resume first incomplete work item → exactly one validation cycle (typecheck then build) when required → Executive Audit. Recovery outcomes are always recorded. Recovery Manager never modifies Journey, BL, or governance artifacts.  
**Owner:** Recovery Manager · `pillow/src/recovery/` · `EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md`  
**Rationale:** Cursor agent stalls and detached validation deadlocks break engineering continuity. Recovery must be automatic and doctrine-conformant without manual intervention or duplicate implementation.  
**Consequences:** OpenAI layer renumbers to PILLOW-010. Approval bundle → PILLOW-011. Chat UI → PILLOW-012. Empire Recovery Assessment → PILLOW-013.

---

## ADR-037: Executive Audit Reviewer (PILLOW-009)

**Status:** Accepted  
**Date:** 2026-06-29  
**Decision:** Pillow shall implement the Executive Audit Reviewer as the mandatory quality gate before any engineering mission is considered complete. Completion does not equal acceptance. The reviewer evaluates contract compliance, acceptance criteria (individually), architecture, repository integrity, validation quality, and governance compliance per `EMPIREAI_EXECUTIVE_AUDIT_STANDARD.md`. It produces one of: approved, approved_with_recommendations, conditionally_approved, rejected, manual_review_required — with reasoning and categorized recommendations. Mandatory corrections prevent approval; enhancement recommendations do not. The reviewer reports to the Cursor Supervisor, is invoked during mission completion, and never modifies repository files, Journey, BL, or Executive Audits.  
**Owner:** Executive Audit Reviewer · `pillow/src/audit-reviewer/` · `EMPIREAI_EXECUTIVE_AUDIT_STANDARD.md`  
**Rationale:** Executive Audits require independent verification before Pillow accepts mission completion and Mission Planner generates the next mission.  
**Consequences:** OpenAI layer renumbers to PILLOW-011. Approval bundle → PILLOW-012. Chat UI → PILLOW-013. Empire Recovery Assessment → PILLOW-014.

---

## ADR-038: Repository Synchronizer (PILLOW-010)

**Status:** Accepted  
**Date:** 2026-06-29  
**Decision:** Pillow shall implement the Repository Synchronizer as the repository maintenance engine keeping canonical artifacts synchronized after approved engineering work. Synchronization shall never invent repository information — all proposals derive from verified evidence (git inspection, memory drift, mission closeout). Preview Mode is mandatory before any write. Grand King approval is required; outcomes: approved, rejected, deferred, request_revision. Only approved changes may be applied, followed by verification and queryable synchronization history. The synchronizer never performs engineering implementation, modifies application code, generates Cursor missions, or bypasses Preview Mode.  
**Owner:** Repository Synchronizer · `pillow/src/synchronizer/` · `EMPIREAI_JOURNEY_FIRST_DOCTRINE.md` · `EMPIREAI_REPOSITORY_FIRST_DOCTRINE.md`  
**Rationale:** Manual repository maintenance after Pillow missions creates drift between Journey, Status, Soul, and governance artifacts. Automated preview-first synchronization preserves repository continuity under Grand King control.  
**Consequences:** OpenAI layer renumbers to PILLOW-012. Approval bundle → PILLOW-013. Chat UI → PILLOW-014. Empire Recovery Assessment → PILLOW-015.

---

## ADR-039: Continuous Due Diligence Engine (PILLOW-011)

**Status:** Accepted  
**Date:** 2026-06-29  
**Decision:** Pillow shall implement the Continuous Due Diligence Engine as a permanent self-initiated analysis subsystem operating throughout Pillow's lifetime. When idle, Pillow continuously analyses repository architecture, mission progression, commercial readiness, governance, recovery readiness, and related domains — producing prioritized recommendations (critical through future) derived from verified repository evidence. All recommendations require Grand King approval before execution. The engine shall never modify repository files, execute engineering work, or launch Cursor. Grand King commands immediately interrupt idle analysis.  
**Owner:** Continuous Due Diligence Engine · `pillow/src/due-diligence/` · `EMPIREAI_BL_C_CONTINUOUS_IMPROVEMENT_CONSTITUTION.md`  
**Rationale:** Pillow must never become passive. Continuous improvement discovery aligns with BL-C and reduces architectural and commercial risk between explicit missions.  
**Consequences:** OpenAI layer renumbers to PILLOW-013. Approval bundle → PILLOW-014. Chat UI → PILLOW-015. Empire Recovery Assessment → PILLOW-016.

---

## ADR-040: Autonomous Improvement Engine (PILLOW-012)

**Status:** Accepted  
**Date:** 2026-06-29  
**Decision:** Pillow shall implement the Autonomous Improvement Engine as the strategic improvement subsystem converting Due Diligence observations into structured engineering proposals and implementation plans. Every improvement shall be evidence-driven, trace back to repository intelligence, and progress through observation → evidence → impact analysis → priority assessment → dependency verification → implementation proposal → Grand King approval → mission generation. The engine shall determine mission readiness (ready, blocked, sync required, architecture review, Grand King decision, further investigation). The engine shall never execute engineering work, modify repository files, modify Journey or BL, approve its own proposals, or launch Cursor directly.  
**Owner:** Autonomous Improvement Engine · `pillow/src/improvement/` · `EMPIREAI_BL_C_CONTINUOUS_IMPROVEMENT_CONSTITUTION.md`  
**Rationale:** Observation alone creates no value. Pillow must know how to improve the Empire — converting continuous analysis into executable missions under Grand King authority.  
**Consequences:** OpenAI layer renumbers to PILLOW-014. Approval bundle → PILLOW-015. Chat UI → PILLOW-016. Empire Recovery Assessment → PILLOW-017.

---

## ADR-041: EmpireAI Orchestrator (PILLOW-013)

**Status:** Accepted  
**Date:** 2026-06-29  
**Decision:** Pillow shall implement the EmpireAI Orchestrator as the central coordination layer responsible for coordinating every Pillow subsystem, engineering worker, repository process, and governance workflow. The Orchestrator shall maintain dynamic subsystem and worker registries, coordinate configurable workflows including the engineering pipeline (Mission Planner through Due Diligence), schedule work adaptively, coordinate failures while preserving repository integrity, and enforce Grand King command priority over autonomous workflows. The Orchestrator shall never modify repository files directly, approve engineering work, approve repository synchronization, bypass Executive Audit, or bypass Grand King authority.  
**Owner:** EmpireAI Orchestrator · `pillow/src/orchestrator/` · `PILLOW_ARCHITECTURE_CONTRACT.md`  
**Rationale:** As Pillow subsystems multiply, a central coordination layer is required to supervise lifecycles without replacing specialized modules.  
**Consequences:** OpenAI layer renumbers to PILLOW-015. Approval bundle → PILLOW-016. Chat UI → PILLOW-017. Empire Recovery Assessment → PILLOW-018.

---

## ADR-042: Live Repository Watcher (PILLOW-014)

**Status:** Accepted  
**Date:** 2026-06-29  
**Decision:** Pillow shall implement the Live Repository Watcher as the continuous sensing subsystem observing the EmpireAI repository and notifying downstream Pillow modules whenever repository state changes. The Watcher shall monitor canonical governance artifacts, classify changes, generate structured events, notify subscribed modules, and detect repository drift — without modifying repository files, approving changes, or repairing issues. Observation shall be continuous; Pillow shall never assume repository state remains unchanged.  
**Owner:** Live Repository Watcher · `pillow/src/watcher/` · `PILLOW_ARCHITECTURE_CONTRACT.md`  
**Rationale:** Downstream modules require current repository understanding. Continuous observation with event-driven notification prevents stale assumptions between engineering cycles.  
**Consequences:** Pillow Version 1 complete at PILLOW-015. Post-V1 missions (OpenAI PILLOW-016, Approval PILLOW-017, Chat PILLOW-018, Recovery PILLOW-019) deferred pending Grand King approval.

---

## ADR-043: Grand King Command Interface (PILLOW-015)

**Status:** Accepted  
**Date:** 2026-06-29  
**Decision:** Pillow shall implement the Grand King Command Interface as the primary natural-language executive operating console between Grand King and Pillow. The interface shall interpret Grand King intent, automatically load repository context from Memory and Intelligence, generate execution plans with relevant module coordination, enforce Grand King priority over autonomous workflows, and preserve conversation continuity through repository truth rather than chat history. The interface shall never bypass repository governance, bypass Executive Audit, modify repository files directly, or perform engineering implementation. PILLOW-015 completes Pillow Version 1 architecture.  
**Owner:** Grand King Command Interface · `pillow/src/command/` · `PILLOW_ARCHITECTURE_CONTRACT.md`  
**Rationale:** The Grand King shall command naturally without understanding repository structure. Pillow determines execution through governed coordination of specialized modules.  
**Consequences:** Pillow V1 complete. Post-V1 missions deferred: OpenAI → PILLOW-016; Approval Gate → PILLOW-017; Chat UI → PILLOW-018; Empire Recovery → PILLOW-019. Master Executive Audit required before EmpireAI integration.

## ADR-044: REAL Namespace Canonicalization

**Status:** Accepted  
**Date:** 2026-06-29  
**Decision:** Permanently define canonical REAL-### ownership, prohibit duplicate REAL identifiers in governance artifacts, and establish runtime-truth precedence over superseded blueprints. Commerce/runtime REAL-003/004/005 (Marketplace Publishing, Listing Intelligence, Product Media) and REAL-055 (Executive War Room) are canonical in Journey and audits; REAL-007 remains canonical owner of Executive Visual Debate. Foundation REAL-003/004/005 labels inside `reality-integration` are legacy — **formally deferred** until a governed post-V1 renumbering mission (e.g. REAL-00xR sub-series). **No V1 runtime, contract, or Journey renumbering** is authorized by this ADR.  
**Owner:** Repository Governance · `docs/governance/ADR-044-REAL-NAMESPACE-CANONICALIZATION.md` · `JOURNEY.md` · `JOURNEY_AUDIT.md` · `EMPIREAI_REPOSITORY_MASTER_INDEX.md` §8.2  
**Rationale:** REAL Namespace Reconciliation (JOURNEY_AUDIT.md §6/§10; REAL-003-007 and REAL-051-070 audits) documented conflicts without permanent policy; duplicate IDs break Journey indexing, Pillow intelligence, and Executive Audit interpretation.  
**Consequences:** New REAL assignments require Journey row + Backlog Release routing (ADR-020 ROUTE 02). ⚠️ Journey rows remain until post-V1 renumbering. **Note:** ADR-020 remains Backlog Routing — this policy is ADR-044 per ADR-022 closed-BL immutability.

## ADR-045: Commercial Integration → Commercial Intelligence transition

**Status:** Accepted  
**Date:** 2026-06-29  
**Decision:** Recognize **REAL-002B** as completion of the **foundational commercial integration layer** (architecture). Establish **Commercial Intelligence** (EmpireAI Roadmap Layer 3) as the **next strategic development focus** after Version 1 Executive Certification Audit. Treat API integrations as **infrastructure**, not competitive differentiation. Prioritize post-V1 intelligence capabilities: Product Intelligence, Supplier Intelligence, Pricing Intelligence, Margin Optimization, Advertising Intelligence, Demand Forecasting — reusing REAL-002B live pipes without duplicating connector logic. Preserve all governance, approval, and live-commerce safety gates (GC-02, Pillow approval, Guardian, credential vault, Grand King sole-operation).  
**Owner:** Grand King Commercial Architecture · `docs/governance/COMMERCIAL_INTEGRATION_TO_INTELLIGENCE_TRANSITION.md` · `EMPIREAI_ROADMAP.md` Layer 3  
**Rationale:** REAL-002B Executive Audit confirms live commerce integration architecture complete; competitive advantage shifts from connectivity to intelligence depth per CBD-007/008 and five-layer roadmap.  
**Consequences:** Post-V1 engineering prioritization follows P1→P6 capability stack in transition doc. Connector expansion missions classified as infrastructure. PROOF-001 / live credentials remain operational gates — not architecture blockers. **No V1 runtime or contract changes** authorized by this ADR.

## ADR-046: Executive Cognitive Pipelines (Pillow Executive Intelligence)

**Status:** Accepted  
**Date:** 2026-06-29  
**Decision:** Organise future **Pillow Executive Intelligence** (Layer 2) PEI missions into five **Executive Cognitive Pipelines** for Master Plan planning: **A — Executive Reconstruction** (Bootstrap · Identity · Direction · Context); **B — Executive Reasoning** (composition · conversation intelligence · response synthesis); **C — Executive Learning** (Reflection · evidence · candidates); **D — Executive Governance** (GK approval · promotion · EKB); **E — Executive Evolution** (knowledge integration · bootstrap enrichment · continuous improvement). Pipelines mirror Constitution §2.1 lifecycle without amending constitutional text or changing PEI-### identifiers.  
**Owner:** Pillow Architecture · `docs/governance/EXECUTIVE_COGNITIVE_PIPELINES.md` · `PILLOW_ROADMAP.md` Layer 2  
**Rationale:** Layer 2 capability count (PEI-001…026) requires coherent grouping for post-V1 Master Plan tranches; Bootstrap extension complete — Reflection (PEI-026) is first downstream implementation target.  
**Consequences:** Master Plan and enhancement prioritisation may reference pipelines A–E. Implementation gated on V1 Executive Certification Audit + GK Master Plan approval. **No runtime, constitution, or PEI renumbering** authorized by this ADR.

## ADR-047: Executive UX Layer Architecture (GC-03 + GC-05)

**Status:** Accepted  
**Date:** 2026-06-29  
**Decision:** Formally define EmpireAI's executive experience as three complementary components: **Pillow** (Executive Intelligence); **GC-05 Global AI Assistant** (Executive Interaction Layer); **GC-03 Notifications Center** (Executive Attention Layer). GC-03 and GC-05 are the two **executive interface layers** — presentation components that expose Pillow capabilities without embedding executive intelligence in UI. Pillow remains independent from the presentation layer.  
**Owner:** UX Governance · Pillow Architecture · `docs/governance/EXECUTIVE_UX_LAYER_ARCHITECTURE.md`  
**Rationale:** Clean separation preserves architecture: future UX redesigns do not affect executive reasoning; future Pillow Layer 2 enhancements do not require GC chrome changes. GC-03 and GC-05 implementations are complete — this ADR codifies their permanent architectural role.  
**Consequences:** Future executive intelligence work targets Pillow; conversational UX targets GC-05; attention/alert UX targets GC-03. **No runtime, API, or GC implementation changes** authorized by this ADR.

## ADR-048: Version 1 Certification Mode

**Status:** Accepted · **ACTIVE**  
**Date:** 2026-06-29  
**Decision:** Transition EmpireAI from Architecture & Expansion Mode into **Version 1 Certification Mode**. Version 1 is **architecture-complete**. Every engineering mission must directly remove one or more verified certification blockers from `docs/governance/VERSION_1_CERTIFICATION_BLOCKER_REGISTER.md`. Missions that do not reduce the blocker register are deferred until Version 1 executive certification. Post-V1 roadmaps (PEI, Commercial Intelligence, Supplier Intelligence, BL-C implementation) remain frozen until exit criteria: all blockers closed · GK-GOLIVE-APPROVAL · PROOF-001 · Version 1 Executive Certification signed.  
**Owner:** Repository Governance · Journey · Project State · `docs/governance/VERSION_1_CERTIFICATION_MODE.md`  
**Rationale:** Prevents scope expansion after architecture completion; concentrates engineering on live certification path.  
**Consequences:** Mission headers must declare blocker IDs addressed. Pillow Builder Mode and BL-C defer non-blocker implementation. Gap analysis audit remains historical reference; blocker register is SSOT for open items.

## ADR-049: Pillow Version 1 Delivery Mode

**Status:** Accepted · **ACTIVE** (governance adopted — **awaiting Grand King approval to execute delivery missions**)  
**Date:** 2026-06-29  
**Decision:** Recognize Pillow architecture as **complete for EmpireAI Version 1** (Layer 1 runtime · constitution · Executive Perspectives · Laws 1–7 · Product Integration Phase 0). Transition all remaining Pillow work into **Delivery Mode** limited to Product Hardening (Phase 1), Operational Readiness (Phase 2), and Commercial Go-Live (Phase 3). No new Pillow constitutional or runtime architecture except where required to close V1 certification blockers B5–B8. PEI, Commercial Intelligence, and Supplier Intelligence remain post-V1 (Phase 4 deferred). Every Pillow mission must declare certification blocker(s) removed or Product Integration Phase 1–3 completed.  
**Owner:** Pillow Architecture · Runtime Engineering · `docs/governance/PILLOW_VERSION_1_DELIVERY_MODE.md`  
**Rationale:** Aligns Pillow with Empire Certification Mode; prevents Layer 2 scope creep before live certification.  
**Consequences:** Subordinate to ADR-048 Certification Mode. Pillow missions without blocker or Phase 1–3 declaration are deferred. Constitution §16 cross-reference added.

## ADR-050: Marketplace Autonomy Doctrine (REAL-051A)

**Status:** Accepted · **ACTIVE**  
**Date:** 2026-06-29  
**Decision:** Adopt **REAL-051A Marketplace Autonomy Doctrine** as the permanent EmpireAI Version 1 commercial operating model. Founder performs one-time third-party legal onboarding only; after approved credentials are stored, EmpireAI becomes the operational executor for publish · sync · route · fulfil · monitor — subject to Grand King approval, executive governance approval, and valid production credentials. Common products publish to supported marketplaces; premium/branded products operate dedicated Shopify stores. Doctrine applies generically to Amazon, Shopify, CJ, TikTok Shop, Meta Commerce, Walmart, Etsy, eBay, and future adapters.  
**Owner:** Repository Governance · Commercial Architecture · `docs/governance/MARKETPLACE_AUTONOMY_DOCTRINE_REAL-051A.md`  
**Rationale:** Formalizes Grand King-approved founder experience; aligns repository governance with operational activation without constitutional change.  
**Consequences:** Companion to immutable CBD-001→020. Cross-referenced in Commerce Canon, Journey, operational activation docs. **No runtime, API, or approval authority changes** authorized by this ADR. REAL-051A is a governance label distinct from runtime REAL-051 (Unified Grand King Headquarters).

## ADR-051: Commercial Risk Intelligence (CRI)

**Status:** Accepted · **ACTIVE** (governance adopted — documentation phase; runtime enforcement deferred)  
**Date:** 2026-06-21  
**Decision:** Adopt **Commercial Risk Intelligence (CRI)** as a **permanent platform capability** in repository governance. EmpireAI is documented as an **AI-powered e-commerce operating system** with **global dropshipping** as the first commercial model. Before any **future product launch**, EmpireAI shall produce a **Commercial Risk Intelligence Report (CRIR)** covering supplier/marketplace refund policies, customer refund exposure, chargeback exposure, shipping risk, supplier reliability, legal/policy risks, expected margin after all costs, worst-case financial exposure, and survivability assessment. Product launch approval **requires commercial risk certification**. EmpireAI shall **never knowingly launch** products whose refund or dispute structure can reasonably produce systematic financial loss. **Survival has higher priority than potential profit.** Commercial risk transparency is mandatory.  
**Owner:** Commercial Architecture · Intelligence · Finance · Governance · `docs/governance/COMMERCIAL_RISK_INTELLIGENCE_DOCTRINE.md` · `docs/governance/COMMERCIAL_RISK_INTELLIGENCE_REPORT_SPECIFICATION.md`  
**Rationale:** Executive Intelligence governance direction — commercial success depends on deep intelligence across both suppliers and marketplaces; financial survivability must gate launch decisions.  
**Consequences:** Companion to CBD-001→020 (survivability aligns with CBD-002; CRI-001 elevates survivability when in conflict). CRIR added as Commerce Canon READINESS documentation criterion. Cross-referenced in Canonical Architecture §3.7A, Master Index, Roadmap. **No runtime, Cockpit, Brain, API, or REAL mission history changes** authorized by this ADR. Future REAL missions may implement CRIR automation and launch gate enforcement.

---

## Superseded Programs (Historical Reference)

| Program | Status | Notes |
|---------|--------|-------|
| R001–R010 Project Reality | **SUPERSEDED** | See [EMPIREAI_ROADMAP.md](./EMPIREAI_ROADMAP.md) |
| Project Reality V1 Audit | **SUPERSEDED** | [EMPIREAI_REALITY_V1.md](./EMPIREAI_REALITY_V1.md) preserved |
| Marketplace OS (MOS-001) | **SUPERSEDED** | [MARKETPLACE_OS_VISION.md](./MARKETPLACE_OS_VISION.md) preserved |

---

## Pending decisions (require human judgment)

| ID | Question | Options |
|----|----------|---------|
| PDR-001 | Database at scale | SQLite continue vs PostgreSQL migration |
| PDR-002 | ~~First live connector~~ | **Superseded by ADR-012** — Marketplace OS adapter phasing (see MOS-001) |
| PDR-003 | LLM routing policy | Default provider, cost caps, fallback chain |
| PDR-004 | Credentials vault | Env vars vs HashiCorp vs cloud KMS |
| PDR-005 | Marketplace OS kernel location | **Superseded by ADR-013** — Connector Kernel extends `reality-integration` |
| PDR-006 | COS-002 first deliverable | Connector SDK types vs reference Shopify adapter |

_Last updated: Commercial Risk Intelligence (CRI) governance alignment — ADR-051 — 2026-06-21. See `docs/governance/COMMERCIAL_RISK_INTELLIGENCE_DOCTRINE.md`._
