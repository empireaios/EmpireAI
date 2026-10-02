# Pillow Birth authority reconciliation

Base: `21384342` (2026-09-20 review).

## Problem and scope

The commissioning API previously returned a stored `BORN` row as technically
ready even when current gates failed. Its owner authorisation endpoint could
create Birth from legacy commissioning gates, while executive chat separately
reported `NOT_BORN`. Neither route accepted independent V53 certification.

One immutable authority projection now supplies current `NOT_BORN`, commerce
`LOCKED`, zero Wave credit, and unverified independent certification to Birth,
operating state, readiness and chat projections. Existing SQL rows and their
original JSON remain unchanged; historical timestamps are exposed only as
`LEGACY_UNVERIFIED`, without claiming current operating age. The legacy owner
authorisation endpoint returns HTTP 409 with the missing prerequisite. It cannot
be enabled through stored flags, prose, environment flags, or owner approval alone.

Certification receipt ingestion and acceptance are **not implemented**. This
patch repairs inconsistent authority claims and closes a bypass; it does not
certify Pillow, grant commerce authority, or establish readiness for production.

## Validation

Commands run from `backend/`, with installed local dependencies:

```sh
npm run typecheck
node --import tsx --test src/validation/tests/pillow-birth-authority.test.ts src/validation/tests/pillow-commissioning-004.test.ts src/validation/tests/authority-synthetic-isolation.lock.test.ts
node --import tsx --test src/validation/tests/pillow-executive-operating-loop.test.ts src/validation/tests/executive-truth-grounding.test.ts src/validation/tests/executive-authority-semantics.test.ts
```

- Typecheck: PASS.
- New authority regression suite: 10/10 PASS, zero skips. Includes preserved
  legacy BORN history, malformed JSON, workspace isolation, forged stored/prose/
  environment authority, current truth agreement, owner endpoint rejection,
  authentication boundaries and the public health projection.
- New suite plus existing commissioning/synthetic isolation suites: 19/19 PASS.
- Operating-loop and authority-semantics companions: 27/27 PASS.
- Existing truth-grounding suite: **6/7 PASS, one failure retained**. The
  fabricated-sales test expects a nonempty corrective answer but receives an
  empty fallback. The same command for that suite independently reproduces the
  same failure on pristine base `21384342`; this patch does not modify the test
  or the release-gate implementation. This is an open baseline defect, not a
  passing result or a certification waiver.
- `git diff --check` and syntax checks for the two gate entrypoints: PASS.
- An independent reviewer inspected the patch and separately reran the new
  suite: 10/10 PASS; approved this bounded fail-closed reconciliation only.

The new regression is included in deploy-invariant and full-certification
engineering test entrypoints. Those names do not confer independent V53 or
Wave certification.

No live provider calls, orders, payments, deployment or production/browser
readiness verification occurred in this work.
