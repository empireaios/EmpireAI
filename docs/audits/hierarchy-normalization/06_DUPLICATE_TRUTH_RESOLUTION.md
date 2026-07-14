# 06 — Duplicate Truth Resolution

**Total duplicate concept groups identified:** 28  
**Resolution strategy:** Reclassify — do not delete in normalization phase

---

## Resolution Matrix

| # | Duplicate concept | Instances | Resolution | Target classification |
|---|-------------------|-----------|------------|----------------------|
| 1 | Supreme commercial law | CTD vs references in Engineering Constitution | **Keep both** — CTD apex; Engineering defers | CTD=CANONICAL; cross-refs explicit |
| 2 | Engineering law | EMPIREAI_CONSTITUTION vs "Autonomous Engineering Constitution" (intended) | **Merge conceptually** — intended name maps to Engineering Constitution + Cursor doctrines | No new file; hierarchy one-pager |
| 3 | Pillow master identity | EMPIREAI_PILLOW_CONSTITUTION vs PILLOW_ARCHITECTURE_CONTRACT | **Keep both** — identity vs interface contract | Both CANONICAL, different slots |
| 4 | Pillow executive constitution (title) | Root EI constitution vs docs/EI/PILLOW_EXECUTIVE_CONSTITUTION | **Rename display only** — "EI Pillow Executive Roles" for docs copy | Both CANONICAL, distinct titles |
| 5 | Architecture normative | CANONICAL_ARCHITECTURE vs ARCHITECTURE.md | **Keep both** — normative vs operational | Canonical + Operational |
| 6 | Architecture living memory | EMPIREAI_ARCHITECTURE.md vs canonical | **Demote** living memory | OPERATIONAL MEMORY |
| 7 | Architecture obsolete | SYSTEM_ARCHITECTURE.md cluster | **Historical** | HISTORICAL — do not cite |
| 8 | V1 Bible | hierarchy bible vs master build bible | **One canonical** — hierarchy bible | hierarchy=CANONICAL; master=HISTORICAL |
| 9 | MCL Bible | MISSION_CONTROL_BUILD_BIBLE | **Scoped operational** | OPERATIONAL (backend scope only) |
| 10 | Master Roadmap | EMPIREAI_ROADMAP vs implied roadmap in Bible | **Keep both** — roadmap=direction; bible=structure | Complementary |
| 11 | Pillow Roadmap vs Integration plan | PILLOW_ROADMAP vs PILLOW_RUNTIME_INTEGRATION_PLAN | **Historical** integration plan | INTEGRATION PLAN=HISTORICAL |
| 12 | Vision | Missing VISION vs MARKETPLACE_OS_VISION | **Author Vision**; marketplace=input | Merge into EMPIREAI_VISION.md |
| 13 | Soul doc vs soul module | EMPIREAI_SOUL.md vs foundation/soul-file | **Keep both** — doc=canonical; module=runtime | Linked in index |
| 14 | Grand King UX surface | frontend/ vs empireai-web/ | **ADR required** — one production Cockpit authority | Pending CON-006 |
| 15 | Dashboard vs Cockpit | frontend dashboard routes vs cockpit | **Retire "Dashboard"** in canon — use Founder Shell + Cockpit | Naming only |
| 16 | Platform vs Cockpit routes | empireai-web/platform vs cockpit | **Platform=legacy alias** | Redirect documented |
| 17 | Production deployment truth | MANAGED_DEPLOYMENT vs vercel configs vs readiness checker | **Consolidate** into EMPIREAI_PRODUCTION_TRUTH.md | Future canonical |
| 18 | Executive audit index | 32 listed vs 38 on disk | **Update index** | Add 6 missing entries |
| 19 | Repository index vs Journey | MASTER_INDEX vs JOURNEY | **Keep both** — index=catalog; journey=status | Complementary |
| 20 | EI constitution EI1 vs CTD | EI1_EMPIRE_CONSTITUTION vs CTD | **EI1 defers to CTD** | Explicit in hierarchy one-pager |
| 21 | Commerce OS vision | COMMERCE_OS_BLUEPRINT vs COMMERCE_CANON | **Keep both** — blueprint vs canon | Both CANONICAL, different scope |
| 22 | Combined audits vs artifacts audits | Root COMBINED_* vs artifacts/g*-audit | **Both EVIDENCE** — index links both | EVIDENCE |
| 23 | REAL namespace vs runtime folder | "REAL" term vs backend/src/runtime | **REAL=mission ID; Runtime modules=code name** | ECNS-1 |
| 24 | Pillow package vs Pillow host | pillow/ vs pillow-host/ | **Keep separate** — library vs Brain adapter | Document in architecture tree |
| 25 | Builder vs Store Builder | Cursor Bridge vs store-builder agent | **Keep separate** | Builder layer doc |
| 26 | Guardian vs health/live | Guardian engine vs minimal liveness | **Keep separate** — liveness=probe; Guardian=full | Operational doc |
| 27 | docs/README vs docs content | Stale scaffold statement | **Update README** | OPERATIONAL fix |
| 28 | Production Pillow COI vs full Pillow | Minimal chat vs full package | **Document production mode** — not duplicate, mode split | EMPIREAI_PRODUCTION_TRUTH.md |

---

## Merge Actions (Implementation Phase — Docs Only)

| Action | Inputs | Output |
|--------|--------|--------|
| Vision merge | MARKETPLACE_OS_VISION + Soul + CTD preamble | `EMPIREAI_VISION.md` |
| Production truth merge | MANAGED_DEPLOYMENT + readiness + route policy + Pillow mode | `EMPIREAI_PRODUCTION_TRUTH.md` |
| Constitution map | All Tier 3 law docs | `EMPIREAI_CONSTITUTION_HIERARCHY.md` |
| Index refresh | All classifications | Updated MASTER_INDEX |

---

## Do Not Merge (Must Stay Separate)

- CTD and Engineering Constitution (different jurisdiction)  
- Pillow Constitution and Pillow EI Constitution (identity vs cognition)  
- Canonical Architecture and Operational Architecture Guide (normative vs dev)  
- Evidence audits and canonical law (immutable vs living)  
- Brain and Pillow packages (execution vs COI)  

---

## Conflict Resolutions (Content)

| Conflict | Winner | Loser status |
|----------|--------|--------------|
| SYSTEM_ARCHITECTURE vs Pillow hierarchy | Pillow-owned hierarchy (CTD + Canonical Architecture) | SYSTEM_ARCHITECTURE → HISTORICAL |
| CTD vs Engineering on commercial matters | CTD | Engineering defers (already stated) |
| hierarchy bible vs master bible | hierarchy bible | master → HISTORICAL |
| frontend as sole UX vs empireai-web Cockpit | **Pending ADR** | Both remain until decided |
