# EMPIREAI BROWSER TRUTH SYSTEM

> **Classification:** CANONICAL — Tier 3 Law (Governance · Acceptance Doctrine)  
> **Document ID:** P4-06  
> **Constitutional phase:** P4 — Engineering Foundation  
> **Dependencies:** P4-05 complete  
> **Owner:** Chief Architect · Pillow COI · Grand King · Supervisor  
> **Authority:** **Single permanent Browser Truth Doctrine** — no competing browser acceptance doctrines  
> **Companion:** [`EMPIREAI_PRODUCTION_TRUTH.md`](./EMPIREAI_PRODUCTION_TRUTH.md) (production surface baseline)  
> **Protocol companion:** [`EMPIREAI_CURSOR_PROTOCOL.md`](./EMPIREAI_CURSOR_PROTOCOL.md) (P4-04)  
> **Recovery companion:** [`EMPIREAI_RECOVERY_DOCTRINE_SYSTEM.md`](./EMPIREAI_RECOVERY_DOCTRINE_SYSTEM.md) (P4-05)  
> **Runtime:** `pillow/src/browser-truth/` · **PILLOW-BT-001**

---

## 1. Purpose

P4-05 established the permanent Recovery Doctrine. P4-06 establishes **Browser Truth** — the permanent constitutional acceptance doctrine.

EmpireAI shall **never** declare a feature complete because code compiles, tests pass, deployment succeeds, or API responds alone. These are engineering evidence only.

**The browser is where the Grand King experiences EmpireAI.** Production browser behaviour is the highest operational acceptance.

---

## 2. Browser Truth principles

| Higher | Lower |
|--------|-------|
| Production Browser | Automated Tests |
| Repository | Local Build |
| Real User Behaviour | Implementation Assumptions |
| Grand King Acceptance | Engineering Completion |

---

## 3. Browser acceptance pipeline

```
Repository Acceptance
  → Automated Validation
  → Deployment
  → Production Browser Verification
  → Grand King Browser Verification
  → Mission Complete
```

**Runtime:** `executeBrowserVerificationPipeline()` · `BROWSER_ACCEPTANCE_PIPELINE`

---

## 4. Browser verification dimensions

Every production feature shall verify: Authentication · Navigation · Rendering · Interaction · Latency · State Persistence · Session Continuity · Business Logic · Visual Accuracy · Error Handling · Recovery Behaviour.

**Runtime:** `BROWSER_VERIFICATION_DIMENSIONS`

---

## 5. Production scenarios

Fresh Login · Returning Login · Session Resume · Logout · Navigation · Refresh · Browser Close · Browser Reopen · Network Delay · Temporary Failure · Recovery.

**Runtime:** `PRODUCTION_SCENARIOS`

---

## 6. Mandatory browser evidence

Every completed mission shall include: Browser Screenshots · Browser Recording (where applicable) · Production URL · Feature Tested · Test Results · Observed Behaviour · Known Limitations · Acceptance Status.

**Runtime:** `BrowserEvidencePackage` · `MANDATORY_BROWSER_EVIDENCE_FIELDS`

---

## 7. Grand King acceptance — triple PASS

| Tier | Required |
|------|----------|
| Repository Acceptance | **PASS** |
| Production Acceptance | **PASS** |
| Grand King Acceptance | **PASS** |

Mission completion requires **PASS · PASS · PASS**.

**Runtime:** `evaluateTripleAcceptance()`

---

## 8. Pillow continuous comparison

Pillow compares: Repository Behaviour → Production Behaviour → Browser Behaviour → Expected Behaviour → Browser Truth.

Detects: Browser Drift · Production Drift · UX Drift · Regression.

**Runtime:** `compareBehaviourLayers()` · `detectBrowserDrift()`

---

## 9. Integration map

| Surface | Path |
|---------|------|
| Browser Truth engine | `pillow/src/browser-truth/engine.ts` |
| Builder gate | Cursor Bridge + Cursor Protocol pre-mission checks |
| Supervisor | Launch validation · browser acceptance monitoring |
| Cockpit | Browser Truth panel · `GET /api/pillow/browser-truth` |
| Journey script | `backend/scripts/production-journey-verify.mjs` (HTTP companion) |

---

## 10. Governance cross-references

- [`EMPIREAI_PRODUCTION_TRUTH.md`](./EMPIREAI_PRODUCTION_TRUTH.md)  
- [`EMPIREAI_RECOVERY_DOCTRINE_SYSTEM.md`](./EMPIREAI_RECOVERY_DOCTRINE_SYSTEM.md)  
- [`EMPIREAI_ENGINEERING_STANDARDS.md`](./EMPIREAI_ENGINEERING_STANDARDS.md)  
- [`EMPIREAI_BUILDER_ARCHITECTURE.md`](../architecture/EMPIREAI_BUILDER_ARCHITECTURE.md)  

**Ratified:** 2026-07-05 (P4-06)

**Successor:** P4-08 — Journey (see [`EMPIREAI_E2E_TESTING_SYSTEM.md`](./EMPIREAI_E2E_TESTING_SYSTEM.md))
