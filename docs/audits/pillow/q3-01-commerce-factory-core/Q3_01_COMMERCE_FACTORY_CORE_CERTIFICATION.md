# Q3-01 Commerce Factory Core

**Status:** FINAL PASS  
**Doctrine:** PILLOW-CMF-001  
**Programme:** Q3 — Commerce Factory  
**Mission:** Q3-01 Commerce Factory Core  
**Primary Deliverable:** Turn an approved Business Blueprint + Business Approval Pack into a complete Commerce Build Mission.

> Doctrine ID uses **PILLOW-CMF-001** (not CFC). Commerce Factory Core creates mission containers only; it never builds stores, imports products, configures marketplaces, executes commerce implementation, overrides Pillow/Grand King, or implements Q3-02+.

## How Q3-01 works

1. An approved Business Blueprint (Q2-06) and Business Approval Pack (Q2-09) are received.
2. Grand King approval, blueprint completeness, and implementation prerequisites are verified.
3. A Commerce Build Mission container is created (`CMF-CBM-v1`).
4. Commerce category is classified from the blueprint/pack (or explicit override).
5. The mission is registered with Mission Coordination and submitted via ERR with full Q2 traceability (`CMF-001-v1`).

## Prerequisites

- Q2 Empire Builder Certification (`PILLOW-EBC-001` / Q2-10)
- Approved Business Blueprint + Proceed Business Approval Pack with Grand King approval

## Commerce categories

`online_store`, `marketplace`, `dropshipping`, `subscription_commerce`, `wholesale`, `hybrid_commerce`, `unknown`

## Verification

`npx --yes tsx --test "src/validation/tests/commerce-factory-core.test.ts"` — 10 passing, 0 failing.
