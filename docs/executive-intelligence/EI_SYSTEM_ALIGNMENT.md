# EI System Alignment

| Field | Value |
|-------|-------|
| **Constitutional Status** | Executive Intelligence System Alignment |
| **Authority** | Executive Intelligence · Grand King |
| **Version** | 1.0 |
| **Approval Status** | Canonical v1.0 (EIR-005) |
| **Effective Date** | 2026-06-21 |
| **Supersedes** | Partial stack definitions in prior architecture fragments |
| **Next Version** | — |

**Release:** EIR-005 · Constitutional System Alignment

---

## 1. Constitutional stack

```
King
  ↓
Executive Intelligence
  ↓
Pillow
  ↓
Brain
  ↓
Decision Engine
  ↓
Agents
  ↓
Connectors
  ↓
Internet
```

**Cross-cutting presentation layer:** Cockpit presents Executive Intelligence to the King. Cockpit is not a constitutional authority layer — it is an executive interface.

---

## 2. Layer definitions

### 2.1 King

| Dimension | Definition |
|-----------|------------|
| **Authority** | Sovereign constitutional authority. Final approval for irreversible executive and commercial decisions. Sole approver of Executive Intelligence amendments. |
| **Responsibilities** | Executive approval · strategic direction · constitutional ratification · go-live and live-commerce authorization when doctrine requires |
| **Boundaries** | The King does not execute computation, dispatch agents, or maintain operational intelligence artifacts. The King is not accountable for poor EmpireAI recommendation quality (see Pillow accountability). |
| **Accountability** | Accountable for sovereign decisions and approvals recorded in governance audit trails. Not accountable for EmpireAI preparation or recommendation quality. |

**EI companion:** [EI2 King's Operation Manual](./EI2_KINGS_OPERATION_MANUAL.md)

---

### 2.2 Executive Intelligence

| Dimension | Definition |
|-----------|------------|
| **Authority** | Constitutional intelligence layer governing EmpireAI reasoning, priorities, risk, opportunity, autonomy boundaries, and executive behaviour. Authority is **doctrinal** — not operational dispatch. |
| **Responsibilities** | Define how EmpireAI thinks · what it prioritizes · how it evaluates opportunity and risk · when it interrupts the King · when it remains autonomous · how it prepares recommendations · how it behaves |
| **Boundaries** | Executive Intelligence does not compute, dispatch, connect to external APIs, or self-modify without King-approved amendment. EI governs reasoning; it does not replace Brain execution. |
| **Accountability** | Accountable for constitutional clarity, consistency, and traceability across EI0–EI10. Amendment history recorded in [EI_AMENDMENT_HISTORY.md](./EI_AMENDMENT_HISTORY.md). |

**Library:** [EI0](./EI0_EXECUTIVE_INTELLIGENCE_CHARTER.md) · [EI1–EI10](./EI_INDEX.md) · [EXECUTIVE_INTELLIGENCE_MANIFEST.md](./EXECUTIVE_INTELLIGENCE_MANIFEST.md)

---

### 2.3 Pillow

| Dimension | Definition |
|-----------|------------|
| **Authority** | Executive Personality of EmpireAI. Applies Executive Intelligence. Constitutional custodian of EI execution — not constitutional author of EI doctrine. |
| **Responsibilities** | Execute according to EI1–EI10 · continuously research · continuously improve · measure itself · prepare amendment proposals · maintain Executive KPI · Memory · Lessons · never self-amend EI |
| **Boundaries** | Pillow shall not invent executive behaviour inconsistent with approved EI doctrine. Pillow shall not silently amend constitutional doctrine. Pillow does not bypass King approval for irreversible actions. |
| **Accountability** | EmpireAI is accountable for recommendation quality, preparation quality, intelligence quality, operational readiness quality, executive reporting quality, and continuous learning quality. See [PILLOW_EXECUTIVE_ACCOUNTABILITY.md](./PILLOW_EXECUTIVE_ACCOUNTABILITY.md). |

**Constitution:** [PILLOW_EXECUTIVE_CONSTITUTION.md](./PILLOW_EXECUTIVE_CONSTITUTION.md)

---

### 2.4 Brain

| Dimension | Definition |
|-----------|------------|
| **Authority** | Single orchestration and computation layer. Dispatches modules, agents, tools, and workflows within EI and governance constraints. |
| **Responsibilities** | Orchestrate autonomous action · route dispatch · execute module loads · coordinate LLM routing · enforce pre-dispatch governance hooks · persist operational state |
| **Boundaries** | Brain performs **computation** — it does not govern constitutional reasoning (EI) or sovereign approval (King). Brain does not bypass Decision Engine authority evaluation for gated actions. Frontend and Cockpit do not call external systems directly — Brain is the orchestration boundary. |
| **Accountability** | Accountable for correct orchestration, dispatch integrity, and module contract compliance. Not accountable for constitutional doctrine content (EI) or King approval decisions. |

**Repository companion:** `backend/src/brain/` · [EMPIREAI_CONSTITUTION.md](../../EMPIREAI_CONSTITUTION.md) (Brain sovereignty)

---

### 2.5 Decision Engine

| Dimension | Definition |
|-----------|------------|
| **Authority** | Operational authority evaluation within Brain. Evaluates agent action requests against authority levels (L0–L4) and founder-approval requirements before irreversible or high-risk dispatch proceeds. |
| **Responsibilities** | Evaluate `DecisionRequest` · assign approval requirements · record decision rationale · gate L3/L4 actions pending founder approval · produce auditable `DecisionRecord` |
| **Boundaries** | Decision Engine evaluates **operational authority** — it does not replace King sovereign approval, EI constitutional doctrine, or Guardian/foundation policy assessment. It does not invent new authority levels or bypass EI launch/risk gates documented at the governance layer. |
| **Accountability** | Accountable for consistent authority-level evaluation and decision record integrity. Escalations to King remain King-accountable approvals. |

**Implementation reference (not modified by EIR-005):** `backend/src/brain/decision-engine.ts`

---

### 2.6 Agents

| Dimension | Definition |
|-----------|------------|
| **Authority** | Domain-specialised autonomous workers operating within Brain dispatch, Decision Engine authority levels, and EI constraints. |
| **Responsibilities** | Execute domain tasks (commerce, intelligence, operations, infrastructure) · produce recommendations and artifacts · request actions through Brain · operate at assigned authority level |
| **Boundaries** | Agents do not amend EI doctrine · do not approve their own L3/L4 actions · do not call external APIs outside Connectors · do not bypass Brain orchestration |
| **Accountability** | Accountable for domain output quality within EI and module contracts. High-risk outcomes escalate through Decision Engine and King approval chain. |

**Repository companion:** [EMPIREAI_CANONICAL_ARCHITECTURE.md](../architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md) §3.5 Agents

---

### 2.7 Connectors

| Dimension | Definition |
|-----------|------------|
| **Authority** | External system integration boundary. Single runtime path for supplier, marketplace, payment, shipping, and platform APIs. |
| **Responsibilities** | Adapter registry · credential binding · dispatch to external providers · health aggregation · research inputs for Pillow and Intelligence |
| **Boundaries** | Connectors integrate — they do not govern commercial risk (EI6) or approve launches. No scattered per-module HTTP clients. Sandbox vs production governed by environment and EI launch gates. |
| **Accountability** | Accountable for adapter truth, credential security boundaries, and operational health reporting. Intelligence and EI consume connector outputs — connectors do not certify commercial risk. |

**Repository companion:** `backend/src/orchestration/reality-integration/` · Connector Kernel (COS)

---

### 2.8 Internet

| Dimension | Definition |
|-----------|------------|
| **Authority** | External data and service source layer — outside EmpireAI sovereignty. |
| **Responsibilities** | Provide supplier, marketplace, advertising, payment, shipping, and open intelligence sources accessed only through Connectors |
| **Boundaries** | No direct EmpireAI component except Connectors (and governed research workflows). External policy change risk absorbed through EI6 and Pillow Research Doctrine. |
| **Accountability** | Third-party platforms accountable for their own policies. EmpireAI accountable for how external intelligence is researched, framed, and acted upon through EI and Pillow. |

---

## 3. Authority flow summary

| Direction | Rule |
|-----------|------|
| **Downward (authority)** | King → EI → Pillow → Brain → Decision Engine → Agents → Connectors → Internet |
| **Upward (accountability)** | Connectors → Agents → Decision Engine → Brain → Pillow → EI reporting → King visibility |
| **Reasoning vs computation** | EI governs reasoning · Brain computes · Decision Engine evaluates operational authority |
| **Approval** | King approves sovereign/irreversible decisions · Decision Engine gates L3/L4 · EI defines when interruption is required |

---

## 4. Cockpit relationship

| Layer | Relationship to stack |
|-------|---------------------|
| **Cockpit** | Presents Executive Intelligence · surfaces Decision Engine pending approvals · does not sit in the constitutional authority stack |

See [PROJECT_COCKPIT_SPECIFICATION.md](../architecture/PROJECT_COCKPIT_SPECIFICATION.md)

---

## 5. Cross-references

| Document | Purpose |
|----------|---------|
| [EXECUTIVE_INTELLIGENCE_ARCHITECTURE.md](./EXECUTIVE_INTELLIGENCE_ARCHITECTURE.md) | Prior executive layer model (harmonized by EIR-005) |
| [EI0_EXECUTIVE_INTELLIGENCE_CHARTER.md](./EI0_EXECUTIVE_INTELLIGENCE_CHARTER.md) | Library charter |
| [EXECUTIVE_INTELLIGENCE_MANIFEST.md](./EXECUTIVE_INTELLIGENCE_MANIFEST.md) | Authority hierarchy and workflows |
| [PILLOW_EXECUTIVE_CONSTITUTION.md](./PILLOW_EXECUTIVE_CONSTITUTION.md) | Pillow constitutional identity |
| [EI_REAL_ALIGNMENT_REPORT.md](./EI_REAL_ALIGNMENT_REPORT.md) | REAL ↔ EI alignment (EIR-004) |
| [EIR-005_ARCHITECTURE_ALIGNMENT_REPORT.md](./EIR-005_ARCHITECTURE_ALIGNMENT_REPORT.md) | This release report |

---

*EI System Alignment — Canonical v1.0 · EIR-005 · 2026-06-21*
