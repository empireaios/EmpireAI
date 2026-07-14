# EMPIREAI NAMING STANDARD

> **Classification:** CANONICAL — Tier 3 Law (Governance)  
> **Document ID:** P1-07 · ECNS-2 (EmpireAI Canonical Naming Standard — constitutional)  
> **Constitutional phase:** P1 — Identity Foundation  
> **Dependencies:** P1-01 · P1-02 · P1-03 · P1-04 · P1-05 · P1-06  
> **Authority:** Grand King  
> **Established:** 2026-07-04  
> **Role:** **Single naming authority** for EmpireAI — every present and future name  
> **Successor to:** audit recommendation ECNS-1 (`docs/audits/hierarchy-normalization/05_CANONICAL_NAMING_STANDARD.md`) — **this document is law**

**Related P1 foundation:** [`EMPIREAI_HIERARCHY.md`](./EMPIREAI_HIERARCHY.md) · [`EMPIREAI_OWNERSHIP_MODEL.md`](./EMPIREAI_OWNERSHIP_MODEL.md) · [`EMPIREAI_REASONING_MODEL.md`](./EMPIREAI_REASONING_MODEL.md)  
**Documentation classification:** ECDS-1 (`docs/audits/canonical-documentation/01_CANONICAL_DOCUMENT_SYSTEM.md`)  
**Expanded dictionary:** [`EMPIREAI_GLOSSARY.md`](./EMPIREAI_GLOSSARY.md) (P1-08) — **definitions**; this standard governs **creation rules**

---

## 1. Purpose

Constitutional identity, ownership, and hierarchy are established. Naming must **eliminate ambiguity forever**.

Future engineers, AI workers, documentation, and businesses must understand **exactly** what every name means — without re-deriving from chat or legacy folders.

**The principle:** Readable English preferred · one meaning per name · one expansion per abbreviation · no overloaded terms · no duplicate display titles at the same tier.

---

## 2. Naming Philosophy

| Principle | Rule |
|-----------|------|
| **Readable first** | Use canonical display names in Vision, Soul, Constitution, and Grand King-facing prose |
| **Traceability second** | Mission IDs (REAL-###, CON-###) in registers, commits, tests, evidence — not as product names |
| **Qualified precision** | Never bare "Constitution", "Architecture", or "Bible" — always qualified |
| **One name · one meaning** | No two CANONICAL artifacts share the same display title at the same hierarchy tier |
| **Industry exceptions only** | Abbreviations permitted for industry standard, repository standard, or technical necessity |
| **Frozen production IDs** | URLs, env vars, package names change only via ADR + migration |
| **Hierarchy alignment** | Names reflect tier placement — [`EMPIREAI_HIERARCHY.md`](./EMPIREAI_HIERARCHY.md) |
| **Ownership alignment** | Display names do not imply false ownership — [`EMPIREAI_OWNERSHIP_MODEL.md`](./EMPIREAI_OWNERSHIP_MODEL.md) |

---

## 3. Canonical Terminology

Each term has **one canonical meaning**. Usage column defines where the name is correct.

### 3.1 Authority & platform

| Term | Canonical meaning | Correct usage | Forbidden usage |
|------|-------------------|---------------|-----------------|
| **Grand King** | Platform Owner · sole operational account until MS-B · final approval authority | Sovereignty · commercial irreversibles · Vision sign-off | Generic "admin", "user", "founder" when meaning sovereign operator |
| **Chief Architect** | Non-runtime strategic authority (ChatGPT) — constitution · normative architecture · mission design | Architectural stewardship · ADR authorship | Runtime executor · Pillow substitute |
| **EmpireAI** | Intelligence Platform that manufactures companies — the governed platform entity (Tier 2) | Platform · empire · factory metaphor | "EmpireAI OS" without context · automation product · demo AI |
| **Pillow** | Chief Operating Intelligence (COI) — strategic advisor · mission author · Builder supervisor · Soul/Vision steward | Canonical AI identity (ADR-017) | Generic "assistant", "chatbot", "Copilot" |

### 3.2 Runtime & execution

| Term | Canonical meaning | Correct usage | Forbidden usage |
|------|-------------------|---------------|-----------------|
| **Brain** | Execution kernel — orchestrator · auth · persistence · Guardian dispatch path | `backend/src/brain/` · dispatch · orchestration | Peer of Pillow · UX layer · approval authority |
| **Cockpit** | Grand King executive shell — visualization and approval UI | `empireai-web/` · executive surfaces | "Dashboard" · "Frontend" when meaning Cockpit · execution engine |
| **Builder** | Cursor implementation channel — approved missions only | Engineering automation · Cursor Bridge | Mission approver · scope author |
| **Supervisor** | Pillow COI supervision **role** over Builder — not a separate platform | Checkpoints · recovery · drift detection | Tier-1 authority peer to Pillow |
| **Guardian** | Pre-dispatch fail-safe inside Brain path | Safety gate · integrity blocks | Standalone orchestrator |
| **Runtime** | Live process plane — Pillow host · Brain process · async infra (Tier 5) | Production processes · Redis · SQLite | Synonym for entire EmpireAI |
| **Production** | Deployed environment · live operational truth · STATUS (Tier 5) | `EMPIREAI_STATUS.md` · Production Truth · deployment | Simulation · seed data · dev-only |

### 3.3 Identity & programme (Tier 3)

| Term | Canonical meaning | Correct usage | Forbidden usage |
|------|-------------------|---------------|-----------------|
| **Vision** | WHY — canonical intent · `EMPIREAI_VISION.md` | Purpose · mission alignment · P1-01 | Implementation spec · runtime config |
| **Soul** | WHO — continuity memory · `EMPIREAI_SOUL.md` | Identity · promises · never-forget anchors · P1-04 | Runtime logs · live metrics |
| **Constitution** | WHAT MUST BE TRUE — **always qualified** (see §3.4) | Law · doctrines · governing documents | Generic "the Constitution" |
| **Roadmap** | WHAT NEXT — programme sequence · domain roadmaps · CON Lock | `EMPIREAI_ROADMAP.md` · P1–P9 | Vision replacement · task dump |
| **Journey** | Append-only structural history of what exists · `JOURNEY.md` | Programme progress register | Soul body copy · delete/rename rows silently |
| **Programme** | Bounded body of work with roadmap authority (Tier 4) | V1 Bible · gate programmes · CON phases | One-off chat task list |
| **Roadmap Item** | Single sequenced entry in a roadmap register | CON-### · REAL-### row · phase objective | Unscoped todo |

### 3.4 Constitution (qualified forms)

| Term | Canonical meaning | Path |
|------|-------------------|------|
| **Commercial Constitution (CTD)** | Apex commercial law · CTD-001→040 | `EMPIREAI_CORE_CONSTITUTION_CTD.md` |
| **Engineering Constitution** | Brain · Guardian · Builder execution law | `EMPIREAI_CONSTITUTION.md` |
| **Pillow Constitution** | Pillow master identity · technical ownership | `EMPIREAI_PILLOW_CONSTITUTION.md` |
| **Pillow Executive Intelligence Constitution** | EI layer law | `EMPIREAI_PILLOW_EXECUTIVE_INTELLIGENCE_CONSTITUTION.md` |
| **Constitutional Framework** | P-era mission governance entry point | `EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md` |
| **Constitution Lock** | Locked P1–P9 · CON-001–019 register | `EMPIREAI_CONSTITUTION_LOCK.md` |

**Rule:** Prose must say **Commercial Constitution**, **Engineering Constitution**, or **Pillow Constitution** — never unqualified "Constitution" alone.

### 3.5 Design & commerce (Tier 4–5)

| Term | Canonical meaning | Correct usage | Forbidden usage |
|------|-------------------|---------------|-----------------|
| **Architecture** | **Always qualified:** Canonical Architecture (normative) vs Operational Architecture Guide (dev) | HOW systems are shaped | Generic "architecture doc" |
| **Canonical Architecture** | Normative target architecture | `docs/architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md` | `docs/ARCHITECTURE.md` |
| **Operational Architecture Guide** | Developer implementation truth | `docs/ARCHITECTURE.md` | Law · Vision |
| **Governance** | P1 policies · Framework · sync · accumulation · ownership · hierarchy | Tier 4 plane | Ad-hoc rules |
| **Knowledge** | EKLS · executive intelligence library · organizational memory | Tier 4 · EI0–EI10 | Chat history |
| **Commerce** | Commercial execution domain — modules · treasury · connector boundary | Tier 5 · Commerce Canon | Cockpit itself |
| **Business Engine** | Single capability engine (marketplace · supplier · payment · etc.) | Tier 5 under Business Engines | Entire EmpireAI |

### 3.6 Mission & decision types

| Term | Canonical meaning | Pattern |
|------|-------------------|---------|
| **Mission** | Bounded work unit with WHY→WHAT→HOW→PROOF | Named brief · REAL/CON/PILLOW ID |
| **REAL Mission** | Repository / runtime / Cockpit engineering execution | `REAL-###` |
| **CON Mission** | Constitutional execution task (P1–P9) | `CON-###` |
| **Pillow Mission** | Pillow package capability work | `PILLOW-###` |
| **ADR** | Architecture Decision Record — permanent decision memory | `ADR-###` in `EMPIREAI_DECISIONS.md` |
| **Doctrine** | Immutable numbered principle module (CTD · GVD · CBD · etc.) | `CTD-###` · `GVD-###` |
| **Audit** | Point-in-time executive or evidence review | `COMBINED_EXECUTIVE_AUDIT_*` · artifacts |

### 3.7 Document classifications (ECDS-1)

| Term | Canonical meaning | Citation rule |
|------|-------------------|---------------|
| **Canonical** | Governing law · identity · normative architecture | Cite as current truth |
| **Operational** | Current implementation truth | Cite for "what runs now" |
| **Evidence** | Proof only — immutable record | Never cite as law |
| **Historical** | Superseded — zero authority | Do not cite as current |
| **Stub** | Placeholder — replace or archive | Do not cite |

---

## 4. Naming Conventions by Domain

### 4.1 Business names

| Rule | Standard |
|------|----------|
| Display | **Grand King**, **EmpireAI**, **Pillow**, **Cockpit** — capitalized canonical terms |
| Commercial mission | **MS-A**, **MS-B**, **PROOF-001** — define on first use in Grand King prose |
| Success metric | **USD 100,000 cumulative net profit** — not vanity revenue labels |
| Company manufactured | Named per business unit ADR — not `Company1` |

### 4.2 Architecture names

| Artifact | Display name | Path pattern |
|----------|--------------|--------------|
| Normative architecture | **Canonical Architecture** | `docs/architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md` |
| Pillow contract | **Pillow Architecture Contract** | `PILLOW_ARCHITECTURE_CONTRACT.md` |
| Cockpit spec | **Cockpit \<Surface\> Spec** | `docs/architecture/cockpit/` |
| EKLS | **Empire Knowledge and Learning System (EKLS)** | `CANONICAL_EKLS_SPECIFICATION.md` |

### 4.3 Runtime names

| Concept | Canonical | Path / identifier |
|---------|-----------|-------------------|
| Execution kernel | **Brain** | `backend/src/brain/` |
| COI package | **Pillow** | `pillow/` · `@empireai/pillow` |
| Executive UI | **Cockpit** | `empireai-web/` |
| Founder marketing shell | **Founder Shell** | `frontend/` — not Cockpit |
| Fail-safe | **Guardian** | Brain pre-dispatch |
| Session cookie | `empireai_session` | frozen until ADR |
| Health probe | `/health/live` | frozen until ADR |

### 4.4 Governance names

| Pattern | Example |
|---------|---------|
| P1 identity foundation | `P1-01` … `P1-10` (document ID in header) |
| Root governance doc | `EMPIREAI_<DOMAIN>_<ARTIFACT>.md` |
| Governance subdoc | `docs/governance/EMPIREAI_<TOPIC>.md` |
| Policy pointer | `EMPIREAI_<TOPIC>_POLICY.md` → full framework |

**Domains (governance prefix):** CORE · PILLOW · COMMERCE · COCKPIT · BRAIN · PRODUCTION · GOVERNANCE · UX · EI · VISION · SOUL  
**Artifacts:** CONSTITUTION · DOCTRINE · ROADMAP · ARCHITECTURE · MODEL · STANDARD · POLICY · FRAMEWORK

### 4.5 AI names

| Name | Role |
|------|------|
| **Pillow** | Only canonical name for COI |
| **Chief Architect** | ChatGPT strategic design — not a runtime agent |
| **Builder** | Cursor — implementation worker |
| **Executive Council** | Debate layer — never executes (GVD) |
| **Future AI workers** | Must receive canonical name via ADR before production |

**Forbidden:** "Agent", "Bot", "LLM" as identity substitutes in constitutional prose.

### 4.6 Production names

| Rule | Standard |
|------|----------|
| Environment | **Production** · **Development** · **Simulation** — never conflated |
| Status doc | **Project State** · `EMPIREAI_STATUS.md` |
| Production truth | **Production Truth** · `docs/governance/EMPIREAI_PRODUCTION_TRUTH.md` |
| Deployment guide | **Managed Deployment Guide** | `deployment/MANAGED_DEPLOYMENT.md` |
| Env vars | SCREAMING_SNAKE — change only via ADR |

---

## 5. Mission Naming

### 5.1 Identity Foundation (P1-##)

| ID | Name | Output artifact |
|----|------|-----------------|
| **P1-01** | Vision | `EMPIREAI_VISION.md` |
| **P1-02** | Reasoning Model | `EMPIREAI_REASONING_MODEL.md` |
| **P1-03** | Vision Accumulation | `EMPIREAI_VISION_ACCUMULATION.md` |
| **P1-04** | Soul File | `EMPIREAI_SOUL.md` |
| **P1-05** | Ownership | `EMPIREAI_OWNERSHIP_MODEL.md` |
| **P1-06** | Hierarchy | `EMPIREAI_HIERARCHY.md` |
| **P1-07** | Naming | `EMPIREAI_NAMING_STANDARD.md` (this document) |
| **P1-08** | Glossary | `EMPIREAI_GLOSSARY.md` |
| **P1-09** | Repository | `EMPIREAI_REPOSITORY_STRUCTURE.md` |
| **P1-10** | Production Truth | `docs/governance/EMPIREAI_PRODUCTION_TRUTH.md` |

**Format:** `P1-##` in document headers · prose: **P1-07 Naming**

### 5.2 Constitutional missions (CON-###)

| Attribute | Rule |
|-----------|------|
| **Pattern** | `CON-###` — three digits · immutable once in Constitution Lock |
| **Scope** | P1–P9 constitutional execution · CON-001–CON-019 locked |
| **Expansion** | **Constitutional Execution Task CON-###** |
| **Example** | **CON-001** — Author canonical Vision File |
| **Growth** | CON-020+ append only — never rename CON-001–019 |

### 5.3 REAL missions (REAL-###)

| Attribute | Rule |
|-----------|------|
| **Pattern** | `REAL-###` — Repository Empire Architecture Layer |
| **Scope** | Runtime · Cockpit · Brain · repository engineering |
| **Expansion** | **REAL Mission REAL-###** |
| **Example** | **REAL-078** — Canonical Architecture authorship |
| **Prose** | Never use REAL as product brand name |

### 5.4 Other mission namespaces

| Prefix | Expansion | Example |
|--------|-----------|---------|
| **PILLOW-###** | Pillow package mission | PILLOW-016 |
| **ADR-###** | Architecture Decision Record | ADR-017 |
| **GO-###** | Grand King operational plan | GO-002 |
| **G2–G8** | Gate programme (expand on first use) | G4 — Grand King Cockpit Programme |
| **BL-#** | Backlog release | BL-B · BL-C |
| **UX-###** | Cockpit contract screen | UX-023 |
| **MS-#** | Milestone | MS-A · MS-B |
| **PROOF-###** | Commercial proof gate | PROOF-001 |
| **ACC-###** | Vision accumulation register entry | ACC-001 |

### 5.5 Programme · Roadmap · Journey · Audit

| Term | Naming convention |
|------|-------------------|
| **Programme** | **\<Name\> Programme** — e.g. Constitutional Execution Programme |
| **Roadmap** | **\<Domain\> Roadmap** — e.g. Pillow Roadmap · `PILLOW_ROADMAP.md` |
| **Master Roadmap** | Empire-wide direction · `EMPIREAI_ROADMAP.md` |
| **Journey** | Single artifact **`JOURNEY.md`** · audit **`JOURNEY_AUDIT.md`** |
| **Audit** | **`COMBINED_EXECUTIVE_AUDIT_<BATCH>`** or `artifacts/<id>-executive-audit.md` |
| **V1 Bible** | **V1 Hierarchy Bible** — always versioned · never bare "Bible" |

---

## 6. Document Naming

### 6.1 File patterns

```
EMPIREAI_<DOMAIN>_<ARTIFACT>.md              — root governance / identity
docs/governance/EMPIREAI_<TOPIC>.md            — governance law
docs/architecture/<DESCRIPTIVE_NAME>.md        — architecture
docs/executive-intelligence/EI<n>_<NAME>.md  — EI library
docs/audits/<audit-id>/NN_<NAME>.md            — audit packs
COMBINED_EXECUTIVE_AUDIT_<BATCH>.md          — evidence only
artifacts/<programme>-<topic>-executive-audit.md
```

### 6.2 Classification tags (header)

Every new governing document **must** include:

```markdown
> **Classification:** CANONICAL | OPERATIONAL | EVIDENCE | HISTORICAL | STUB
> **Document ID:** P1-## | CON-### | ADR-###
> **Authority:** Grand King | Chief Architect | ...
```

### 6.3 Display title rules

| Tier slot | Rule |
|-----------|------|
| Tier 2 Identity | **Vision File** · **Soul File** — one title each |
| Tier 3 Law | Qualified constitution names — no duplicate "Constitution" titles |
| Tier 4 Programme | **Master Roadmap** · **\<Domain\> Roadmap** · **V1 Hierarchy Bible** |
| Evidence | Batch ID in filename — not CANONICAL class |

---

## 7. Repository Naming

| Area | Convention |
|------|------------|
| **Root identity** | `EMPIREAI_VISION.md` · `EMPIREAI_SOUL.md` · `EMPIREAI_ROADMAP.md` |
| **Backend** | `backend/` — Brain host |
| **Pillow package** | `pillow/` |
| **Cockpit** | `empireai-web/` |
| **Founder shell** | `frontend/` — disambiguate from Cockpit in prose |
| **Runtime modules** | `backend/src/runtime/` — REAL-### traceability |
| **Foundation** | `foundation/` — governance modules · soul-file mirror |
| **Master index** | `EMPIREAI_REPOSITORY_MASTER_INDEX.md` |

**Rule:** Folder renames require ADR + migration plan — not silent renames.

---

## 8. Abbreviation Register

Abbreviations **permitted only** with this single expansion:

| Abbr | Canonical expansion | Prose in Vision/Soul/Constitution? |
|------|---------------------|-----------------------------------|
| **CTD** | Commercial Constitution (Core Truth Doctrine) | Expand on first use |
| **GVD** | Governance Doctrine | Expand on first use |
| **CBD** | Commercial Business Doctrine | Expand on first use |
| **ACD** | Architecture Constraints Doctrine | Expand on first use |
| **UID** | UX Identity Doctrine | Expand on first use |
| **ADR** | Architecture Decision Record | Expand on first use |
| **COI** | Chief Operating Intelligence | Expand on first use |
| **EKLS** | Empire Knowledge and Learning System | Expand on first use |
| **EI** | Executive Intelligence | Expand on first use |
| **ECC** | Execution Control Center | Expand on first use |
| **VIE** | Vision Integrity Engine | Expand on first use |
| **ECDS** | EmpireAI Canonical Documentation System | Technical docs OK |
| **ECNS** | EmpireAI Canonical Naming Standard | This document |
| **BFF** | Cockpit Proxy (server routes) | Code only — not constitutional prose |
| **REAL** | Repository Empire Architecture Layer | Mission IDs only — not product name |
| **CON** | Constitutional Execution Task | Mission IDs only |
| **GK** | Grand King | Internal tables only — spell out in prose |
| **CA** | Chief Architect | Internal tables only |
| **MS-A** | Milestone A — USD 100K cumulative net profit | Define on first use |
| **MS-B** | Milestone B — USD 1M cumulative net profit | Define on first use |

**New abbreviations:** require row in this register or P1-08 Glossary + ADR before use in CANONICAL docs.

---

## 9. Forbidden Patterns

| # | Forbidden | Use instead |
|---|-----------|-------------|
| 1 | "The Constitution" | Commercial Constitution · Engineering Constitution · Pillow Constitution |
| 2 | "The Architecture doc" | Canonical Architecture · Operational Architecture Guide |
| 3 | "The Bible" | V1 Hierarchy Bible |
| 4 | "Frontend" (meaning Cockpit) | Cockpit · Founder Shell |
| 5 | "Dashboard" (meaning Cockpit) | Cockpit |
| 6 | "REAL" as product name | EmpireAI · Brain · Cockpit |
| 7 | "Automation platform" for EmpireAI | Intelligence Platform |
| 8 | "Pillow" as generic assistant | Pillow COI |
| 9 | Duplicate CANONICAL display title at same tier | ADR disambiguation |
| 10 | "SaaS" for EmpireAI identity | Intelligence Platform · Commerce OS |

---

## 10. Future Naming Rules

| Rule | Requirement |
|------|-------------|
| **N1** | New subsystem receives **display name** + **mission prefix** (if any) via ADR |
| **N2** | Register abbreviation in §8 or P1-08 Glossary before CANONICAL use |
| **N3** | Assign tier in [`EMPIREAI_HIERARCHY.md`](./EMPIREAI_HIERARCHY.md) §14 |
| **N4** | Assign CO in [`EMPIREAI_OWNERSHIP_MODEL.md`](./EMPIREAI_OWNERSHIP_MODEL.md) §14 |
| **N5** | Add row to Repository Master Index |
| **N6** | Business units manufactured by EmpireAI use commercial names — not engineering codenames in constitutional docs |
| **N7** | CON-020+ for new constitutional tasks — never reuse locked IDs |

---

## 11. Examples

### Example 1 — Correct Grand King brief prose

> Pillow supervises the Builder on **REAL-127** to improve Brain persistence. The **Grand King** approves production deploy. Alignment: **Vision** MS-A · **Soul** §4.6.

### Example 2 — Correct document reference

> Read the **Canonical Architecture** (`docs/architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md`) — not the **Operational Architecture Guide** — for normative Brain shape.

### Example 3 — Wrong

> "The Constitution says we need dashboards."

**Fix:** "The **Commercial Constitution (CTD-005)** requires intelligence, not automation. **Cockpit** visualizes — it does not execute."

### Example 4 — CON vs REAL

> **CON-007** documents production route policy (constitutional). **REAL-081** implements Cockpit Mission Centre (engineering). CON defines readiness; REAL implements.

### Example 5 — New engine

Before production: ADR assigns **Display name: Payment Engine** · prefix none · tier Tier 5 Business Engines · abbreviation none in prose.

---

## 12. Validation Checklist

| Check | Status |
|-------|--------|
| No duplicated terminology | §3 · §9 |
| No conflicting names | §3 forbidden columns |
| Agrees with Vision | §3.3 Vision term |
| Agrees with Soul | §3.3 Soul term |
| Agrees with Ownership | §2 · display ≠ false ownership |
| Agrees with Hierarchy | §2 · tier-aligned terms |
| Agrees with Architecture | §3.5 · §4.2 qualified Architecture |
| Agrees with Documentation | §3.7 ECDS classifications |
| Agrees with Roadmap | §5 mission namespaces |

---

## 13. Governance

| Role | Naming duty |
|------|-------------|
| **Grand King** | Approve new canonical terms affecting identity or commercial promises |
| **Chief Architect** | Maintain this standard · resolve disputes · ECNS version bumps |
| **Pillow COI** | Flag naming drift in missions · enforce readable prose |
| **Builder** | Use mission IDs in commits · canonical terms in docs |
| **Governance maintainer** | Dedupe Master Index titles |

**Amendment:** CONSTITUTIONAL REVIEW + Grand King for §3 canonical term changes. Append §8 rows for new abbreviations.

---

## Revision History

| Version | Date | Authority | Change |
|---------|------|-----------|--------|
| 1.0.0 (ECNS-2) | 2026-07-04 | Grand King · P1-07 | Initial constitutional Naming Standard |

---

## Related

- [`EMPIREAI_HIERARCHY.md`](./EMPIREAI_HIERARCHY.md) (P1-06)  
- [`EMPIREAI_OWNERSHIP_MODEL.md`](./EMPIREAI_OWNERSHIP_MODEL.md) (P1-05)  
- [`EMPIREAI_ROADMAP_HIERARCHY.md`](./EMPIREAI_ROADMAP_HIERARCHY.md) §5  
- [`EMPIREAI_VISION.md`](../../EMPIREAI_VISION.md) · [`EMPIREAI_SOUL.md`](../../EMPIREAI_SOUL.md)  
- Audit lineage: [`docs/audits/hierarchy-normalization/05_CANONICAL_NAMING_STANDARD.md`](../audits/hierarchy-normalization/05_CANONICAL_NAMING_STANDARD.md) (ECNS-1 — superseded)
