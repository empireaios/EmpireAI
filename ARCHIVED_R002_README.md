# Archived R002 — Reality Activation Engine

## Why archived

These artifacts came from the **Project Reality R002–R010** roadmap. That roadmap was **cancelled and superseded** by **COS-001 (Commerce Operating System)**. The partial R002 module was never wired into brain, routes, permissions, or database, but remained under `backend/src/` and broke active TypeScript compilation.

## Roadmap superseded

| Prior | Current |
| --- | --- |
| Project Reality R002–R010 | **COS-001** — `COMMERCE_OS_BLUEPRINT.md` |
| Reality Activation Engine (live go-live gate) | Connector SDK + kernel design (COS-002+) |
| Marketplace OS (MOS-001) | Superseded by Commerce OS |

Active strategy is documented in `EMPIREAI_ROADMAP.md` and `EMPIREAI_DECISIONS.md` (ADR-013).

## Code intentionally preserved

Nothing was deleted. All R002 source was moved to:

```
backend/archive/cancelled-r002-r010/
├── reality-activation-engine/   (7 TypeScript files — partial module)
└── project-reality/
    └── shared/
        └── execution-gate.ts    (shared execution block helper)
```

This folder is **outside** `backend/src/` and is excluded from `tsconfig.json` (`include: ["src/**/*.ts"]`).

## Not active architecture

- Not registered in `backend/src/index.ts`
- Not registered in brain, permissions, or module routes
- No database tables for `reality_activation_*`
- No live commerce execution paths

## Future reuse requires COS review

Concepts such as activation gates or emergency stop may inform future COS kernels. **Do not** copy files back into `src/` without:

1. Explicit review against `COMMERCE_OS_BLUEPRINT.md`
2. Full integration (audit actions, Soul memory keys, DB schema, tests)
3. A dedicated COS mission — not ad-hoc revival of R002

## Restoration mission

Archived by **FIX-COS-001** / **COS-001A** to restore a green build baseline without implementing Reality Activation Engine.
