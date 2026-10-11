# Verified owner assessment excerpt

The authenticated Portfolio read can expose at most 2,000 plain-text characters of an assessment only after the existing candidate-linked completion verifier succeeds and both the investigation owner and archived request owner equal the authenticated owner. It retains exact response-hash, context-delivery, source-snapshot and closure checks. The excerpt is explicitly model assessment, not commercial approval. No archive URL is exposed.

The request receipt projection now preserves the canonical optional owner ID going forward. Historical archives without owner identity remain unavailable for excerpt disclosure; no owner is inferred or backfilled. Altered responses, unbound candidates, missing owners and other owners do not disclose an excerpt. Existing workspace archive routes are outside this narrow change.

Validation: isolated Node 22 linked-assessment regression passed, including altered response, unbound candidate, missing/foreign owner and bounded long response; actual archived Pillow readback passed with known owner preserved and unknown owner null. Strict noUncheckedIndexedAccess targeted backend compilation passed. Frontend SSR tests passed (10 cases), including escaped plain text and classification gating; changed-component lint and frontend TypeScript passed. This is synthetic contract evidence, not a claim that an authentic product has completed a Pillow assessment or that Work 8 is complete.

## Backend working-source binding

These post-a09 working bytes received the targeted verification above. They are not certified by the earlier 600-second soak. No deployment or authentic assessment is claimed.

- `backend/src/intelligence/work8-enrichment.ts`: `e55893e6b40af83f7f41d87bda8d71da9a9477ba12518e25fd84e7c3bd1e8124`
- `backend/src/advisor/pillow-read.ts`: `fbae7375658312541856b9c5ade57b882461b0cca00b805d6c2d78d55ad0d556`
- `backend/src/runtime/pillow-request-receipts.ts`: `064401e27acbca33f1fc4835940d2186ee606e3cfc499cf921019a878801d0aa`
- `backend/src/runtime/commerce-runtime/governed/runtime.ts`: `6cd0dabc632081f2781eec4335c1402e690d5221660b789aca6d686de2f1061a`
