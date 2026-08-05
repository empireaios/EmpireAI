# Q2-03 Business Model Generator

**Status:** FINAL PASS  
**Doctrine:** PILLOW-EMG-001  
**Programme:** Q2 — Empire Builder Factory  
**Mission:** Q2-03 Business Model Generator  
**Primary Deliverable:** Convert structured business intent into a complete business model ready for validation.

> Doctrine ID uses **PILLOW-EMG-001** (`empire-builder-model-generator`). This is distinct from X1-04 `business-model-generator` (`PILLOW-BMG-001`). Blueprint-only: never validates demand, researches markets, builds branding, assigns workers, launches businesses, or implements Q2-04+.

## How Q2-03 works

1. Structured Business Intent from Q2-02 is received.
2. Business model type is determined.
3. Value proposition, products/services, and customer segments are defined.
4. Revenue, cost, and operating models are defined.
5. Required capabilities, integrations, and assumptions are recorded.
6. A machine-readable Business Model (`EMG-MDL-v1` / `EMG-001-v1`) is produced for later Q2 missions.

## Prerequisites

- Q2-02 Business Idea Interpreter (`PILLOW-BII-001`)

## Verification

`npx --yes tsx --test "src/validation/tests/empire-builder-model-generator.test.ts"` — 10 passing, 0 failing.
