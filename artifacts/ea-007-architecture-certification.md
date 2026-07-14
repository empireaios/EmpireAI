# EA-007 — Architecture Certification

**Mission:** EA-007 — Architecture Certification  
**Authority:** Grand King Architecture Directive · EA-001 through EA-006  
**Date:** 2026-07-02  
**Status:** **COMPLETE**  
**Scope:** Final architecture certification · **No implementation modified**

---

## Verdict

# PASS WITH CONDITIONS

EmpireAI **satisfies the Registry-Driven Operating System (RDOS) doctrine at the architecture layer**. The doctrine is documented, sequenced, and partially implemented. **Full runtime compliance is not yet achieved** — LEGACY consumers, unwired registries, and undelivered PluginHost / Capability Discovery Service remain as **certified architectural debt** with explicit migration paths.

**Recommendation:** **Freeze EA architecture** at EA-007. Resume product development under **G3 Executive AI Engines** (starting **G3-02 Market Intelligence Engine**), applying EA-004 migration rules for all new code.

---

## 1. Certification Scope

| Pillar | Artifacts reviewed | Implementation sampled |
|--------|-------------------|------------------------|
| Hardcodes | EA-001 `architecture-hardcode-governance-audit.md` | Grep: `amazon-us`, seed imports, V1 constants |
| Registries | EA-002 `ea-002-canonical-registry-architecture.md` | `backend/src/registry/types/registry-ids.ts` |
| Loaders | EA-003 `ea-003-registry-loader-foundation-executive-audit.md` | `backend/src/registry/registry-loader.ts` |
| Migration | EA-004 `ea-004-registry-migration-standard.md` | Consumer inventory §9 |
| Plugins | EA-005 `ea-005-plugin-framework.md` | No `PluginHost` in codebase |
| Discovery | EA-006 `ea-006-dynamic-capability-discovery.md` | No `CapabilityDiscoveryService` in codebase |
| Governance | GVD catalog, ADR-052, EA-004 §7 | Doctrine + migration gates |
| G3 alignment | G3-01, G3 dynamic discovery audits | PIE + `intelligence-market-discovery.ts` |

---

## 2. Registry-Driven Operating System Doctrine

### 2.1 Doctrine statement (certified)

> **Business knowledge lives in registries and plugins. Engines, evaluators, and UI loaders discover it through RegistryLoader and Capability Discovery — they do not embed commercial scope, thresholds, or topology as code literals.**

### 2.2 Doctrine satisfaction matrix

| Criterion | Architecture | Implementation | Certified |
|-----------|--------------|----------------|-----------|
| Single registry hierarchy (20 domains, 5 tiers) | EA-002 ✅ | Registry IDs in code ✅ | ✅ |
| One loader facade | EA-002/003 ✅ | `getRegistryLoader()` ✅ | ✅ |
| Append-to-extend (no engine patches for new markets) | EA-002/005 ✅ | PIE discovery path ✅ | ✅ **partial** |
| Migration standard for LEGACY retirement | EA-004 ✅ | Not executed | ⚠️ |
| Plugin register-don't-patch | EA-005 ✅ | Placeholder only | ⚠️ |
| Unified capability discovery | EA-006 ✅ | DERIVED-DISCOVERY-SNAPSHOT only | ⚠️ |
| Governance gates (King, ADR, GVD) | EA-004/005 ✅ | Documented | ✅ |
| New code READY-only | EA-004 ✅ | Policy only | ⚠️ |

**Overall RDOS:** **Architecture PASS** · **Runtime PARTIAL** → **PASS WITH CONDITIONS**

---

## 3. Pillar Reviews

### 3.1 Hardcodes (EA-001)

| Finding | Status |
|---------|--------|
| ~85 significant business hardcodes identified | Documented ✅ |
| Classification framework (Infrastructure / Security / Technical / Business) | Adopted ✅ |
| Highest-risk duplicates (V1 IDs, thresholds, CIC literals, cockpit engine lists) | **LEGACY — not migrated** |
| PIE no longer hardcodes V1 marketplace array | Fixed (G3 + EA-003) ✅ |
| Threshold sprawl (50/70/72 in 12+ modules) | **LEGACY** |
| Frontend CJ → Amazon US defaults | **LEGACY** |
| 11 cockpit `*DemoData.ts` (Nova Home) | **LEGACY** (demo isolation pending) |

**Score:** Architecture **PASS** · Remediation **IN PROGRESS** (1 consumer domain)

**Condition HC-1:** No new business literals outside `registry/sources/` and approved seeds.  
**Condition HC-2:** G3-02 must use RegistryLoader discovery entry points only.

---

### 3.2 Registries (EA-002)

| Registry tier | Designed | Wired in RegistryLoader | Consumers migrated |
|---------------|----------|-------------------------|-------------------|
| Tier 0 — Doctrine, Business Rules | ✅ | Doctrine ✅ / Rules placeholder | Parallel GVD paths LEGACY |
| Tier 1 — Region, Country, Marketplace, Supplier | ✅ | ✅ | global-commerce service LEGACY |
| Tier 2 — Provider, Integration, Channel, Deployment | ✅ | Channel + Deployment ✅ / Provider placeholder | V1 activation LEGACY |
| Tier 3 — Scoring, Pricing, AI Engine, Workflow | ✅ | Placeholder | cockpit / PIE thresholds LEGACY |
| Tier 4 — Tenant, Company, Brand, Category, Product | ✅ | Placeholder | Brain DB + hardcoded defaults LEGACY |
| Tier 5 — Derived views | ✅ | DISCOVERY-SNAPSHOT ✅ / Activation, Readiness placeholder | PIE PARTIAL |

**Score:** Hierarchy **PASS** · Coverage **PARTIAL**

**Condition REG-1:** New capabilities extend registry rows per EA-002 §7 — no new ad-hoc catalogs.  
**Condition REG-2:** Migration waves W1–W6 per EA-004 §4.1 — parallel to G3, not blocking G3-02 discovery path.

---

### 3.3 Loaders (EA-003)

| Requirement | Evidence |
|-------------|----------|
| `RegistryLoader` facade | `backend/src/registry/registry-loader.ts` ✅ |
| Tier support (all IDs declared) | `registry-ids.ts` ✅ |
| Wired registries (7 + 1 derived) | `FOUNDATION_WIRED_REGISTRY_IDS` ✅ |
| Cache strategy | `registry/cache/registry-cache.ts` ✅ |
| Validation | `registry/validation/registry-validator.ts` ✅ |
| Plugin manifest placeholder | `registerPlugin()` stores manifest; no row injection ⚠️ |
| Proof consumer | `intelligence-market-discovery.ts` → loader ✅ |
| Tests | `ea-003-registry-loader-foundation.test.ts` — 12 tests ✅ |
| Typecheck | Pass at EA-003 delivery ✅ |

**Score:** Foundation **PASS**

**Condition LOAD-1:** Consumers must not import `global-commerce-registry-data` or `marketplace-channel-registry` except `registry/sources/*`.  
**Condition LOAD-2:** `registerPlugin()` row injection deferred to post-freeze implementation mission (optional parallel track).

---

### 3.4 Migration (EA-004)

| Metric | Value |
|--------|-------|
| READY consumers | 8 |
| PARTIAL consumers | 4 |
| LEGACY consumers | 52+ |
| Migration sequence (6 phases) | Defined ✅ |
| Rollback strategy | Defined ✅ |
| Dependency waves W0–W6 | Defined ✅ |
| Mass migration executed | **No** |

**Score:** Standard **PASS** · Execution **NOT STARTED** (beyond W0 proof)

**Condition MIG-1:** Each future EA/G3/B6 mission that touches business scope follows EA-004 template §11.  
**Condition MIG-2:** LEGACY inventory treated as backlog — not certification blockers if doctrine path exists for new work.

---

### 3.5 Plugins (EA-005)

| Requirement | Architecture | Code |
|-------------|--------------|------|
| `EmpirePluginManifest` | ✅ | ❌ |
| `PluginHost` | ✅ | ❌ |
| Layer A registry extension | ✅ | Placeholder `registerPlugin()` only |
| Layer B `IRuntimePlugin` | B-001 exists | `RuntimePluginRegistry` — not unified under PluginHost |
| Permissions (OAR-003) | ✅ | `permission-matrix.ts` — not manifest-bound |
| Lifecycle / certification | ✅ | Partial in runtime-plugin-types |

**Score:** Framework **PASS** · Integration **NOT IMPLEMENTED**

**Condition PLG-1:** Built-in plugins only until PluginHost (post-freeze or parallel).  
**Condition PLG-2:** G3-02 AI engine registers via future REG-AI-ENGINE row + module pattern — not runtime plugin until W3.

---

### 3.6 Discovery (EA-006)

| Requirement | Architecture | Code |
|-------------|--------------|------|
| `CapabilityDiscoveryService` | ✅ | ❌ |
| Full snapshot (7 domains + plugins) | ✅ | Partial — `DiscoverySnapshotView` only |
| Cache / refresh / lifecycle | ✅ | RegistryLoader 30s derived cache only |
| Dependency graph | ✅ | `V1_DEPENDENCY_EDGES` hardcoded in cockpit LEGACY |
| Failure behaviour | ✅ | Not implemented |
| G3-02 entry | ✅ | `buildMarketIntelligenceDiscoveryView()` ✅ |

**Score:** Model **PASS** · Service **NOT IMPLEMENTED**

**Condition DISC-1:** G3-02 and PIE use `resolveDiscoverySnapshot()` / `buildMarketIntelligenceDiscoveryView()` until CDS ships.  
**Condition DISC-2:** CDS implementation is **optional parallel track** — not a G3-02 prerequisite.

---

### 3.7 Governance

| Mechanism | Status |
|-----------|--------|
| GVD-001–030 immutable doctrine | Active ✅ |
| ADR-052 V1 channel registry | Governance doc ✅ · deployment registry ✅ |
| EA-004 King/ADR approval matrix | Documented ✅ |
| EA-005 irreversible capability gates | Documented ✅ |
| EA-001 King approval queue (7 items) | Documented — **pending King sign-off** |
| CI hardcode lint | Proposed — **not implemented** |
| `EMPIREAI_DECISIONS.md` traceability | Expected for Tier 0–2 changes ✅ |

**Score:** **PASS WITH CONDITIONS** (King queue open; CI guard not built)

**Condition GOV-1:** Tier 0–2 registry/plugin changes require ADR before activation.  
**Condition GOV-2:** King approval queue items may be accepted or deferred during G3 — not EA blockers.

---

## 4. G3 Executive AI Engines Readiness

| Gate | Status | Notes |
|------|--------|-------|
| G3-01 Product Intelligence Engine | ✅ Complete | Architecture + loader-backed discovery |
| G3 dynamic market discovery correction | ✅ Complete | EA-003 proof consumer |
| G3-02 Market Intelligence Engine | ⛔ Not started | **Cleared to start** post EA-007 freeze |
| G3-02 discovery path | ✅ Ready | `buildMarketIntelligenceDiscoveryView()` |
| G3-02 must not hardcode markets | ✅ Rule certified | EA-001/006/004 |
| Commerce-intelligence-core literals | ⚠️ LEGACY | G3-02 should not copy pattern; migrate when touching CIC |

**G3 certification:** **CLEARED** to resume under RDOS rules.

---

## 5. Remaining Architectural Debt

Prioritized backlog — **does not invalidate EA-007** if G3 follows EA-004 for new code.

### 5.1 P0 — High impact (parallel or pre-prod)

| ID | Debt | Source | Remediation |
|----|------|--------|-------------|
| AD-P0-01 | `version-1-activation-config.ts` duplicates deployment channels | EA-001 BH-001 | EA-004 W1: REG-DEPLOYMENT-PROFILE |
| AD-P0-02 | `global-commerce-registry-service` bypasses RegistryLoader | EA-004 §9.3 | Thin delegate to loader |
| AD-P0-03 | `commerce-intelligence-core` `amazon-us` literals | EA-001 BH-003 | Discovery snapshot context |
| AD-P0-04 | Scoring threshold sprawl (12+ modules) | EA-001 BH-010–014 | REG-SCORING-POLICY when wired |
| AD-P0-05 | `cockpit-panel-views` Amazon-only marketplace panel | EA-001 BH-005 | REG-CHANNEL via loader |

### 5.2 P1 — Framework completion (post-freeze optional)

| ID | Debt | Remediation |
|----|------|-------------|
| AD-P1-01 | PluginHost not implemented | EA-005 → implementation mission |
| AD-P1-02 | `registerPlugin()` does not inject registry rows | EA-005 Layer A |
| AD-P1-03 | CapabilityDiscoveryService not implemented | EA-006 → EA-007+ impl |
| AD-P1-04 | DERIVED-ACTIVATION / READINESS snapshots placeholder | W1/W2 |
| AD-P1-05 | REG-PROVIDER, REG-INTEGRATION, REG-AI-ENGINE unwired | EA-004 waves |

### 5.3 P2 — Hygiene

| ID | Debt | Remediation |
|----|------|-------------|
| AD-P2-01 | 52+ LEGACY consumers | Incremental EA-004 migrations |
| AD-P2-02 | Frontend LaunchCenter / discovery defaults | Workspace profile API |
| AD-P2-03 | Cockpit demo data bleed risk | Demo mode gate |
| AD-P2-04 | CI hardcode lint | EA-004 §6.3 |
| AD-P2-05 | `intelligence-market-discovery` residual `getDeploymentChannelProfile` import | EA-004 PARTIAL → READY |
| AD-P2-06 | RuntimePluginRegistry vs PluginHost duplication | EA-005 unification |

### 5.4 Debt summary

| Severity | Count | Blocks G3-02? |
|----------|-------|---------------|
| P0 | 5 | **No** (if G3-02 uses loader discovery) |
| P1 | 5 | No |
| P2 | 6 | No |

---

## 6. Conditions for Full PASS (future EA-008+ or ops milestone)

All conditions below are **waived for G3-02 start** if EA-007 conditions §7 are met.

| # | Condition | Target |
|---|-----------|--------|
| C1 | LEGACY consumer count reduced ≥50% from EA-004 baseline | W1–W3 complete |
| C2 | PluginHost + Layer A row injection operational | EA-005 impl |
| C3 | CapabilityDiscoveryService replaces ad-hoc discovery helpers | EA-006 impl |
| C4 | REG-SCORING-POLICY wired; threshold duplication eliminated | W2 |
| C5 | CI hardcode lint enforced | EA-004 §6.3 |
| C6 | King approval queue resolved or explicitly deferred in ADR | GOV |

**Upgrade path:** EA-008 **Architecture Re-certification** when C1–C3 complete.

---

## 7. EA-007 Binding Conditions (active during G3 phase)

These **must** hold for all G3 Executive AI Engine work:

| ID | Condition |
|----|-----------|
| **EC-1** | No new business hardcodes in intelligence engines — RegistryLoader or CDS projections only |
| **EC-2** | G3-02 discovers markets via `buildMarketIntelligenceDiscoveryView()` / `resolveDiscoverySnapshot()` |
| **EC-3** | New registry rows follow EA-002 append model; no closed union types for marketplace IDs |
| **EC-4** | EA architecture documents **frozen** — changes require EA-008 amendment mission |
| **EC-5** | Implementation debt logged in §5 when touched; no silent regressions to LEGACY patterns |
| **EC-6** | G3-02 remains **architecture + engine logic** scope — PluginHost/CDS full impl not required first |

---

## 8. Artifact Chain Certification

| Mission | Artifact | Certified |
|---------|----------|-----------|
| EA-001 | `architecture-hardcode-governance-audit.md` | ✅ |
| EA-002 | `ea-002-canonical-registry-architecture.md` | ✅ |
| EA-003 | `ea-003-registry-loader-foundation-executive-audit.md` | ✅ |
| EA-004 | `ea-004-registry-migration-standard.md` | ✅ |
| EA-005 | `ea-005-plugin-framework.md` | ✅ |
| EA-006 | `ea-006-dynamic-capability-discovery.md` | ✅ |
| EA-007 | `ea-007-architecture-certification.md` | ✅ (this document) |
| G3 supporting | `g3-architecture-dynamic-market-discovery-executive-audit.md` | ✅ Aligned |

**EA architecture series:** **COMPLETE AND FROZEN** as of EA-007.

---

## 9. Scorecard

| Pillar | Weight | Score (0–100) | Weighted |
|--------|--------|---------------|----------|
| Hardcode governance | 15 | 72 | 10.8 |
| Registry hierarchy | 20 | 95 | 19.0 |
| RegistryLoader | 20 | 88 | 17.6 |
| Migration standard | 10 | 90 | 9.0 |
| Plugin framework | 15 | 75 | 11.3 |
| Discovery model | 15 | 70 | 10.5 |
| Governance | 5 | 85 | 4.3 |
| **Total** | **100** | — | **82.5** |

**Interpretation:** 82.5/100 — strong architecture, partial runtime. **PASS WITH CONDITIONS**.

---

## 10. Recommendation

### 10.1 Freeze EA architecture

| Action | Detail |
|--------|--------|
| **Freeze** | EA-001 through EA-007 documents are the authoritative RDOS specification |
| **Amendments** | Only via explicit **EA-008+** mission with King/Architect approval |
| **Implementation** | Debt items §5 may proceed **without** reopening architecture unless doctrine change |

### 10.2 Return development to G3 Executive AI Engines

| Step | Mission |
|------|---------|
| 1 | **G3-02 — Market Intelligence Engine** (architecture + Brain + Cockpit wiring) |
| 2 | Use loader-backed discovery; register engine in future REG-AI-ENGINE row when W3 migrates |
| 3 | Do not block on PluginHost, CDS, or mass LEGACY migration |
| 4 | Follow EA-004 six-phase migration for any G3 touch of LEGACY modules |
| 5 | Continue G3-03+ engines on same RDOS rules |

### 10.3 Explicit non-goals post-freeze

- No EA-008 unless King requests full PASS upgrade or doctrine change  
- No mass migration sprint — incremental only  
- No Cockpit redesign  
- No live API connections unless mission explicitly scopes them  

---

## 11. Sign-Off Summary

| Field | Value |
|-------|-------|
| **Certification** | **PASS WITH CONDITIONS** |
| **RDOS doctrine** | **Satisfied (architecture)** · **Partial (runtime)** |
| **EA series** | **COMPLETE — FROZEN** |
| **G3-02** | **AUTHORIZED TO START** |
| **Architectural debt** | **16 tracked items** (§5) |
| **Date** | 2026-07-02 |

---

*EA-007 Architecture Certification · Final EA mission · Resume G3 Executive AI Engines*
