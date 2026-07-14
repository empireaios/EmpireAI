# EMPIREAI GLOSSARY

> **Classification:** CANONICAL — Tier 3 Law (Governance)  
> **Document ID:** P1-08  
> **Constitutional phase:** P1 — Identity Foundation  
> **Dependencies:** P1-01 · P1-02 · P1-03 · P1-04 · P1-05 · P1-06 · P1-07  
> **Authority:** Grand King  
> **Established:** 2026-07-05  
> **Role:** **Official language of EmpireAI** — what every constitutional name **means**  
> **Naming rules:** [`EMPIREAI_NAMING_STANDARD.md`](./EMPIREAI_NAMING_STANDARD.md) (P1-07) governs **how** names are created; **this glossary governs what they mean**

---

## 1. Purpose

Every future engineer, AI worker, document, and subsystem must interpret every constitutional term **exactly the same way**.

The glossary is the **single source of truth for terminology**. It explains concepts in plain English, links to law, and prevents circular or duplicated meaning.

**The principle:** One definition per concept · one concept per definition · no conflicting terminology · plain English with technical accuracy.

---

## 2. Glossary Rules

| Rule | Requirement |
|------|-------------|
| **G1** | One official definition per concept — no alternate meanings in CANONICAL docs |
| **G2** | One concept per glossary entry — split overloaded terms via ADR |
| **G3** | No circular definitions — every cross-reference must resolve to a primary definition |
| **G4** | Plain English in **Official Definition**; precision in **Usage Rules** |
| **G5** | New terms register here **before** CANONICAL use (after Naming Standard §10) |
| **G6** | Constitution always qualified — see entry **Constitution (Qualified)** |
| **G7** | Acceptance types are distinct — Repository · Production · Grand King |
| **G8** | Status field: **Active** · **Deferred** · **Historical** only |

**Entry fields (every term):** Official Definition · Purpose · Owner · Related Terms · Usage Rules · Examples · References · Status

---

## 3. Glossary Entries

Entries are grouped alphabetically. Jump via [§4 Alphabetical Index](#4-alphabetical-index).

---

### Acceptance

| Field | Content |
|-------|---------|
| **Official Definition** | Formal validation that a mission, change, or outcome meets declared criteria and may proceed or close. |
| **Purpose** | Gate progress on proof — prevent unvalidated work from becoming truth. |
| **Owner** | Grand King (final) · Chief Architect (technical criteria) · Pillow (supervisor verification) |
| **Related Terms** | PROOF · Repository Acceptance · Production Acceptance · Grand King Acceptance |
| **Usage Rules** | Always specify **which** acceptance type. "Accepted" alone is insufficient in constitutional prose. |
| **Examples** | "Mission awaits **Grand King Acceptance** before commercial deploy." |
| **References** | [`EMPIREAI_REASONING_MODEL.md`](./EMPIREAI_REASONING_MODEL.md) · GVD |
| **Status** | Active |

---

### ADR (Architecture Decision Record)

| Field | Content |
|-------|---------|
| **Official Definition** | A permanent recorded decision with rationale, status, and consequences — **`ADR-###`** programme and **`ADR-CON-###`** constitutional decisions in [`EMPIREAI_DECISIONS.md`](../../EMPIREAI_DECISIONS.md), governed by P3-07 ADR System. |
| **Purpose** | Preserve **why** structural choices were made; prevent re-litigation. |
| **Owner** | Chief Architect · Grand King (ADR-CON-* approval) |
| **Related Terms** | Architecture · Doctrine · Constitution · Mission · PDR |
| **Usage Rules** | One register only. Use **ADR-###** in registers and commits; ADR before irreversible structural merge. |
| **Examples** | **ADR-CON-003** — Brain single-dispatch strategy. |
| **References** | [`EMPIREAI_ARCHITECTURAL_DECISION_RECORD_SYSTEM.md`](./EMPIREAI_ARCHITECTURAL_DECISION_RECORD_SYSTEM.md) (P3-07) · [`EMPIREAI_DECISIONS.md`](../../EMPIREAI_DECISIONS.md) · [`EMPIREAI_NAMING_STANDARD.md`](./EMPIREAI_NAMING_STANDARD.md) §5.4 |
| **Status** | Active (P3-07 canonical ADR system) |

---

### Architecture

| Field | Content |
|-------|---------|
| **Official Definition** | The normative and operational description of **how** EmpireAI systems are shaped and connected — **always qualified**. |
| **Purpose** | Separate target design from live implementation. |
| **Owner** | Chief Architect (normative) · Pillow (runtime subsystems) |
| **Related Terms** | Canonical Architecture · Operational Architecture Guide · HOW · Brain · Hierarchy Tier 4 |
| **Usage Rules** | Never say "Architecture" without **Canonical** or **Operational**. |
| **Examples** | "Align REAL mission to **Canonical Architecture** §2, not the Operational Architecture Guide alone." |
| **References** | [`docs/architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md`](../architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md) · [`EMPIREAI_HIERARCHY.md`](./EMPIREAI_HIERARCHY.md) |
| **Status** | Active |

---

### Automation

| Field | Content |
|-------|---------|
| **Official Definition** | Execution without explained intelligence or human approval at irreversibles — **explicitly not** what EmpireAI is. |
| **Purpose** | Negative anchor — CTD-005 Intelligence Platform vs Automation Platform. |
| **Owner** | Grand King (commercial law) |
| **Related Terms** | EmpireAI · Intelligence · Guardian · Grand King Acceptance |
| **Usage Rules** | EmpireAI **automates nothing irreversible** without approval chain. Do not brand EmpireAI an "automation platform." |
| **Examples** | Rejected: "Automate all supplier orders." Accepted: "Brain dispatches **after** Grand King Acceptance." |
| **References** | CTD-005 · [`EMPIREAI_VISION.md`](../../EMPIREAI_VISION.md) §7 |
| **Status** | Active |

---

### Brain

| Field | Content |
|-------|---------|
| **Official Definition** | The execution kernel — orchestrator, authentication, persistence, and Guardian dispatch path (`backend/src/brain/`). |
| **Purpose** | Single execution point for all platform actions. |
| **Owner** | Pillow (constitutional owner) · Brain runtime (executor) |
| **Related Terms** | Pillow · Guardian · Runtime · Cockpit · Builder · HOW |
| **Usage Rules** | Brain **executes**; it does not **own** Vision, approve missions, or present UX. Not a peer of Pillow. |
| **Examples** | "All dispatch flows through **Brain** orchestrator." |
| **References** | [`EMPIREAI_BRAIN_ARCHITECTURE.md`](../architecture/EMPIREAI_BRAIN_ARCHITECTURE.md) (P3-01) · ADR-001 · [`EMPIREAI_OWNERSHIP_MODEL.md`](./EMPIREAI_OWNERSHIP_MODEL.md) · Engineering Constitution |
| **Status** | Active (P3-01 canonical architecture) |

---

### Builder

| Field | Content |
|-------|---------|
| **Official Definition** | The **constitutional engineering execution engine** — Cursor implementation channel that converts approved constitutional intent into validated implementation under Pillow supervision. |
| **Purpose** | Engineering execution without scope or approval authority. |
| **Owner** | Grand King (mission scope) · Pillow (supervision path) |
| **Related Terms** | Supervisor · Pillow · Mission · REAL Mission · Repository Acceptance |
| **Usage Rules** | Never call Builder the "owner" of missions. Builder may not expand scope or deploy production without authorization. Builder modifies Brain; Builder ≠ Brain. |
| **Examples** | "**Builder** implements REAL-127; **Pillow** supervises." |
| **References** | [`EMPIREAI_BUILDER_ARCHITECTURE.md`](../architecture/EMPIREAI_BUILDER_ARCHITECTURE.md) (P3-04) · [`EMPIREAI_SUPERVISOR_GOVERNANCE.md`](./EMPIREAI_SUPERVISOR_GOVERNANCE.md) |
| **Status** | Active (P3-04 canonical architecture) |

---

### Business Engine

| Field | Content |
|-------|---------|
| **Official Definition** | A single Pillow-owned capability engine (marketplace, supplier, payment, logistics, advertising, etc.) orchestrated by Brain. |
| **Purpose** | One canonical owner per business capability — no duplicate engines. |
| **Owner** | Pillow |
| **Related Terms** | Commerce · Brain · Canonical Architecture · Production |
| **Usage Rules** | Singular **Business Engine**; plural **Business Engines** for the Tier 5 plane. |
| **Examples** | "Marketplace Engine is a **Business Engine**, not a separate platform." |
| **References** | [`docs/architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md`](../architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md) §2 |
| **Status** | Active |

---

### Canonical

| Field | Content |
|-------|---------|
| **Official Definition** | ECDS-1 classification: governing law, identity, or normative architecture — **cite as current truth**. |
| **Purpose** | Distinguish law from operational state and evidence. |
| **Owner** | Chief Architect (classification) · Grand King (apex identity/law) |
| **Related Terms** | Operational · Evidence · Historical · Stub · Documentation |
| **Usage Rules** | Header tag: `Classification: CANONICAL`. Do not label evidence or snapshots as Canonical. |
| **Examples** | `EMPIREAI_VISION.md` is **Canonical**; `COMBINED_EXECUTIVE_AUDIT_*` is **Evidence**. |
| **References** | ECDS-1 · [`EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md`](./EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md) §4 |
| **Status** | Active |

---

### Chief Architect

| Field | Content |
|-------|---------|
| **Official Definition** | Non-runtime strategic authority (ChatGPT) — architectural stewardship, constitution drafting, normative architecture, mission design, ADRs. |
| **Purpose** | Own **what the empire should become** structurally and legally (with Grand King sovereignty). |
| **Owner** | Grand King (sovereign over Architect) |
| **Related Terms** | Grand King · Pillow · EmpireAI · Constitution · Architecture · Governance |
| **Usage Rules** | Chief Architect does **not** run Pillow COI or execute production. Co-maintains Soul with Grand King. |
| **Examples** | "**Chief Architect** maintains CON-004 Constitution Hierarchy (P2-01)." |
| **References** | [`EMPIREAI_OWNERSHIP_MODEL.md`](./EMPIREAI_OWNERSHIP_MODEL.md) · [`EMPIREAI_HIERARCHY.md`](./EMPIREAI_HIERARCHY.md) Tier 1 |
| **Status** | Active |

---

### Cockpit

| Field | Content |
|-------|---------|
| **Official Definition** | The Grand King executive shell — visualization and approval UI (`empireai-web/`), Pillow-owned. |
| **Purpose** | Single executive surface — see live state, approve actions; never source of execution truth. |
| **Owner** | Pillow |
| **Related Terms** | Grand King · Brain · Visualization · Production · Founder Shell |
| **Usage Rules** | Not "dashboard" or "frontend" in constitutional prose. Cockpit **visualizes**; Brain **executes**. |
| **Examples** | "**Cockpit** displays `/health/live`; Brain serves it." |
| **References** | [`EMPIREAI_COCKPIT_ARCHITECTURE.md`](../architecture/EMPIREAI_COCKPIT_ARCHITECTURE.md) (P3-03) · [`PROJECT_COCKPIT_SPECIFICATION.md`](../architecture/PROJECT_COCKPIT_SPECIFICATION.md) · UID |
| **Status** | Active (P3-03 canonical architecture) |
| **Status** | Active |

---

### Commerce

| Field | Content |
|-------|---------|
| **Official Definition** | The **constitutional business execution layer** — manufactures, operates, monitors, and improves businesses under Commerce Canon and Pillow stewardship. |
| **Purpose** | Execute commercial operations under intelligence and approval — not UI. |
| **Owner** | Pillow · Grand King (irreversibles) |
| **Related Terms** | Business Engine · Brain · CBD · Production · Grand King Acceptance |
| **Usage Rules** | Commerce ≠ Cockpit. Irreversible commercial actions require **Grand King Acceptance**. |
| **Examples** | "List product" flows: Commerce module → Brain → approval queue in Cockpit. |
| **References** | [`EMPIREAI_COMMERCE_ARCHITECTURE.md`](../architecture/EMPIREAI_COMMERCE_ARCHITECTURE.md) (P3-05) · `EMPIREAI_COMMERCE_CANON.md` · CBD |
| **Status** | Active (P3-05 canonical architecture) |

---

### CON Mission (Constitutional Execution Task)

| Field | Content |
|-------|---------|
| **Official Definition** | A locked constitutional task **CON-###** in P1–P9 programme — defines readiness, not engineering alone. |
| **Purpose** | Sequence constitutional documentation and governance baseline. |
| **Owner** | Grand King · Chief Architect |
| **Related Terms** | Roadmap · Constitution Lock · REAL Mission · Programme |
| **Usage Rules** | CON-001–019 immutable. New tasks append CON-020+. Never reuse IDs. |
| **Examples** | **CON-001** authored Vision; **P1-08** completes Glossary outside CON register as Identity Foundation item. |
| **References** | [`EMPIREAI_CONSTITUTION_LOCK.md`](./EMPIREAI_CONSTITUTION_LOCK.md) |
| **Status** | Active |

---

### Constitution (Qualified)

| Field | Content |
|-------|---------|
| **Official Definition** | **WHAT MUST BE TRUE** — governing law. Always qualified: **Commercial Constitution (CTD)**, **Engineering Constitution**, **Pillow Constitution**, etc. |
| **Purpose** | Bind all missions and runtime behaviour to explicit law. |
| **Owner** | Grand King (CTD apex) · Chief Architect (domain constitutions) |
| **Related Terms** | Doctrine · Vision · Soul · Governance · Hierarchy Tier 3 |
| **Usage Rules** | **Forbidden:** bare "Constitution." CTD overrides Vision and Soul on commercial conflict. |
| **Examples** | "Per **Commercial Constitution** CTD-005, intelligence precedes action." |
| **References** | [`EMPIREAI_CONSTITUTION_HIERARCHY.md`](./EMPIREAI_CONSTITUTION_HIERARCHY.md) · [`EMPIREAI_CORE_CONSTITUTION_CTD.md`](../../EMPIREAI_CORE_CONSTITUTION_CTD.md) (P2-02) · [`EMPIREAI_NAMING_STANDARD.md`](./EMPIREAI_NAMING_STANDARD.md) §3.4 |
| **Status** | Active |

---

### Constitution Hierarchy

| Field | Content |
|-------|---------|
| **Official Definition** | The permanent **constitutional document authority map** (Tiers 0–7) — who governs what law, doctrine, roadmap, and governance artifact; distinct from platform component hierarchy. |
| **Purpose** | One apex governance map — authority, inheritance, dependency, precedence, ownership, citation. |
| **Owner** | Chief Architect (maintainer) · Grand King (sovereignty) |
| **Related Terms** | Hierarchy · Constitution · Governance · CTD · Precedence |
| **Usage Rules** | On law/document conflicts, Constitution Hierarchy wins over platform hierarchy. Higher tier prevails. |
| **Examples** | "Vision (Tier 2) prevails over Canonical Architecture (Tier 5) on purpose conflicts." |
| **References** | [`EMPIREAI_CONSTITUTION_HIERARCHY.md`](./EMPIREAI_CONSTITUTION_HIERARCHY.md) (P2-01 · CON-004) |
| **Status** | Active |

---

### Engineering Constitution

| Field | Content |
|-------|---------|
| **Official Definition** | Permanent **HOW** law — Brain · Guardian · Builder · mission lifecycle · acceptance · Cursor governance. Subordinate to CTD commercially. |
| **Purpose** | Single engineering authority for all implementation and deployment. |
| **Owner** | Chief Architect |
| **Related Terms** | Constitution (Qualified) · Brain · Guardian · Builder · Cursor Output Standard |
| **Usage Rules** | Canonical path: `EMPIREAI_CONSTITUTION.md` only — no fork. CON-015 maps here. |
| **Examples** | "Per **Engineering Constitution** Art. I, dispatch routes through Brain." |
| **References** | [`EMPIREAI_CONSTITUTION.md`](../../EMPIREAI_CONSTITUTION.md) (P2-03 · CON-015) |
| **Status** | Active (P2-03 ratified) |

---

### Documentation

| Field | Content |
|-------|---------|
| **Official Definition** | All repository artifacts classified under ECDS-1 — Canonical, Operational, Evidence, Historical, Stub — navigated from Master Index. |
| **Purpose** | Single documentation system — no competing truth at same tier. |
| **Owner** | Chief Architect (canonical class) · per-doc maintainers |
| **Related Terms** | Canonical · Operational · Evidence · Journey · Repository |
| **Usage Rules** | Classify before cite. Evidence never becomes law silently. |
| **Examples** | P1 glossary is **Canonical** Tier 4 Governance plane. |
| **References** | `docs/audits/canonical-documentation/01_CANONICAL_DOCUMENT_SYSTEM.md` |
| **Status** | Active |

---

### Doctrine

| Field | Content |
|-------|---------|
| **Official Definition** | An immutable numbered principle in a doctrine module — e.g. **CTD-###**, **GVD-###**, **CBD-###**. |
| **Purpose** | Atomic commercial and governance law — citeable units. |
| **Owner** | Grand King (CTD/CBD) · Chief Architect (ACD) |
| **Related Terms** | Constitution · ADR · Vision |
| **Usage Rules** | Doctrine IDs in law citations; expand doctrine name on first Grand King-facing use. |
| **Examples** | **CTD-017** — never pretend live integrations exist. |
| **References** | [`EMPIREAI_CORE_CONSTITUTION_CTD.md`](../../EMPIREAI_CORE_CONSTITUTION_CTD.md) (P2-02 ratified) · [`EMPIREAI_DOCTRINE_SYSTEM.md`](./EMPIREAI_DOCTRINE_SYSTEM.md) (P2-04) · foundation modules |
| **Status** | Active |

---

### Doctrine System

| Field | Content |
|-------|---------|
| **Official Definition** | The permanent **apex registry** for all specialised domain doctrines — catalogue · hierarchy · lifecycle · ownership (P2-04). |
| **Purpose** | One map for every doctrine; no duplicate domain authority. |
| **Owner** | Chief Architect (maintainer) · Grand King (foundation doctrines) |
| **Related Terms** | Doctrine · Constitution · CTD · GVD · CBD · UID · ACD |
| **Usage Rules** | Register new doctrines here before publication. Doctrines support — never replace — CTD. |
| **Examples** | "Per **Doctrine System** §5, CRI Doctrine gates launch." |
| **References** | [`EMPIREAI_DOCTRINE_SYSTEM.md`](./EMPIREAI_DOCTRINE_SYSTEM.md) (P2-04) |
| **Status** | Active (P2-04) |

---

### Architecture Law

| Field | Content |
|-------|---------|
| **Official Definition** | Permanent **Tier 5 constitutional governance** for how architecture is created, evolved, validated, protected from drift, and accepted (P2-05). |
| **Purpose** | One architecture authority process — distinct from normative structure (Canonical Architecture) and constraints (ACD). |
| **Owner** | Chief Architect |
| **Related Terms** | Architecture · ACD · Canonical Architecture · Development Doctrine · ADR |
| **Usage Rules** | Canonical Architecture = WHAT should be; Architecture Law = HOW governed. No competing architecture authorities. |
| **Examples** | "Per **Architecture Law** §8, drift classified Temporary until ADR merges." |
| **References** | [`EMPIREAI_ARCHITECTURE_LAW.md`](../architecture/EMPIREAI_ARCHITECTURE_LAW.md) (P2-05) |
| **Status** | Active (P2-05 ratified) |

---

### Documentation Law

| Field | Content |
|-------|---------|
| **Official Definition** | Permanent **Tier 5 constitutional governance** for how every document is classified, owned, placed, traced, revised, and retired — ratifies **ECDS-1** (P2-06). |
| **Purpose** | One documentation authority — documentation preserves truth; never competes with law bodies or evidence. |
| **Owner** | Chief Architect |
| **Related Terms** | ECDS · Master Index · Repository Structure · Classification · Traceability |
| **Usage Rules** | Documentation = constitutional knowledge, not evidence or implementation. Every document: one owner · one purpose · one location · one classification. |
| **Examples** | "Per **Documentation Law** §4, audit packs are **EVIDENCE** — proof only, never law." |
| **References** | [`EMPIREAI_DOCUMENTATION_LAW.md`](./EMPIREAI_DOCUMENTATION_LAW.md) (P2-06) |
| **Status** | Active (P2-06 ratified · ECDS-1) |

---

### EmpireAI

| Field | Content |
|-------|---------|
| **Official Definition** | An **Intelligence Platform** that **manufactures companies** — the governed platform entity at Hierarchy **Tier 2**. |
| **Purpose** | Name the whole empire — factory for governed commercial organisms. |
| **Owner** | Grand King · jointly stewarded by Chief Architect + Pillow |
| **Related Terms** | Vision · Soul · Pillow · Brain · Automation |
| **Usage Rules** | Not an automation product, demo AI, or generic "OS" without context. |
| **Examples** | "**EmpireAI** holds repository continuity so the Grand King decides informed." |
| **References** | [`EMPIREAI_VISION.md`](../../EMPIREAI_VISION.md) · CTD-001 · CTD-005 |
| **Status** | Active |

---

### Evidence

| Field | Content |
|-------|---------|
| **Official Definition** | ECDS-1 / Documentation Law classification: immutable proof of a point-in-time state — **never law**. |
| **Purpose** | Audit trail · executive audits · PROOF artifacts. |
| **Owner** | Grand King · Chief Architect (archive) |
| **Related Terms** | Historical · Canonical · PROOF · Audit · Vision Accumulation (HE class) |
| **Usage Rules** | Do not cite Evidence as current governing truth. Register links only for HE accumulation. |
| **Examples** | `COMBINED_EXECUTIVE_AUDIT_REAL-071-100` is **Evidence**. |
| **References** | ECDS-1 · [`EMPIREAI_VISION_ACCUMULATION.md`](./EMPIREAI_VISION_ACCUMULATION.md) |
| **Status** | Active |

---

### Governance

| Field | Content |
|-------|---------|
| **Official Definition** | The Tier 4 plane of policies and frameworks that govern how EmpireAI authors missions, syncs Vision, accumulates lessons, owns components, names terms, and places them in hierarchy. |
| **Purpose** | Coherent constitutional execution without redesign each mission. |
| **Owner** | Chief Architect · Grand King (approval) |
| **Related Terms** | Constitutional Framework · P1-01→P1-09 · Mission Generation |
| **Usage Rules** | "Governance" refers to P-era docs in `docs/governance/` unless qualified (e.g. "cost governance"). |
| **Examples** | P1 Identity Foundation is **Governance** authoring sequence. |
| **References** | [`EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md`](./EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md) |
| **Status** | Active |

---

### Grand King

| Field | Content |
|-------|---------|
| **Official Definition** | Platform Owner — sole operational account until **MS-B** — final approval authority on irreversibles, Vision sign-off, Soul ownership, CTD apex. |
| **Purpose** | Human sovereignty — EmpireAI amplifies, never replaces, executive judgment. |
| **Owner** | Self (Tier 0 — not a subsystem) |
| **Related Terms** | Grand King Acceptance · Vision · Soul · Cockpit · GVD |
| **Usage Rules** | Do not substitute "admin", "user", or "founder" when meaning sovereign operator. |
| **Examples** | "**Grand King** approves Permanent Vision amendments." |
| **References** | [`EMPIREAI_SOUL.md`](../../EMPIREAI_SOUL.md) §4.1 · ADR-016 · GVD-001 |
| **Status** | Active |

---

### Grand King Acceptance

| Field | Content |
|-------|---------|
| **Official Definition** | Explicit sovereign sign-off by the Grand King that an irreversible commercial, constitutional, or identity action may proceed or is complete. |
| **Purpose** | Final human gate — CTD · GVD · CBD irreversibles. |
| **Owner** | Grand King |
| **Related Terms** | Acceptance · PROOF · Vision (PV class) · Production Acceptance |
| **Usage Rules** | Required for PV Vision updates, commercial commits, scope expansion, production policy shifts. |
| **Examples** | "Awaiting **Grand King Acceptance** on MS-A channel decision." |
| **References** | GVD · [`EMPIREAI_OWNERSHIP_MODEL.md`](./EMPIREAI_OWNERSHIP_MODEL.md) §8.5 |
| **Status** | Active |

---

### Guardian

| Field | Content |
|-------|---------|
| **Official Definition** | Pre-dispatch fail-safe inside the Brain path — assesses payloads before orchestrator execution when enabled. |
| **Purpose** | Fail-safe doctrine — block destructive or integrity-failing dispatch. |
| **Owner** | Pillow |
| **Related Terms** | Brain · Automation · Engineering Constitution |
| **Usage Rules** | Guardian is not a standalone orchestrator or Tier-1 authority. |
| **Examples** | "Guardian blocked dispatch — Pillow escalates to Grand King." |
| **References** | ADR-004 · Engineering Constitution |
| **Status** | Active |

---

### Hierarchy

| Field | Content |
|-------|---------|
| **Official Definition** | The permanent **structural** tier tree (Tiers 0–6) defining exactly **one parent** per component — not ownership, not implementation. |
| **Purpose** | Eliminate ambiguity about where every subsystem belongs. |
| **Owner** | Grand King · Chief Architect (maintainer) |
| **Related Terms** | Ownership · EmpireAI · Governance · Constitution Hierarchy · [`EMPIREAI_HIERARCHY.md`](./EMPIREAI_HIERARCHY.md) |
| **Usage Rules** | Hierarchy ≠ Ownership. **Platform hierarchy** (P1-06) ≠ **Constitution Hierarchy** (P2-01). Cite the correct map. |
| **Examples** | "Brain is **Tier 5** under EmpireAI; Pillow **owns** Brain." · "Vision is **Tier 2** in Constitution Hierarchy." |
| **References** | [`EMPIREAI_HIERARCHY.md`](./EMPIREAI_HIERARCHY.md) (P1-06) · [`EMPIREAI_CONSTITUTION_HIERARCHY.md`](./EMPIREAI_CONSTITUTION_HIERARCHY.md) (P2-01) |
| **Status** | Active |

---

### Historical

| Field | Content |
|-------|---------|
| **Official Definition** | ECDS-1 classification: superseded artifact — **zero authority** as current truth. |
| **Purpose** | Preserve past design without governing present. |
| **Owner** | Chief Architect (labelling) |
| **Related Terms** | Evidence · Canonical · Documentation |
| **Usage Rules** | Do not cite Historical as law. Blueprints may be Historical while Canonical Architecture governs. |
| **Examples** | `docs/SYSTEM_ARCHITECTURE.md` cluster is **Historical**. |
| **References** | ECDS-1 · ADR-019 |
| **Status** | Active |

---

### HOW

| Field | Content |
|-------|---------|
| **Official Definition** | The reasoning link describing **how** work is shaped and executed — architecture, constitution execution law, implementation path. |
| **Purpose** | Third link in WHY→WHAT→HOW→PROOF — connects programme to systems. |
| **Owner** | Chief Architect (normative HOW) · Pillow (runtime HOW) |
| **Related Terms** | WHAT · WHY · PROOF · Architecture · Brain |
| **Usage Rules** | HOW must trace to Canonical Architecture + applicable constitution; HOW alone never starts a mission. |
| **Examples** | "HOW: Brain debounced SQLite persist per Engineering Constitution." |
| **References** | [`EMPIREAI_REASONING_MODEL.md`](./EMPIREAI_REASONING_MODEL.md) |
| **Status** | Active |

---

### Journey

| Field | Content |
|-------|---------|
| **Official Definition** | Append-only structural register of what exists and programme progress — `JOURNEY.md` with audit in `JOURNEY_AUDIT.md`. |
| **Purpose** | Repository continuity for "where we are" — never silent row deletion. |
| **Owner** | Grand King (structural rows) · Chief Architect (integrity) |
| **Related Terms** | Repository · Soul · Roadmap · Documentation |
| **Usage Rules** | Journey is operational/programme truth — not copied into Soul body. BL-B: Journey First. |
| **Examples** | "Add JOURNEY_AUDIT entry for P1-08 Glossary row." |
| **References** | [`JOURNEY.md`](../../JOURNEY.md) · [`EMPIREAI_SOUL.md`](../../EMPIREAI_SOUL.md) §13 |
| **Status** | Active |

---

### Knowledge

| Field | Content |
|-------|---------|
| **Official Definition** | Organizational memory systems — EKLS, Executive Intelligence library (EI0–EI10), Soul runtime mirror — Hierarchy **Tier 4**. |
| **Purpose** | Compound judgment across missions — not chat history. |
| **Owner** | Pillow |
| **Related Terms** | Soul · Documentation · Brain · Pillow |
| **Usage Rules** | Knowledge ≠ conversation logs. EKLS spec is normative for memory shape. |
| **Examples** | "Brain assembles context from **Knowledge** plane via EKLS." |
| **References** | `CANONICAL_EKLS_SPECIFICATION.md` · [`EMPIREAI_HIERARCHY.md`](./EMPIREAI_HIERARCHY.md) |
| **Status** | Active |

---

### Mission

| Field | Content |
|-------|---------|
| **Official Definition** | A bounded work unit with explicit WHY→WHAT→HOW→PROOF — identified by REAL/CON/PILLOW ID or named constitutional brief. |
| **Purpose** | Traceable unit of change — no unscoped implementation. |
| **Owner** | Grand King (approval) · Pillow (supervision) · Chief Architect (design) |
| **Related Terms** | REAL Mission · CON Mission · Programme · Acceptance |
| **Usage Rules** | No implementation before Vision Synchronization chain completes. |
| **Examples** | "P1-08 **Mission** completes Glossary — PROOF: file + cross-refs." |
| **References** | [`EMPIREAI_MISSION_GENERATION_POLICY.md`](./EMPIREAI_MISSION_GENERATION_POLICY.md) |
| **Status** | Active |

---

### Operational

| Field | Content |
|-------|---------|
| **Official Definition** | ECDS-1 classification: current implementation truth — what runs or is maintained now. |
| **Purpose** | Distinguish live state from normative law. |
| **Owner** | Chief Architect · domain maintainers |
| **Related Terms** | Canonical · Production · EMPIREAI_STATUS · Operational Architecture Guide |
| **Usage Rules** | Operational docs may lag Canonical Architecture — gap is technical debt, not silent override. |
| **Examples** | `docs/ARCHITECTURE.md` is **Operational**; Canonical Architecture is **Canonical**. |
| **References** | ECDS-1 |
| **Status** | Active |

---

### Pillow

| Field | Content |
|-------|---------|
| **Official Definition** | **Chief Operating Intelligence (COI)** — strategic advisor, mission author, Builder supervisor, Soul/Vision steward, owner of runtime technical subsystems. |
| **Purpose** | Operating intelligence at the center — Pillow-owned → Brain-executed → Cockpit-operated. |
| **Owner** | Grand King (sovereignty) · Pillow COI (stewardship) |
| **Related Terms** | Supervisor · Brain · Builder · Vision Synchronization · Vision Accumulation |
| **Usage Rules** | Canonical name only (ADR-017). Not generic "assistant." |
| **Examples** | "**Pillow** recommends; **Grand King** approves." |
| **References** | [`EMPIREAI_PILLOW_ARCHITECTURE.md`](../architecture/EMPIREAI_PILLOW_ARCHITECTURE.md) (P3-02) · [`EMPIREAI_PILLOW_CONSTITUTION.md`](../../EMPIREAI_PILLOW_CONSTITUTION.md) · ADR-017 |
| **Status** | Active (P3-02 canonical architecture) |

---

### Production

| Field | Content |
|-------|---------|
| **Official Definition** | The deployed live environment and its operational truth — Tier 5 — distinct from simulation and dev. |
| **Purpose** | Where commercial proof (PROOF-001, MS-A) must eventually occur honestly. |
| **Owner** | Grand King |
| **Related Terms** | Production Truth · Runtime · Production Acceptance · Cockpit |
| **Usage Rules** | Never conflate with seed data or simulation. CTD-017–019 honesty rules apply. |
| **Examples** | "`EMPIREAI_STATUS.md` describes **Production** state." |
| **References** | [`EMPIREAI_OWNERSHIP_MODEL.md`](./EMPIREAI_OWNERSHIP_MODEL.md) · deployment docs |
| **Status** | Active |

---

### Production Acceptance

| Field | Content |
|-------|---------|
| **Official Definition** | Validation that a production deploy or production policy change meets Production Truth, deployment doctrine, and Grand King criteria for live operation. |
| **Purpose** | Gate live irreversibles — separate from repository merge acceptance. |
| **Owner** | Grand King · Chief Architect (policy) · DevOps (execution proof) |
| **Related Terms** | Production · Production Truth · Grand King Acceptance · PROOF |
| **Usage Rules** | Required before unauthorized production deploys and P5–P6 policy changes. |
| **Examples** | "REAL-127 passed tests (**Repository Acceptance**); deploy awaits **Production Acceptance**." |
| **References** | Constitution Lock P5–P6 · deployment/MANAGED_DEPLOYMENT.md |
| **Status** | Active |

---

### Production Truth

| Field | Content |
|-------|---------|
| **Official Definition** | Canonical doctrine defining operational reality — [`EMPIREAI_PRODUCTION_TRUTH.md`](./EMPIREAI_PRODUCTION_TRUTH.md) (P1-10) plus Operational companion [`EMPIREAI_STATUS.md`](../../EMPIREAI_STATUS.md). |
| **Purpose** | Honest live surface; truth hierarchy; triple acceptance — assumptions separated from facts. |
| **Owner** | Grand King · Chief Architect |
| **Related Terms** | Production · Operational · Production Acceptance · CON-007–009 |
| **Usage Rules** | Doctrine is **Canonical**; STATUS is **Operational** snapshot — cite both for live state. |
| **Examples** | "Mission incomplete until Repository + Production + Grand King Acceptance — Production Truth §6." |
| **References** | [`EMPIREAI_PRODUCTION_TRUTH.md`](./EMPIREAI_PRODUCTION_TRUTH.md) · CON-009 |
| **Status** | Active (P1-10) — CON-007/008 operational detail pending P5 |

---

### Programme

| Field | Content |
|-------|---------|
| **Official Definition** | A bounded body of work with roadmap authority — e.g. Constitutional Execution P1–P9, V1 Bible, gate programmes G2–G8. |
| **Purpose** | Sequence work at Tier 4 without replacing Vision. |
| **Owner** | Grand King · Chief Architect |
| **Related Terms** | Roadmap · Mission · CON Mission · Journey |
| **Usage Rules** | Programme ≠ ad-hoc chat task list. Name with "**Programme**" suffix when formal. |
| **Examples** | "Constitutional Execution **Programme** P1 Identity Foundation." |
| **References** | [`EMPIREAI_ROADMAP_HIERARCHY.md`](./EMPIREAI_ROADMAP_HIERARCHY.md) |
| **Status** | Active |

---

### PROOF

| Field | Content |
|-------|---------|
| **Official Definition** | The fourth reasoning link — verifiable evidence that WHAT was done HOW achieved the declared WHY — commits, tests, audits, Grand King sign-off. |
| **Purpose** | Close missions; gate Vision Accumulation (no PROOF → no PV). |
| **Owner** | Mission owner submits · Pillow validates · Grand King for irreversibles |
| **Related Terms** | WHY · WHAT · HOW · Acceptance · Evidence |
| **Usage Rules** | PROOF must be citeable artifact — not assertion. Missing PROOF blocks accumulation PV class. |
| **Examples** | "PROOF: `EMPIREAI_GLOSSARY.md` created + cross-refs in Framework index." |
| **References** | [`EMPIREAI_REASONING_MODEL.md`](./EMPIREAI_REASONING_MODEL.md) · [`EMPIREAI_VISION_ACCUMULATION.md`](./EMPIREAI_VISION_ACCUMULATION.md) |
| **Status** | Active |

---

### REAL Mission

| Field | Content |
|-------|---------|
| **Official Definition** | Engineering execution mission **REAL-###** — Repository Empire Architecture Layer — runtime, Cockpit, Brain, repository work. |
| **Purpose** | Traceable implementation IDs — not a product brand. |
| **Owner** | Grand King (approval) · Pillow (supervision) |
| **Related Terms** | CON Mission · Builder · Repository Acceptance |
| **Usage Rules** | REAL in mission IDs and registers only — never "REAL product." |
| **Examples** | "**REAL-078** authored Canonical Architecture." |
| **References** | [`EMPIREAI_NAMING_STANDARD.md`](./EMPIREAI_NAMING_STANDARD.md) §5.3 · Roadmap Hierarchy §5 |
| **Status** | Active |

---

### Repository

| Field | Content |
|-------|---------|
| **Official Definition** | The git-managed artifact store — permanent memory of EmpireAI — including Canonical docs, code, Journey, evidence; **not** chat history. |
| **Purpose** | Continuity anchor — Repository First doctrine (BL-A/BL-B). |
| **Owner** | Grand King · Chief Architect (structure) · Pillow + Builder (sync) |
| **Related Terms** | Journey · Soul · Documentation · Repository Acceptance |
| **Usage Rules** | Truth lives in repository; sessions are ephemeral. |
| **Examples** | "BL-A **Repository** Synchronization refreshes Soul and Journey." |
| **References** | [`EMPIREAI_SOUL.md`](../../EMPIREAI_SOUL.md) §13 · ADR-019 · [`EMPIREAI_REPOSITORY_STRUCTURE.md`](./EMPIREAI_REPOSITORY_STRUCTURE.md) (P1-09) |
| **Status** | Active |

---

### Repository Acceptance

| Field | Content |
|-------|---------|
| **Official Definition** | Validation that repository changes meet mission scope — tests pass, docs updated, Journey/audit rules satisfied, ready for merge or tag. |
| **Purpose** | Gate code/docs truth before production promotion. |
| **Owner** | Pillow (supervisor) · Chief Architect (constitutional missions) |
| **Related Terms** | Acceptance · PROOF · Builder · Production Acceptance |
| **Usage Rules** | Distinct from Production Acceptance — merge ≠ deploy. |
| **Examples** | "Mission achieves **Repository Acceptance** when glossary cross-refs verified." |
| **References** | [`EMPIREAI_SUPERVISOR_GOVERNANCE.md`](./EMPIREAI_SUPERVISOR_GOVERNANCE.md) · Cursor Output Standard |
| **Status** | Active |

---

### Roadmap

| Field | Content |
|-------|---------|
| **Official Definition** | WHAT NEXT — programme sequencing: Master Roadmap, Constitution Lock P1–P9, domain roadmaps — Hierarchy **Tier 3**, subordinate to Vision. |
| **Purpose** | Order work without replacing WHY. |
| **Owner** | Grand King · Chief Architect (maintainer) |
| **Related Terms** | Roadmap Item · Programme · CON Mission · WHAT |
| **Usage Rules** | Roadmap never overrides Vision or CTD. Locked CON IDs immutable. |
| **Examples** | "`EMPIREAI_CONSTITUTION_LOCK.md` is constitutional **Roadmap** law." |
| **References** | [`EMPIREAI_ROADMAP_HIERARCHY.md`](./EMPIREAI_ROADMAP_HIERARCHY.md) |
| **Status** | Active |

---

### Roadmap Item

| Field | Content |
|-------|---------|
| **Official Definition** | A single sequenced entry in a roadmap register — e.g. one CON-### row, REAL-### objective, P1-## Identity item. |
| **Purpose** | Atomic unit of programme tracking. |
| **Owner** | Per roadmap owner |
| **Related Terms** | Roadmap · Mission · Programme |
| **Usage Rules** | Not an unscoped todo — must link to WHY and proof plan. |
| **Examples** | "**P1-08** is a Roadmap Item in Identity Foundation." |
| **References** | [`EMPIREAI_NAMING_STANDARD.md`](./EMPIREAI_NAMING_STANDARD.md) |
| **Status** | Active |

---

### Runtime

| Field | Content |
|-------|---------|
| **Official Definition** | The live process plane — Pillow host, Brain process, Redis, SQLite, async workers — Tier 5. |
| **Purpose** | Distinguish running processes from documents and law. |
| **Owner** | Pillow |
| **Related Terms** | Brain · Production · Guardian |
| **Usage Rules** | Runtime ≠ entire EmpireAI. Do not store runtime logs in Soul. |
| **Examples** | "Event-loop health is **Runtime** observability — cite STATUS, not Soul." |
| **References** | [`EMPIREAI_HIERARCHY.md`](./EMPIREAI_HIERARCHY.md) Tier 5 |
| **Status** | Active |

---

### Soul

| Field | Content |
|-------|---------|
| **Official Definition** | **WHO** — permanent continuity and memory — identity, promises, constitutional decision summaries, never-forget anchors — `EMPIREAI_SOUL.md`, Tier 3. |
| **Purpose** | Preserve empire identity across years; constrain Vision amendments. |
| **Owner** | Grand King · Pillow (steward) · Chief Architect (co-maintain) |
| **Related Terms** | Vision · Repository · Journey · Knowledge |
| **Usage Rules** | Soul is not WHY (Vision), law (Constitution), or live metrics. Brain reads; only approved process writes. |
| **Examples** | "MS-A promise lives in **Soul** §4.6 and Vision §2." |
| **References** | [`EMPIREAI_SOUL.md`](../../EMPIREAI_SOUL.md) (P1-04) |
| **Status** | Active |

---

### Supervisor

| Field | Content |
|-------|---------|
| **Official Definition** | The Pillow COI **role** that continually supervises Builder — checkpoints, recovery, drift detection — Tier 5 hierarchy slot, not a separate platform. |
| **Purpose** | Mandatory oversight on engineering and governance missions. |
| **Owner** | Pillow |
| **Related Terms** | Pillow · Builder · Mission · Governance |
| **Usage Rules** | Supervisor = Pillow function. Not Tier-1 peer to Pillow. |
| **Examples** | "**Supervisor** requests Current State at mission start." |
| **References** | [`EMPIREAI_SUPERVISOR_GOVERNANCE.md`](./EMPIREAI_SUPERVISOR_GOVERNANCE.md) |
| **Status** | Active |

---

### Vision

| Field | Content |
|-------|---------|
| **Official Definition** | **WHY** — highest identity intent — canonical purpose and mission — `EMPIREAI_VISION.md`, Tier 3. |
| **Purpose** | North star for every mission — manufacture companies, MS-A, intelligence not automation. |
| **Owner** | Grand King |
| **Related Terms** | Soul · Vision Synchronization · Vision Accumulation · WHY |
| **Usage Rules** | Vision explains WHY only — not HOW or implementation. PV amendments need Grand King Acceptance. |
| **Examples** | "Every mission cites **Vision** alignment paragraph first." |
| **References** | [`EMPIREAI_VISION.md`](../../EMPIREAI_VISION.md) (P1-01) |
| **Status** | Active |

---

### Vision Accumulation

| Field | Content |
|-------|---------|
| **Official Definition** | Post-mission lifecycle that evaluates lessons for permanent Vision or principle updates — classified PV/EP/BP/AP/OP/HE/RI/DI. |
| **Purpose** | Ensure Vision is never static; compound WHY from validated PROOF. |
| **Owner** | Pillow (steward) · Grand King (PV) |
| **Related Terms** | Vision · PROOF · Soul · Accumulation Register |
| **Usage Rules** | Runs after PROOF. PV amends Vision only with GK. BP may append Soul. |
| **Examples** | "Production incident → OP class, not PV, unless GK elevates." |
| **References** | [`EMPIREAI_VISION_ACCUMULATION.md`](./EMPIREAI_VISION_ACCUMULATION.md) (P1-03) |
| **Status** | Active |

---

### Vision Synchronization

| Field | Content |
|-------|---------|
| **Official Definition** | Mandatory mission-start chain: Vision → Soul → Roadmap → Hierarchy → Mission Context → Mission Generation. |
| **Purpose** | Prevent implementation before identity and programme alignment. |
| **Owner** | Pillow (verify) · Builder (execute read) |
| **Related Terms** | Vision · Soul · Hierarchy · Mission |
| **Usage Rules** | No implementation until chain completes. Output: alignment statements. |
| **Examples** | "Step 1 **Vision Synchronization** before REAL code changes." |
| **References** | [`EMPIREAI_VISION_SYNCHRONIZATION_POLICY.md`](./EMPIREAI_VISION_SYNCHRONIZATION_POLICY.md) |
| **Status** | Active |

---

### WHAT

| Field | Content |
|-------|---------|
| **Official Definition** | The reasoning link for **what** is in scope — roadmap slot, CON/REAL ID, programme boundaries. |
| **Purpose** | Second link in WHY→WHAT→HOW→PROOF — bounded programme intent. |
| **Owner** | Grand King · Chief Architect |
| **Related Terms** | WHY · HOW · Roadmap · Mission |
| **Usage Rules** | WHAT subordinate to WHY; must cite roadmap or CON register. |
| **Examples** | "WHAT: P1-08 deliver `EMPIREAI_GLOSSARY.md`." |
| **References** | [`EMPIREAI_REASONING_MODEL.md`](./EMPIREAI_REASONING_MODEL.md) |
| **Status** | Active |

---

### WHY

| Field | Content |
|-------|---------|
| **Official Definition** | The reasoning link for **why** work exists — drawn from Vision, Soul constraints, and CTD alignment. |
| **Purpose** | First link in WHY→WHAT→HOW→PROOF — no mission without purpose. |
| **Owner** | Grand King (Vision) |
| **Related Terms** | Vision · Soul · WHAT · Vision Accumulation (PV) |
| **Usage Rules** | Every mission brief starts with WHY paragraph citing Vision. |
| **Examples** | "WHY: P1 Identity Foundation — official language eliminates ambiguity." |
| **References** | [`EMPIREAI_VISION.md`](../../EMPIREAI_VISION.md) · [`EMPIREAI_REASONING_MODEL.md`](./EMPIREAI_REASONING_MODEL.md) |
| **Status** | Active |

---

## 4. Alphabetical Index

| Term | § Entry |
|------|---------|
| Acceptance | [Acceptance](#acceptance) |
| ADR | [ADR](#adr-architecture-decision-record) |
| Architecture | [Architecture](#architecture) |
| Automation | [Automation](#automation) |
| Brain | [Brain](#brain) |
| Builder | [Builder](#builder) |
| Business Engine | [Business Engine](#business-engine) |
| Canonical | [Canonical](#canonical) |
| Chief Architect | [Chief Architect](#chief-architect) |
| Cockpit | [Cockpit](#cockpit) |
| Commerce | [Commerce](#commerce) |
| CON Mission | [CON Mission](#con-mission-constitutional-execution-task) |
| Constitution (Qualified) | [Constitution](#constitution-qualified) |
| Documentation | [Documentation](#documentation) |
| Doctrine | [Doctrine](#doctrine) |
| EmpireAI | [EmpireAI](#empireai) |
| Evidence | [Evidence](#evidence) |
| Governance | [Governance](#governance) |
| Grand King | [Grand King](#grand-king) |
| Grand King Acceptance | [Grand King Acceptance](#grand-king-acceptance) |
| Guardian | [Guardian](#guardian) |
| Hierarchy | [Hierarchy](#hierarchy) |
| Historical | [Historical](#historical) |
| HOW | [HOW](#how) |
| Journey | [Journey](#journey) |
| Knowledge | [Knowledge](#knowledge) |
| Mission | [Mission](#mission) |
| Operational | [Operational](#operational) |
| Pillow | [Pillow](#pillow) |
| Production | [Production](#production) |
| Production Acceptance | [Production Acceptance](#production-acceptance) |
| Production Truth | [Production Truth](#production-truth) |
| Programme | [Programme](#programme) |
| PROOF | [PROOF](#proof) |
| REAL Mission | [REAL Mission](#real-mission) |
| Repository | [Repository](#repository) |
| Repository Acceptance | [Repository Acceptance](#repository-acceptance) |
| Roadmap | [Roadmap](#roadmap) |
| Roadmap Item | [Roadmap Item](#roadmap-item) |
| Runtime | [Runtime](#runtime) |
| Soul | [Soul](#soul) |
| Supervisor | [Supervisor](#supervisor) |
| Vision | [Vision](#vision) |
| Vision Accumulation | [Vision Accumulation](#vision-accumulation) |
| Vision Synchronization | [Vision Synchronization](#vision-synchronization) |
| WHAT | [WHAT](#what) |
| WHY | [WHY](#why) |

---

## 5. Cross References — P1 Identity Foundation

| P1 Item | Artifact | Glossary anchor terms |
|---------|----------|----------------------|
| P1-01 | `EMPIREAI_VISION.md` | Vision · WHY |
| P1-02 | `EMPIREAI_REASONING_MODEL.md` | WHY · WHAT · HOW · PROOF |
| P1-03 | `EMPIREAI_VISION_ACCUMULATION.md` | Vision Accumulation · Evidence |
| P1-04 | `EMPIREAI_SOUL.md` | Soul · Repository · Journey |
| P1-05 | `EMPIREAI_OWNERSHIP_MODEL.md` | Grand King · Pillow · Owner (see Ownership doc) |
| P1-06 | `EMPIREAI_HIERARCHY.md` | Hierarchy · EmpireAI tiers |
| P1-07 | `EMPIREAI_NAMING_STANDARD.md` | Naming rules — terms defined **here** |
| P1-08 | `EMPIREAI_GLOSSARY.md` | This document |
| P1-08 | `EMPIREAI_GLOSSARY.md` | Glossary · official terms |
| P1-09 | `EMPIREAI_REPOSITORY_STRUCTURE.md` | Repository · folder doctrine |
| P1-10 | `EMPIREAI_PRODUCTION_TRUTH.md` | Production Truth · triple acceptance |

---

## 6. Usage Examples

### Example 1 — Mission brief language

> **WHY:** Vision §2 MS-A probability. **WHAT:** P1-08 Glossary. **HOW:** ECDS Canonical doc in `docs/governance/`. **PROOF:** file + cross-refs + validation checklist.

### Example 2 — Disambiguate acceptance

> Builder achieved **Repository Acceptance** (tests + docs). **Production Acceptance** and **Grand King Acceptance** still required before live commercial action.

### Example 3 — Constitution cite

> Wrong: "The Constitution requires dashboards."  
> Right: "**Commercial Constitution** CTD-005 requires intelligence; **Cockpit** visualizes."

### Example 4 — Hierarchy vs ownership

> **Brain** is Tier **5** (**Hierarchy**). **Pillow** **owns** Brain (**Ownership**). **Brain** **executes** dispatch (**Runtime**).

---

## 7. Governance

| Role | Glossary duty |
|------|---------------|
| **Grand King** | Approve new terms affecting identity, promises, or commercial law |
| **Chief Architect** | Maintain glossary · resolve definition disputes · P1-08+ versions |
| **Pillow COI** | Flag terminology drift in missions · propose BP glossary notes via accumulation |
| **Builder** | Use glossary terms in constitutional docs · link new terms via ADR |
| **Governance maintainer** | Alphabetical index integrity · dedupe vs Naming Standard |

**Amendment:** CONSTITUTIONAL REVIEW + Grand King for changing **Official Definition** of anchor terms (Grand King, EmpireAI, Vision, Soul, MS-A). Append new entries for non-anchor terms.

**Relationship to Naming Standard:** Naming Standard §3 summaries remain valid; **conflicts resolve in favour of this Glossary** for meaning; Naming Standard for **creation rules**.

---

## 8. Future Expansion Rules

| Rule | Requirement |
|------|-------------|
| **E1** | New term: full eight-field entry + alphabetical index row |
| **E2** | Register abbreviation in Naming Standard §8 if abbreviated |
| **E3** | No synonym entries — cross-reference instead |
| **E4** | Tier 6 systems (ECC, VIE) get entries when CON resolves |
| **E5** | Business unit names manufactured by EmpireAI: commercial glossary appendix (future) — not mixed into constitutional core without GK |
| **E6** | Deprecated terms: Status → **Historical**; do not delete — point to replacement |

---

## 9. Validation Checklist

| Check | Status |
|-------|--------|
| Every required constitutional term has one definition | §3 · §4 |
| Agrees with Vision · Soul · Ownership · Hierarchy · Naming | §5 · per-entry References |
| Agrees with Architecture · Documentation · Roadmap | Entry cross-refs |
| No duplicated meaning | §2 G1–G2 |
| No circular definitions | §2 G3 |

---

## Revision History

| Version | Date | Authority | Change |
|---------|------|-----------|--------|
| 1.0.0 | 2026-07-05 | Grand King · P1-08 | Initial constitutional Glossary |

---

## Related

- [`EMPIREAI_NAMING_STANDARD.md`](./EMPIREAI_NAMING_STANDARD.md) (P1-07)  
- [`EMPIREAI_HIERARCHY.md`](./EMPIREAI_HIERARCHY.md) (P1-06)  
- [`EMPIREAI_OWNERSHIP_MODEL.md`](./EMPIREAI_OWNERSHIP_MODEL.md) (P1-05)  
- [`EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md`](./EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md)
