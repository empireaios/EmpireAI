# 05 — Canonical Naming Standard (ECNS-1)

**EmpireAI Canonical Naming Standard — Version 1 (Recommended)**  
**Applies to:** All new documents, missions, ADRs, and agent outputs after Constitution Construction begins  
**Does not require:** Immediate file or folder renames

---

## 1. General Rules

| Rule | Standard |
|------|----------|
| **Readable first** | Use "Brain", "Cockpit", "Pillow", "Grand King" in constitutional and Grand King-facing prose |
| **Mission IDs for traceability** | REAL-###, PILLOW-###, G#-##, B6-##, CTD-### only in registers, commits, tests, evidence |
| **One title per tier-slot** | No two CANONICAL docs may share the same display title at the same tier |
| **Prefix law docs** | `EMPIREAI_<DOMAIN>_<TYPE>.md` for root-level governance |
| **Classify every doc** | CANONICAL \| OPERATIONAL \| EVIDENCE \| HISTORICAL \| STUB |
| **Version bibles** | Always `V1`, `V2` in title — never bare "Bible" |
| **No bare "Constitution"** | Always qualified: Commercial Constitution (CTD), Engineering Constitution, Pillow Constitution |

---

## 2. Permanent Display Names

| Concept | Canonical display name | Canonical path (current) |
|---------|------------------------|--------------------------|
| Supreme law | **Commercial Constitution (CTD)** | `EMPIREAI_CORE_CONSTITUTION_CTD.md` |
| Engineering law | **Engineering Constitution** | `EMPIREAI_CONSTITUTION.md` |
| Pillow identity | **Pillow Constitution** | `EMPIREAI_PILLOW_CONSTITUTION.md` |
| Pillow cognition | **Pillow Executive Intelligence Constitution** | `EMPIREAI_PILLOW_EXECUTIVE_INTELLIGENCE_CONSTITUTION.md` |
| EI Pillow roles | **EI Pillow Executive Roles** (display rename) | `docs/executive-intelligence/PILLOW_EXECUTIVE_CONSTITUTION.md` |
| Identity — vision | **Vision File** | `EMPIREAI_VISION.md` [to author] |
| Identity — soul | **Soul File** | `EMPIREAI_SOUL.md` |
| Build programme | **V1 Hierarchy Bible** | `artifacts/empireai-version-1-build-hierarchy-bible.md` |
| Empire direction | **Master Roadmap** | `EMPIREAI_ROADMAP.md` |
| Architecture target | **Canonical Architecture** | `docs/architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md` |
| Dev architecture | **Operational Architecture Guide** | `docs/ARCHITECTURE.md` |
| Production ops | **Managed Deployment Guide** | `deployment/MANAGED_DEPLOYMENT.md` |
| Navigation | **Repository Master Index** | `EMPIREAI_REPOSITORY_MASTER_INDEX.md` |
| Live ops index | **Journey Index** | `JOURNEY.md` |
| Execution kernel | **Brain** | `backend/` |
| Executive UI | **Cockpit** | `empireai-web/` (pending ADR) |
| Marketing/login shell | **Founder Shell** | `frontend/` |
| COI package | **Pillow** | `pillow/` |
| Engineering automation | **Builder** (Cursor Bridge) | `cursor-bridge/` |
| Health engine | **Guardian** | `guardian/` |
| Mission runtime code | **Runtime modules** (REAL-###) | `backend/src/runtime/` |

---

## 3. File Naming Convention (New Documents)

```
EMPIREAI_<DOMAIN>_<ARTIFACT>.md          — root governance
docs/governance/EMPIREAI_<TOPIC>.md      — governance subdocs
docs/architecture/<NAME>.md              — architecture
docs/executive-intelligence/EI<n>_<NAME>.md  — EI library
docs/audits/<audit-id>/NN_<NAME>.md      — audits
COMBINED_EXECUTIVE_AUDIT_<BATCH>.md      — evidence only
artifacts/<programme>-<topic>-executive-audit.md  — evidence
```

**Domains:** CORE, PILLOW, COMMERCE, COCKPIT, BRAIN, PRODUCTION, GOVERNANCE, UX, EI  
**Artifacts:** CONSTITUTION, DOCTRINE, ROADMAP, ARCHITECTURE, SPECIFICATION, REPORT

---

## 4. Abbreviation Glossary (Controlled Use)

### Always expand in Constitution / Vision / Soul prose

| Abbr | Expand to | Code/mission ID use OK? |
|------|-----------|-------------------------|
| BFF | Cockpit Proxy | No in prose |
| MCL | Mission Control Layer | Mission refs only |
| ESIS | Executive Summary Intelligence (legacy panel) | Internal only |
| SCR | Screen ID (e.g. SCR-700) | Cockpit specs only |
| SaaS | (avoid — pre-Pillow term) | No |

### Allowed in technical docs with glossary link

| Abbr | Meaning |
|------|---------|
| CTD | Core Truth Doctrine / Commercial Constitution |
| GVD | Governance Doctrine |
| ACD | Architecture Constraints Doctrine |
| UID | UX Identity Doctrine |
| CBD | Commercial Business Doctrine |
| EI | Executive Intelligence |
| EIR | Executive Intelligence Release |
| EKLS | Empire Knowledge & Learning System |
| EOS | Empire Operating System (Pillow phase) |
| CEV | Continuous Evolution (Pillow phase) |
| CRIR | Commerce Readiness Intelligence Report |
| REAL | Repository Empire Architecture Layer (mission namespace) |
| ADR | Architecture Decision Record |

### Gate programme names (use full name once per document)

| Code | Full name |
|------|-----------|
| G2 | Infrastructure & Commerce Integration Programme |
| G3 | Intelligence Engines Programme |
| G4 | Grand King Cockpit Programme |
| G5 | Business Automation Programme |
| G6 | Production Certification Programme |
| G7 | Grand King Live Operations Programme |
| G8 | Identity & Authorization Programme |
| B6 | Live Commerce Authentication Batch |

---

## 5. Code & Production Names — Do Not Change

These are **frozen production identifiers**:

- Folder: `backend/`, `pillow/`, `empireai-web/`, `frontend/`
- Package: `@empireai/pillow`
- URLs: `/health/live`, `/auth/login`, `/brain/dispatch`, `/api/pillow/chat`
- Cookie: `empireai_session`
- Env: `BRAIN_API_URL`, `REDIS_URL`, `EMPIRE_ENABLE_EXTENSION_ROUTES`
- Railway service / Vercel projects (until explicit migration ADR)

---

## 6. Forbidden Patterns (Cause 5-Year Confusion)

1. "The Constitution" without qualifier  
2. "The Architecture doc" without canonical vs operational  
3. "The Bible" without version  
4. "Pillow Executive Constitution" without path disambiguation  
5. "Frontend" when meaning Cockpit  
6. "Dashboard" for Cockpit  
7. "REAL" as product name  
8. "EmpireAI OS" interchangeably with "Pillow EOS module" without context  

---

## 7. Mission & Audit Naming

| Type | Pattern | Example |
|------|---------|---------|
| REAL mission | REAL-### | REAL-127 |
| Pillow mission | PILLOW-### or phase name | PILLOW-016 |
| Combined audit | COMBINED_EXECUTIVE_AUDIT_<BATCH> | REAL-071-100 |
| Gate audit | artifacts/g#-##-...-executive-audit.md | g4-03-executive-home-... |
| Normalization audit | docs/audits/hierarchy-normalization/ | this mission |
| Constitution backlog | CON-### | CON-001 |

---

## 8. ECNS-1 Compliance Checklist (For New Docs)

- [ ] Display name matches §2 table or adds new row via ADR  
- [ ] Classification tag assigned  
- [ ] Tier assigned (0–6)  
- [ ] Owner assigned  
- [ ] No duplicate title at same tier  
- [ ] Abbreviations expanded in first Grand King-facing section  
- [ ] Listed in Repository Master Index  
