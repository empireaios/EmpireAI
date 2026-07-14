# G3-05 — Quantitative Intelligence Engine · Executive Audit

**Mission:** G3-05 — Quantitative Intelligence Engine  
**Authority:** Grand King · G3-01 · G3-02 · G3-03 · G3-04 complete  
**Date:** 2026-06-21  
**Status:** **COMPLETE**  
**Scope:** Mathematics only — **no executive decisions** · **G3-06 not started**

---

## Executive Summary

EmpireAI's **Quantitative Intelligence Engine** — the mathematical reasoning layer of the Executive AI Engine stack — is architecturally defined and wired into Brain and Cockpit. The engine performs statistics, forecasting, probability, optimisation, sensitivity analysis, and simulation. **It does not make executive decisions.**

**Design principle:** QIE consumes scores and confidences from G3-01–G3-04 as mathematical inputs, applies registry-scoped models, and emits structured model results only.

**Cockpit route:** `/cockpit/intelligence/discovery` (SCR-102)  
**Brain module:** `quantitative-intelligence-engine`  
**Artifact ref:** Set on `loadQuantitativeIntelligenceEnginePanel().executiveAudit.artifactRef`

---

## 1. Architecture

```
Grand King (Cockpit SCR-102)
  │
  ├─ quantitative-intelligence-engine.load → compact engine panel
  └─ quantitative-intelligence-engine.architecture → full G3-05 engine view
  │
  ▼
Quantitative Intelligence Engine (G3-05)
  │
  ├─ Input feeds: PIE · MIE · SIE · FIE (scores + confidences)
  ├─ RegistryLoader → scoring policy + discovery scope
  ├─ 8 mathematical models (deterministic architecture)
  └─ Model Result Contract — five fields, no executive output
  │
  ▼
Downstream executive engines (consume math — QIE does not decide)
```

### Decision policy

| Rule | G3-05 enforcement |
|------|-------------------|
| **Mathematics only** | All outputs are Model · Inputs · Outputs · Confidence · Evidence |
| **No executive decisions** | No SELL / ENTER / INVEST / recommendedAction fields |
| **No Brain recommendations[]** | Module contract returns empty recommendations array |
| **Explicit scope gate** | `decisionPolicy: mathematics_only_no_executive_decisions` |

---

## 2. Engine Components

### Core capabilities (8)

| # | Capability | Model | Status |
|---|------------|-------|--------|
| 1 | Statistical modelling | ProductScoreDistribution v1 | Live |
| 2 | Predictive modelling | LinearRankTrend v1 | Partial |
| 3 | Forecasting | CompositeIndexForecast v1 | Partial |
| 4 | Probability | EmpiricalThresholdProbability v1 | Partial |
| 5 | Optimisation | ScoreWeightNormalisation v1 | Architecture |
| 6 | Sensitivity analysis | MarginPerturbationSensitivity v1 | Partial |
| 7 | Simulation | DeterministicMonteCarlo v1 | Architecture |
| 8 | Confidence modelling | UpstreamMetaConfidence v1 | Live |

### Five-field model result contract

Every model result exposes:

| Field | Content |
|-------|---------|
| **Model** | Model name and version identifier |
| **Inputs** | Structured input parameters used in computation |
| **Outputs** | Structured numerical / categorical results |
| **Confidence** | Model confidence score (0–100) |
| **Supporting Evidence** | Source labels tracing inputs and method |

**Explicitly excluded:** recommendation, recommendedAction, executive verdict.

### Brain module contract

| Capability | Purpose |
|------------|---------|
| `quantitative-intelligence.architecture` | Return G3-05 architecture document |
| `quantitative-intelligence.compute` | Run all models, return results |
| `quantitative-intelligence.analyse` | Alias for full model computation |
| `quantitative-intelligence.simulate` | Return simulation model result only |

---

## 3. Data Flow

```
1. Input aggregation
   G3-01 PIE + G3-02 MIE + G3-03 SIE + G3-04 FIE → score populations

2. Registry scope
   REG-SCORING-POLICY + discovery snapshot → model universe bounds

3. Computation
   8 mathematical models → QuantitativeModelResultContract[]

4. Output
   Model results → Cockpit SCR-102 → executive engines (optional consumers)

5. Decision boundary
   QIE stops at mathematics — executive engines apply decisions separately
```

---

## 4. Integration Map (Input Feeds Only)

| Engine | Relationship | Purpose |
|--------|--------------|---------|
| **Product Intelligence Engine** | Feeds | Product score population |
| **Market Intelligence Engine** | Feeds | Market opportunity scores |
| **Supplier Intelligence Engine** | Feeds | Supplier trust scores |
| **Financial Intelligence Engine** | Feeds | Financial scenario scores |

All integrations are **feeds only** — QIE never emits decisions back as executive recommendations.

---

## 5. EC Compliance (EA-007)

| Constraint | G3-05 compliance |
|------------|-------------------|
| **EC-1** No hardcoded business lists | ✅ Registry-scoped discovery |
| **Registry-driven thresholds** | ✅ REG-SCORING-POLICY proxy |
| **No live data pipelines** | ✅ Derived from G3 engine views |
| **EA architecture frozen** | ✅ No EA-001–007 structural changes |

---

## 6. Files Delivered

| Layer | Path |
|-------|------|
| Architecture + models | `backend/src/intelligence/quantitative-intelligence-engine/engine-architecture.ts` |
| Brain module contract | `backend/src/intelligence/quantitative-intelligence-engine/module-contract.ts` |
| Module index | `backend/src/intelligence/quantitative-intelligence-engine/index.ts` |
| Cockpit view loader | `backend/src/domain/services/quantitative-intelligence-engine-views.ts` |
| Panel wiring | `cockpit-panel-views.ts` (replaced G4-04 placeholder) |
| Brain capabilities | `capabilities.ts` (extended) |
| Brain tools | `quantitative_intelligence_engine.load_view`, `load_panel` |
| Brain route | `quantitative-intelligence-engine` module |
| Permissions | `auth/permissions.ts` |
| Interaction registry | `cockpit-interaction-layer.ts` SCR-102 |
| Frontend panel | `IntelligenceEnginePanels.tsx` |
| Tests | `g3-05-quantitative-intelligence-engine.test.ts` |

---

## 7. Brain Dispatch

### Load compact Cockpit panel

```http
POST /api/brain/dispatch
{
  "module": "quantitative-intelligence-engine",
  "action": "load"
}
```

### Run all models

```http
POST /api/brain/dispatch
{
  "module": "quantitative-intelligence-engine",
  "action": "compute"
}
```

---

## 8. Verification

```bash
cd backend
node --import tsx --test src/validation/tests/g3-05-quantitative-intelligence-engine.test.ts
```

**Manual:** Log in → Intelligence → Quantitative Intel → verify panel shows 8 models, "Math only" decision policy, and no executive recommendation rows.

---

## 9. Mission Gate

**G3-05 complete.** Mathematical reasoning engine defined and wired. No executive decisions emitted.  
**G3-06 not started** per mission directive.

---

## 10. Future Expansion

| Item | Gate |
|------|------|
| Bayesian posterior updates | Live telemetry mission |
| REG-SCORING-POLICY wired thresholds | EA-008+ |
| GPU simulation batches | Infrastructure mission |
| Canvas model explorer | G4+ UX mission |
