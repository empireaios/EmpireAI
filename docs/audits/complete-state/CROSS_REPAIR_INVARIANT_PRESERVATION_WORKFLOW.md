# Semantic Pillow change workflow (permanent)

Every semantic Pillow change must preserve prior closed capabilities.

## Required sequence

1. During development: `npm run gate:fast-invariant`
2. Before deploy: `npm run gate:deploy-invariant` (also wired into `verify:production-deploy`)
3. Full certification when closing a semantic mission: `npm run gate:full-certification`
4. Production first-visible combined: `node backend/scripts/pillow-independent-closure-production-ladder.mjs`

## Change-impact mapping

Use `describeChangeImpact(path)` / `requiredRegressionsForPaths(paths)` from
`backend/src/orchestration/pillow-host/independent-closure-invariants.ts`.

A new repair is not complete because its own target passes — DEPLOY INVARIANT GATE
must pass simultaneously.

## Certification note

Cursor engineering PASS grants zero Wave certification credit.
WAVE_1 remains UNCERTIFIED; BIRTH_AUTHORISED=NO unless Grand King authorizes.
