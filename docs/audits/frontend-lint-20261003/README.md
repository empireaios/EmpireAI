# PR29 / PR35 lint baseline investigation

Exact revisions: PR29 `e914c3d607dbc9c64cd7cadf9cd3843c1df899b2`; PR35 `cdb127360a46bd9725db4b44008e8a2a139a76fc`.

Both exact trees were linted using the same pinned package-lock dependencies and ESLint CLI. The source, lockfile and lint configuration differ only in the owner runtime revision string between these commits. After normalizing absolute checkout roots, every finding, location, message and suggestion is identical. The accompanying records include a SHA256 of each complete normalized finding.

| Check | PR29 | PR35 | Repair working tree |
| --- | ---: | ---: | ---: |
| Errors | 165 | 165 | 0 |
| Warnings | 13 | 13 | 0 |
| set-state-in-effect errors | 164 | 164 | 0 |
| refs errors | 1 | 1 | 0 |
| unused-vars warnings | 9 | 9 | 0 |
| exhaustive-deps warnings | 4 | 4 | 0 |

PR35 introduced, removed or changed zero findings. The older CI note of 164 errors / 11 warnings referred to an earlier origin/main baseline, not these exact revisions.

## Why green CI did not permit promotion

`.github/workflows/product-path-ci.yml` explicitly made lint diagnostic with `continue-on-error: true`. Vercel separately requires Lint for promotion. Next.js 16's build does not run lint. A READY build and successful GitHub workflow therefore did not mean lint passed. The production PR29 deployment also displays failed Lint. Vercel explicitly warned that promoting PR35 would bypass the Lint requirement. No promotion was performed.

## Repair

- Centralize 156 repeated initial/poll read effects in a cancellable subscription. The first read runs in a scheduler callback; cleanup can cancel it before it starts (including Strict Mode setup/cleanup/setup). Existing poll intervals, handlers, request validation and manual actions remain in place. No new retries or paid calls are added.
- Derive timestamps, tab selection and disabled-loading state instead of synchronizing redundant state through effects. Reset transaction loading in the refresh event. Read browser speech support through a hydration-safe external-store snapshot.
- Move the cached-data ref assignment out of render; use a serialized payload dependency without hiding dependencies. Keep owner-history dependencies as owner/workspace primitives.
- Remove unused imports/values and document intentionally retained compatibility parameters.
- Make the existing Product CI lint command gating, matching Vercel. No lint rule, ignore pattern, dependency or Vercel promotion policy was weakened.

## Validation and limits

Local Node 24.19.0: ESLint 0 errors/0 warnings; Next typecheck PASS; all 17 frontend test files PASS; Next production build PASS (171 static pages). New subscription tests cover Strict Mode cancellation, polling cleanup, one-shot reads and manual refresh without an added loop. `git diff --check` PASS. Hosted Node 22 and Vercel checks remain required.

The change spans many repeated hooks/components. Initial reads move to the next scheduler turn. Already-started requests retain their existing cancellation/error semantics; this repair does not claim to solve all asynchronous races. No real phone or authenticated production acceptance is claimed. The middleware convention deprecation emitted by Next build is distinct from ESLint and remains visible.

No backend, database, authority or commercial execution change. Railway PR34 stays untouched, NOT_BORN and commerce LOCKED. No Force Promote is necessary if the repaired candidate clears hosted checks; deploying that new revision requires separate exact authorization. Frontend rollback remains PR29 `e914c3d607dbc9c64cd7cadf9cd3843c1df899b2`, deployment `dpl_gcEE5k9q8MzsPFY2Nbcvqt7Y3dw2`.
