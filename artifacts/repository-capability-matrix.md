# Repository Capability Matrix

**Mission:** Pillow Completion Programme — COMPLETE (2026-07-03)  
**Baseline:** `artifacts/empireai-version-1-build-hierarchy-bible.md`  
**Date:** 2026-07-03 (updated post-completion)  
**Type:** Repository verification only

---

## Classification Key

| Code | Status |
|------|--------|
| **C** | COMPLETE |
| **H** | BUILT BUT HIDDEN |
| **D** | BUILT BUT DISCONNECTED |
| **P** | PLACEHOLDER / SANDBOX |
| **M** | MISSING |

**Stack key:** `EW` = empireai-web · `BR` = Brain dispatch · `RT` = HTTP routes · `TS` = tests/audit

---

## 1. Pillow

| Capability | C/H/D/P/M | EW | BR | RT | TS | Path / notes |
|------------|-----------|----|----|----|----|--------------|
| EKLS governance gateway | C | — | indirect | — | ✓ | `orchestration/pillow/ekls/` |
| G5 Pillow approval router | C | partial | ✓ | — | ✓ | Unified via canonical-pillow-approval-pipeline |
| G6/G8/version Pillow governance | C | partial | ✓ | — | ✓ | Validators across programmes |
| G4-09 Global AI Assistant shell | C | ✓ | ✓ | — | ✓ | `cockpit-global-assistant` |
| Session store + voice UX | C | ✓ | — | — | — | `lib/cockpit/pillow/` |
| Pillow Supervisor snapshot | C | ✓ | ✓ | — | ✓ | NL wired via pillow-host chat |
| `@empireai/pillow` package | C/D | — | via host | — | ✓ | `pillow/src/` |
| Pillow host HTTP API | C | ✓ | — | ✓ | ✓ | `/api/pillow/*`; EW BFF + client |
| Pillow approval gate (Cursor) | C | — | — | ✓ | ✓ | Unified with G5 via canonical pipeline |
| Pillow executive council HTTP | C/D | — | — | ✓ | ✓ | SCR-703 placeholder |
| Executive learning HTTP | C/D | — | — | ✓ | ✓ | No EW client |
| NL chat in empireai-web | C | ✓ | partial | ✓ | ✓ | `/api/pillow/chat` via GlobalAiAssistantProvider |
| Brain tools for pillow-host | C | ✓ | ✓ | ✓ | ✓ | Context via cockpit-global-assistant; chat via host |
| G5→canonical EKLS outcome bridge | C | — | ✓ | — | ✓ | automation-outcome-store + EKLS observations |
| Legacy frontend Pillow UI | C | — | — | redirect | — | Retired; redirects to Cockpit |
| GC-05 legacy global-assistant | C | — | ✓ | gated | ✓ | `EMPIRE_LEGACY_GC05_GLOBAL_ASSISTANT` default off |

---

## 2. Brain

| Capability | C/H/D/P/M | EW | BR | RT | TS | Path / notes |
|------------|-----------|----|----|----|----|--------------|
| Tool registry (~700+ tools) | C | ✓ | ✓ | ✓ | ✓ | `brain/index.ts` |
| Orchestrator dispatch | C | ✓ | ✓ | ✓ | ✓ | `POST /brain/dispatch` |
| Module routes (~642) | C | ✓ | ✓ | ✓ | partial | `module-routes.ts` |
| Governance pre-check | C | — | ✓ | — | ✓ | Before Guardian |
| Guardian pre-check | C | — | ✓ | — | ✓ | `GUARDIAN_ENABLED` default true |
| Intelligence engine contracts (G3) | C | ✓ | ✓ | ✓ | ✓ | 10 engines self-register |
| Cockpit load_view tools | C | ✓ | ✓ | ✓ | ✓ | 45+ load routes |
| Automation→Brain dispatch bridge | C | — | ✓ | — | ✓ | G5 wired |
| Redis / degraded mode | C | — | ✓ | — | ✓ | In-memory fallback |
| Worker pool / scheduler | D | — | ✓ | — | — | `startWorkers` default false in app |
| Route↔tool audit automation | M | — | — | — | partial | Sample tests only |
| infrastructure-commerce tools | M | — | — | — | — | G2 has no Brain tools |
| G7 Grand King ops module routes | C | ✓ | ✓ | ✓ | ✓ | `g7-module-routes.ts` — 120+ routes |

---

## 3. Cockpit

| Capability | C/H/D/P/M | EW | BR | RT | TS | Path / notes |
|------------|-----------|----|----|----|----|--------------|
| 68 page routes | C | ✓ | — | — | — | `app/(cockpit)/` |
| Auth gateway SCR-000 | C | ✓ | — | ✓ | ✓ | `/login` |
| Executive Home SCR-001 | C | ✓ | ✓ | — | ✓ | Live data mode |
| Command/Missions SCR-010/020 | C | ✓ | ✓ | — | ✓ | Live |
| Intelligence SCR-100+ | C | ✓ | ✓ | — | ✓ | Engine panels |
| Commerce SCR-200+ | C | ✓ | ✓ | — | ✓ | Engine centers |
| Finance SCR-400+ | C | ✓ | ✓ | — | ✓ | Live |
| Operations SCR-300–302 | C | ✓ | ✓ | — | ✓ | Live data mode |
| Automation SCR-303 | C | ✓ | ✓ | — | ✓ | G5 wired; live mode |
| Authorization SCR-304 | C | ✓ | ✓ | — | ✓ | G8 wired; live mode |
| Workforce SCR-500+ | P | ✓ | — | — | — | `workforceDemoData.ts` |
| Infrastructure SCR-600+ | P | ✓ | partial | — | — | Demo data; partial Brain |
| Governance SCR-700–704 | P/C mix | ✓ | partial | — | partial | Policies demo; V1 cert partial |
| Development SCR-800+ | C/H | ✓ | ✓ | — | partial | Pillow/ESIS/inspection |
| Legacy `/platform/*` redirects | H | ✓ | — | — | — | 308 to cockpit |
| KPI ledger resolution | C/D | ✓ | ✓ | — | ✓ | Falls back to placeholders |
| Sandbox→live env override (300–302) | D | ✓ | — | — | — | `NEXT_PUBLIC_LIVE_COMMERCE_INTEGRATION_MODE` |

---

## 4. Registry

| Capability | C/H/D/P/M | EW | BR | RT | TS | Path / notes |
|------------|-----------|----|----|----|----|--------------|
| 71 canonical registry IDs | C | — | ✓ | — | ✓ | `registry-ids.ts` |
| 3 derived views | C/P | — | ✓ | — | ✓ | 2 deferred placeholders |
| Registry loader | C | — | ✓ | — | ✓ | `registry-loader.ts` |
| ~49 wired registries | C | — | ✓ | — | ✓ | `FOUNDATION_WIRED_REGISTRY_IDS` |
| ~22 placeholder registries | P | — | ✓ | — | ✓ | Empty/notice rows |
| G8 IAP loaders (12 IDs) | D | — | ✓ | — | ✓ | Loaded but mis-tagged as placeholder |
| Plugin manifest register | P | — | ✓ | — | ✓ | Row injection deferred |
| Automation registry (G5) | C | — | ✓ | — | ✓ | 10 IDs |
| Commerce registry (G2) | C | — | ✓ | — | ✓ | 10 IDs |
| Certification registry (G6) | C | — | ✓ | — | ✓ | 13 IDs |
| Identity registry (G8) | C/D | — | ✓ | — | ✓ | Metadata drift on 12 IDs |

---

## 5. Guardian

| Capability | C/H/D/P/M | EW | BR | RT | TS | Path / notes |
|------------|-----------|----|----|----|----|--------------|
| GuardianEngine | C | — | ✓ | — | ✓ | Always instantiated |
| Dispatch assessDispatch | C | — | ✓ | — | ✓ | When `GUARDIAN_ENABLED` |
| ActionGuard rules | C | — | ✓ | — | ✓ | Workspace, authority, payload |
| Risk registry + recovery plans | C | — | ✓ | — | ✓ | On block |
| Health monitor | C | — | ✓ | — | ✓ | `checkHealth(brain)` |
| HTTP `/guardian/*` API | H | — | — | ✓ | ✓ | No Cockpit UI |
| G5 Guardian recovery bridge | C | — | indirect | — | ✓ | Automation-side |
| Architecture validator | C | — | ✓ | — | ✓ | Foundation cross-check |
| Cockpit Guardian dashboard | M | — | — | — | — | No SCR |

---

## 6. EKLS

| Capability | C/H/D/P/M | EW | BR | RT | TS | Path / notes |
|------------|-----------|----|----|----|----|--------------|
| Governance gateway | C | — | indirect | — | ✓ | All store access gated |
| 5 primary consumer channels | C | ✓ | — | — | ✓ | cockpit, pillow, global-ai-assistant, business-automation, executive-reports |
| 27 subsystem registry | C | — | — | — | ✓ | Mixed data modes |
| G8 runtime EKLS recording | C | — | ✓ | — | ✓ | All G8 services |
| G7 runtime EKLS recording | C | — | ✓ | — | ✓ | Live ops services |
| G6 runtime EKLS recording | C | — | ✓ | — | ✓ | Certification services |
| Version governance EKLS | C | — | ✓ | — | ✓ | V1-LOCK |
| G2 commerce EKLS recording | D | — | — | — | ✓ | Tests only |
| G5 outcome→canonical EKLS | D | — | ✓ | — | ✓ | Parallel store |
| Reality integration EKLS | M | — | — | — | — | No integration |
| Eye-series EKLS | M | — | — | — | — | No integration |
| Vector memory backend | P | — | — | — | — | Reserved |

---

## 7. Commerce

| Capability | C/H/D/P/M | EW | BR | RT | TS | Path / notes |
|------------|-----------|----|----|----|----|--------------|
| G2 infrastructure-commerce module | C/D | — | — | — | ✓ | No Brain tools/routes |
| G2 marketplace/supplier/payment/etc. | C/D | — | — | — | ✓ | Services exist |
| G4 engine center commerce views | C | ✓ | ✓ | — | ✓ | SCR-200+ |
| G7 commerce operations | C/D | — | ✓ | — | ✓ | Brain only |
| commerce-readiness-engine | C | partial | ✓ | ✓ | ✓ | Launch panel |
| marketplace-connection-engine | C | ✓ | ✓ | ✓ | ✓ | SCR-111 |
| Runtime commerce modules | C | partial | ✓ | ✓ | ✓ | REAL programme |
| Live commerce integration mode | D | ✓ | ✓ | — | ✓ | Default sandbox |
| PROOF-001 live revenue | M | — | — | — | — | Business blocker |
| Amazon/CJ/Stripe live creds | D | partial | ✓ | ✓ | — | Env-gated |

---

## 8. Automation

| Capability | C/H/D/P/M | EW | BR | RT | TS | Path / notes |
|------------|-----------|----|----|----|----|--------------|
| G5 trigger engine | C | — | ✓ | ✓ | ✓ | |
| G5 workflow scheduler/queue | C | — | ✓ | ✓ | ✓ | |
| G5 orchestrator/broker | C | — | ✓ | ✓ | ✓ | |
| G5 Pillow approval router | C | — | ✓ | ✓ | ✓ | Self-contained |
| G5 recovery/rollback | C | — | ✓ | ✓ | ✓ | |
| G5 automation plugins | C | — | ✓ | ✓ | ✓ | |
| SCR-303 Automation Centre | C/P | ✓ | ✓ | — | ✓ | Sandbox data mode |
| G7 automation operations | C/D | — | ✓ | — | ✓ | Not routed to Cockpit |
| G5↔pillow-approval HTTP unification | D | — | — | ✓ | ✓ | Parallel systems |
| Production automation persistence | P | — | ✓ | — | ✓ | In-memory stores |

---

## 9. Identity & Authorization

| Capability | C/H/D/P/M | EW | BR | RT | TS | Path / notes |
|------------|-----------|----|----|----|----|--------------|
| G8 platform foundation | C | — | ✓ | — | ✓ | |
| G8 connection registry | C/H | — | ✓ | — | ✓ | Brain only |
| G8 OAuth/auth framework | C/H | — | ✓ | — | ✓ | Brain only |
| G8 credential vault | C/H | — | ✓ | — | ✓ | Redaction enforced |
| G8 connection health | C/H | — | ✓ | — | ✓ | |
| G8 Authorization Centre | C/P | ✓ | ✓ | ✓ | ✓ | SCR-304 sandbox |
| G8 operational readiness | C/H | — | ✓ | — | ✓ | |
| G8 token lifecycle | C/H | — | ✓ | — | ✓ | |
| G8 workspace isolation | C | — | ✓ | — | ✓ | Brain wrap |
| G8 plugin integration | C/H | — | ✓ | — | ✓ | 12 categories |
| G8-10 production certification | C | — | ✓ | — | ✓ | PASS WITH CONDITIONS |
| Live OAuth production flows | D | ✓ | ✓ | — | — | Needs live creds |
| G8 submodule module-routes | D | — | ✓ | — | ✓ | Only auth centre routed |

---

## 10. Reality Integration

| Capability | C/H/D/P/M | EW | BR | RT | TS | Path / notes |
|------------|-----------|----|----|----|----|--------------|
| reality-integration module | C | — | ✓ | ✓ | ✓ | 20+ Brain tools |
| Connector runtime | C/P | — | ✓ | ✓ | ✓ | Structural validation; no live API default |
| SQLite credential vault | C | — | ✓ | ✓ | ✓ | |
| Live commerce config | D | ✓ | ✓ | — | ✓ | Default sandbox |
| operational-access module | C/H | — | ✓ | ✓ | ✓ | No dedicated SCR |
| EAR-001 registry aggregation | C/D | — | ✓ | ✓ | ✓ | Not primary Cockpit path |
| SCR-600 integrations panel | D | ✓ | partial | — | — | Simplified connector list |
| Live Amazon SP-API (REAL-002B) | D | — | ✓ | ✓ | — | Env/creds blocker |
| EKLS integration | M | — | — | — | — | |

---

## 11. Business Engines

| Engine | C/H/D/P/M | EW | BR | RT | Notes |
|--------|-----------|----|----|----|-------|
| ecommerce-os-orchestrator | H | partial | ✓ | ✓ | Launch panel indirect |
| eye-series | H | partial | ✓ | ✓ | No dedicated SCR |
| business-build-engine | H | — | ✓ | ✓ | Brain only |
| business-simulation-engine | H | — | ✓ | ✓ | Brain only |
| product-discovery-opportunity-engine | H | partial | ✓ | ✓ | Discovery pages partial |
| business-opportunity-workspace | H | — | ✓ | ✓ | |
| business-preview-studio | H | — | ✓ | ✓ | |
| market-domination-strategy-engine | H | — | ✓ | ✓ | |
| execution-layer | C | partial | ✓ | ✓ | Commerce/health |
| commerce-readiness-engine | C | ✓ | ✓ | ✓ | Launch readiness |
| account-infrastructure-engine | H | — | ✓ | ✓ | |
| marketplace-connection-engine | C | ✓ | ✓ | ✓ | SCR-111 |
| marketplace-infrastructure-engine | C | ✓ | ✓ | ✓ | SCR-111 |
| objective-management-engine | H | partial | ✓ | ✓ | Missions indirect |
| master-completion-ledger | H | partial | ✓ | ✓ | Dev/governance |
| empire-self-inspection (ESIS) | C | ✓ | ✓ | ✓ | SCR development/inspection |
| operation-first-dollar | H | — | ✓ | partial | PROOF-001 related |
| grand-king-live-operations (G7) | D | — | ✓ | partial | Tools; few routes |
| infrastructure-commerce (G2) | D | partial | — | — | Largest disconnect |

---

## Cross-Subsystem Summary

| Subsystem | C | H | D | P | M | Dominant gap |
|-----------|--:|--:|--:|--:|--:|--------------|
| Pillow | 38 | 8 | 14 | 5 | 7 | Product stack disconnected from EW |
| Brain | 12 | 1 | 3 | 0 | 2 | G2 tools; G7 routes |
| Cockpit | 14 | 1 | 2 | 6 | 0 | Demo surfaces (workforce, infra, governance) |
| Registry | 8 | 0 | 1 | 2 | 0 | G8 metadata drift |
| Guardian | 7 | 1 | 0 | 0 | 1 | No Cockpit SCR |
| EKLS | 8 | 0 | 2 | 1 | 2 | G2/G5 bridges |
| Commerce | 5 | 0 | 6 | 0 | 1 | G2 Brain disconnect |
| Automation | 7 | 0 | 2 | 1 | 0 | Approval unification |
| Identity (G8) | 8 | 5 | 3 | 1 | 0 | Live OAuth |
| Reality Integration | 2 | 1 | 4 | 1 | 1 | Cockpit + live creds |
| Business Engines | 5 | 10 | 3 | 0 | 0 | Hidden Brain tools |

---

*Repository verified 2026-07-03 · Documentation only*
