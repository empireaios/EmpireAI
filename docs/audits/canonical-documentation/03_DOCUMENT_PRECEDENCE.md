# 03 — Document Precedence

**Purpose:** Define which document wins when sources conflict.

---

## 1. Precedence Chain (Highest → Lowest)

```
1. Grand King explicit decision (sovereign override — not a file)
2. EMPIREAI_CORE_CONSTITUTION_CTD.md (CTD — supreme commercial law)
3. Domain doctrines & domain constitutions (GVD, ACD, UID, CBD, BL-C, Pillow stack, EI library)
4. EMPIREAI_CONSTITUTION.md (Engineering — defers to CTD on commercial conflicts)
5. docs/architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md (normative architecture)
6. Domain architecture contracts (Pillow Architecture Contract, Eye Architecture, cockpit specs)
7. Programme documents (Roadmaps, V1 Bible, ADRs in EMPIREAI_DECISIONS.md)
8. Governance registers (certification mode, integration master plan, enhancement registers)
9. Journey & Status (JOURNEY.md, EMPIREAI_STATUS.md — current operational state)
10. Operational guides (docs/ARCHITECTURE.md, MANAGED_DEPLOYMENT.md, EMPIREAI_PRODUCTION_TRUTH.md)
11. Scoped operational bibles (backend/MISSION_CONTROL_BUILD_BIBLE.md — MCL scope only)
12. EVIDENCE (proof of past state — never overrides 1–11)
13. HISTORICAL (superseded — never overrides anything)
```

---

## 2. Cross-Domain Precedence Rules

| Question type | Read first | Then | Never cite alone |
|---------------|------------|------|------------------|
| Commercial legality | CTD | CBD | Evidence audits |
| Engineering execution | Engineering Constitution | Canonical Architecture | SYSTEM_ARCHITECTURE |
| Pillow behaviour | Pillow Constitution | Pillow EI Constitution | Integration plan (historical) |
| EI roles | EI_INDEX → relevant EI# | PILLOW_EXECUTIVE_CONSTITUTION (EI roles doc) | EIR reports (evidence) |
| What to build next | EMPIREAI_ROADMAP | Domain roadmap | Progress reports |
| V1 build structure | V1 Hierarchy Bible | Journey | master build bible (historical) |
| What runs in production | EMPIREAI_PRODUCTION_TRUTH [future] | MANAGED_DEPLOYMENT + STATUS | Combined audits |
| Developer map | docs/ARCHITECTURE.md | Canonical Architecture | EMPIREAI_ARCHITECTURE.md (memory) |
| UX law | UID doctrine | Cockpit specs | FOUNDER_EXPERIENCE (historical) |
| Audit history | EXECUTIVE_AUDIT_INDEX | Specific combined audit | — |

---

## 3. Constitution Stack Precedence (Tier 3 Detail)

```
CTD (apex)
├── GVD (governance process — how law changes)
├── ACD (architecture constraints — modularity)
├── UID (UX identity)
├── CBD (commercial soul)
├── BL-C (continuous improvement lifecycle)
├── Engineering Constitution (Brain/Guardian — technical law)
│   └── defers to CTD on commercial conflicts
├── Pillow Constitution (Pillow master identity)
│   ├── Pillow EI Constitution (cognition layer)
│   └── Pillow Memory Doctrine
├── EI Library (EI0–EI10)
│   └── EI1 defers to CTD on empire constitution matters
└── Architecture normative set
    └── Canonical Architecture > Pillow Architecture > Eye Architecture
```

**RECOMMENDED:** One-page `EMPIREAI_CONSTITUTION_HIERARCHY.md` visualizes this stack.  
**CURRENT:** Stack exists across files; agents misread similarly named docs.

---

## 4. Vision / Soul / Bible / Roadmap / Constitution Precedence

| Artifact | Precedence role | Relationship |
|----------|-----------------|--------------|
| **Vision** | Highest identity — "why we exist" | Informs Soul, CTD preamble, Roadmap |
| **Soul** | Identity memory — "who we are" | Subordinate to Vision when authored |
| **Constitution (CTD + stack)** | Law — "what must be true" | Binds all systems |
| **Bible** | V1 build hierarchy — "what exists in V1 structure" | Subordinate to Constitution; informs Journey |
| **Roadmap** | Sequence — "what next" | Subordinate to Vision + Constitution |

**Rule:** Roadmap never overrides Constitution. Bible never overrides CTD. Soul never overrides Vision.

---

## 5. Architecture Precedence (Three Layers)

| Layer | Document | Precedence |
|-------|----------|------------|
| Normative | `docs/architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md` | **Wins** architecture disputes |
| Operational | `docs/ARCHITECTURE.md` | Wins "how to develop today" |
| Memory | `EMPIREAI_ARCHITECTURE.md` | Changelog only — no precedence |
| Obsolete | `docs/SYSTEM_ARCHITECTURE.md` | **Zero** — historical |

**Reconstruction reference:** `docs/audits/canonical-architecture/01_CANONICAL_ARCHITECTURE.md` is **EVIDENCE** for Constitution Construction — reconciles normative + current; not law until ratified.

---

## 6. Production Truth Precedence

**CURRENT (scattered):**
1. `deployment/MANAGED_DEPLOYMENT.md`
2. Env templates + readiness scripts
3. `EMPIREAI_STATUS.md`
4. Code defaults (extension routes off, minimal Pillow chat)

**RECOMMENDED:**
1. `docs/governance/EMPIREAI_PRODUCTION_TRUTH.md` (single operational authority)
2. MANAGED_DEPLOYMENT (deployment sequence)
3. EMPIREAI_STATUS (live state snapshot)

**FUTURE:** Production Truth incorporated into Constitution Lock annex.

---

## 7. Navigation vs Law Precedence

| Document | Role | Precedence |
|----------|------|------------|
| `EMPIREAI_REPOSITORY_MASTER_INDEX.md` | Catalog + pointers | Does not override law |
| `JOURNEY.md` | Live ops status index | Operational — updates frequently |
| `JOURNEY_AUDIT.md` | Structural change log | Evidence of journey edits |

**Rule:** If Master Index contradicts CTD, **CTD wins** — index must be corrected.

---

## 8. Citation Precedence for Agents

When two documents disagree:

1. Identify tier and classification of each
2. Apply chain in §1
3. If same tier and both CANONICAL → escalate to Chief Architect + ADR
4. If OPERATIONAL vs CANONICAL → CANONICAL wins (file ops doc bug)
5. If EVIDENCE vs anything else → evidence proves past only
6. If HISTORICAL vs anything → historical loses always

---

## 9. Unresolved Precedence (Requires ADR)

| # | Conflict | Lower doc | Higher doc (pending) |
|---|----------|-----------|----------------------|
| 1 | Production UI authority | MANAGED_DEPLOYMENT (frontend/) | ADR-CON-001 |
| 2 | REAL-078 cockpit path | REAL-078 text | Production evidence (empireai-web) |
| 3 | Pillow COI full vs prod mode | Pillow Constitution | Production Truth (future) |
| 4 | ECC/VIE intended hierarchy | Mission briefs | Tier 6 deferral doc (future) |
| 5 | EI architecture TODO section | EXECUTIVE_INTELLIGENCE_ARCHITECTURE | Canonical Architecture |

---

## 10. Precedence at Constitution Lock (FUTURE)

At ratification, Grand King signs precedence order as **Schedule A** of permanent Constitution Framework. Until then, this file is **RECOMMENDED** reconstruction evidence.
