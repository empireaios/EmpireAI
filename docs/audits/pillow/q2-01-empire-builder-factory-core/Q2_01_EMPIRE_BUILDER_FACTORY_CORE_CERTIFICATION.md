# Q2-01 Empire Builder Factory Core

**Status:** FINAL PASS  
**Doctrine:** PILLOW-EBF-001  
**Programme:** Q2 — Empire Builder Factory  
**Mission:** Q2-01 Empire Builder Factory Core  
**Primary Deliverable:** Turn a Grand King command into a complete business-building mission.

> Doctrine ID uses **PILLOW-EBF-001**. Empire Builder Factory Core creates mission containers only; it never interprets detailed strategy, generates models, researches markets, assigns workers, executes/launches businesses, or implements Q2-02+.

## How Q2-01 works

1. A Grand King business command is accepted.
2. A Business Build Mission container is created (`EBF-BBM-v1`).
3. Intended business type is classified from the command (or explicit override).
4. Mission objective, expected output and approval status are captured.
5. The mission is prepared for later Q2 workers with full Grand King traceability (`EBF-001-v1`).

## Prerequisites

- Q1 Workforce Factory Certification (`PILLOW-WFC-001` / Q1-13)

## Business types

`media`, `commerce`, `local_cleaning`, `affiliate`, `digital_product`, `local_services`, `saas`, `agency`, `unknown`

## Verification

`npx --yes tsx --test "src/validation/tests/empire-builder-factory-core.test.ts"` — 10 passing, 0 failing.
