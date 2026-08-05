# Q0-14 Experience Replay Engine

**Status:** FINAL PASS  
**Doctrine:** PILLOW-XPL-001  
**Programme:** Q0 — Executive Intelligence Factory  
**Mission:** Q0-14 Experience Replay Engine  
**Primary Deliverable:** Learns from completed missions, successes, failures, rejected outputs and Grand King feedback.

> Doctrine ID uses **PILLOW-XPL-001** because `PILLOW-ERE-001` is already reserved by Executive Roadmap/Recommendation modules.

## How Q0-14 works

1. Pillow retrieves historical execution events through the authoritative Experience Replay Engine.
2. Successful missions, failed missions, rejections, and Grand King feedback are analysed.
3. Repeating patterns and repeated mistakes are detected; reusable lessons are extracted.
4. Executive recommendations for future behaviour are generated as machine-readable Experience Records (`XPL-001-v1`).
5. Experience Replay Engine never executes work, replaces Execution Memory, replaces Decision Engine, overrides Pillow, or overrides Grand King.

## Experience sources

`successful_missions`, `failed_missions`, `grand_king_approvals`, `grand_king_rejections`, `executive_decisions`, `audit_reports`, `worker_reviews`, `production_results`

## Verification

`npx --yes tsx --test "src/validation/tests/experience-replay-engine.test.ts"` — 10 passing, 0 failing.
