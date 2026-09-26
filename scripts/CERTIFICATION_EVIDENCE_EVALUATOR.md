# Offline replacement-certification evidence evaluator

`evaluate-certification-evidence.mjs` checks evidence coverage against the exact bytes of the replacement manifest. It is not certification acceptance and never changes Birth, permission, budgets or commercial authority. A complete result is deliberately `EVIDENCE_COMPLETE_UNACCEPTED`; its three authority flags remain false. `--phase` reports only that phase. Real-pilot work still requires the separate owner authorization defined by the manifest.

## Initial assessment

Run from the trusted integration checkout, substituting the exact release commit and actual target identifiers:

```
node scripts/evaluate-certification-evidence.mjs --source-commit FULL_40_CHARACTER_SHA --workspace WORKSPACE_ID --environment ENVIRONMENT_ID --deployment BACKEND_DEPLOYMENT_ID --frontend-deployment FRONTEND_DEPLOYMENT_ID
```

No evidence or verifier registry is assumed. This returns exit 2, `BLOCKED`, and the complete list of missing mandatory requirements. This is an engineering gap, not a request for an external auditor or historical workbook. Provide `--phase engineering`, `sandbox`, `runtime`, `owner-ui` or `real-pilot` for a scoped assessment. A phase with no requirements cannot return complete.

## Reviewed Git trust snapshot

Passing coverage additionally requires `--trust-commit FULL_SHA --registry RELATIVE_PATH --ledger RELATIVE_PATH`. The caller selects an independently reviewed repository commit through the engineering review process; an arbitrary new commit is not evidence of review. No owner key or external auditor is required.

The checkout must be clean at that exact commit. Manifest, registry, ledger, every historical source and each executing harness must match their exact committed Git blob bytes. Keep frozen evidence provenance files byte-preserving in Git attributes; line-ending rewrites fail closed. Every historical source must carry a manifest SHA-256. The registry's `sourceCommits` is an explicit allowlist of exact known Git source commits; deliberately separate deployment branches are supported without inferring cherry-pick equivalence.

The committed ledger has `{schemaVersion:1,entries:[{receiptId,sha256}]}`, where each SHA-256 hashes `JSON.stringify(receipt)` after parsing the bounded receipt. It must contain exactly the complete receipt set supplied by the evidence bundle. Deleting a previous FAIL and clearing a newer PASS's references therefore fails against the frozen ledger. New evidence or corrections require a new reviewed ledger snapshot; never overwrite historical entries. Git review must compare ledger history when authorizing that snapshot. The snapshot is checked again before returning complete coverage.

## Evidence and verifier protocol

Optional arguments:

- `--evidence-dir PATH`: a read-only evidence bundle containing `receipts.json` (override with `--index RELATIVE_PATH`).
- `--registry RELATIVE_PATH`: reviewed repository-governed verifier registry, relative to the trusted checkout.
- `--manifest RELATIVE_PATH`: defaults to `docs/governance/PILLOW_REPLACEMENT_CERTIFICATION_V1.json`.

The index is `{schemaVersion:1, receipts:[...]}`. Each receipt has exactly:

```
{
  "schemaVersion": 1,
  "receiptId": "unique-receipt-id",
  "requirementId": "OPS-01",
  "phase": "runtime",
  "manifestSha256": "64-lowercase-hex",
  "sourceCommit": "40-lowercase-hex",
  "scope": {
    "workspaceId": "workspace",
    "environmentId": "environment",
    "deploymentIds": { "backend": "actual-id", "frontend": "actual-id" }
  },
  "verifierId": "reviewed-harness-id",
  "outcome": "PASS",
  "observedAt": "2026-09-23T00:00:00Z",
  "artifacts": [{"path":"relative-evidence.json", "sha256":"64-lowercase-hex"}],
  "supersedes": []
}
```

This is a schema illustration, not an actual receipt. Outcomes are PASS, FAIL, BLOCKED, NOT_EVALUATED or REVOKED. Supersession must explicitly reference retained older records for the same requirement; missing references, cycles and duplicate receipt IDs are rejected. Multiple active records block rather than choosing a convenient PASS. A revoked record cannot contribute passing coverage. Historical failures remain in the result and their artifacts remain hash-checked. This tool never edits the bundle.

CAP requirements additionally need `heldOut:{caseSetSha256,oracleSha256,caseIds:[...]}` with at least three distinct held-out IDs. The commitments must equal the previously reviewed registry commitments. A receipt cannot select its own new oracle.

Registry schema:

```
{
  "schemaVersion": 1,
  "manifestSha256": "64-lowercase-hex",
  "sourceCommits": ["40-lowercase-hex"],
  "verifiers": [{
    "id": "reviewed-harness-id",
    "module": "scripts/certification-verifiers/reviewed-harness.mjs",
    "sha256": "64-lowercase-hex",
    "requirements": [{"id":"OPS-01"}]
  }]
}
```

For CAP bindings each `requirements` entry must also pin `caseSetSha256` and `oracleSha256`. Registry entries are engineering code requiring review and version control; do not construct them from uploaded receipt claims. No production verifier or passing evidence is supplied by this change.

Each verifier runs freshly in a separate Node process using its exact hash-pinned committed source file. Registered harnesses must be self-contained with simple static imports from node:fs, node:path and node:crypto only. Relative/package helpers, dynamic imports, require, eval and Function loaders are rejected; simplify the harness instead of allowing an unpinned dependency. It receives stdin JSON `{protocol:"pillow-independent-verifier-v1",receipt,requirement,evidenceRoot}`. It must independently evaluate artifact contents against the rubric/oracle and return `{protocol,receiptId,checks:[{criterion:1,pass:true},...]}`. Criteria use one-based indices and must cover every criterion exactly once. CAP proofs must also return `heldOutCases` containing every committed receipt case ID. A verifier that copies the receipt's outcome into a PASS result is not a valid independent harness and must not be registered. The evaluator checks bytes before and after execution.

## Bounds and trust limits

- At most 256 requirements/verifiers, 1,000 receipts, 32 artifacts per receipt, 1,024 distinct retained artifacts and 32 MiB total retained artifact bytes. Files are capped at 2 MiB; verifier modules at 256 KiB.
- Relative paths reject traversal, backslashes, alternate data streams, absolute paths, symlink/junction components and nonregular files. Opens use no-follow where supported and compare file identity. Do not allow hostile concurrent writers to the trusted checkout or bundle; portable filesystem checks cannot eliminate every ancestor-directory race.
- Each trusted verifier gets at most ten seconds and 64 KiB output; verifier execution has a two-minute aggregate budget. Child environments exclude provider credentials. This is not an operating-system/network sandbox. Registered modules remain trusted reviewed code. The conservative lexical import restrictions reduce accidental dependency drift; they are not a security sandbox for malicious JavaScript.
- A hash proves byte identity, not semantic truth. Coverage requires rerunning a reviewed independent harness. This evaluator does not itself inspect provider accounts, prove deployment liveness or establish evaluator independence. Relevant harnesses must verify those facts from independently obtained evidence.
- The explicitly selected reviewed Git commit and supplied target scope are trust inputs. This tool rejects omission or modification relative to its committed ledger; it cannot decide whether a human/agent falsely labelled an arbitrary commit as reviewed or whether evidence was never added to the ledger. Preserve append-only intake history and review every ledger change. No self-declared PASS, refreshed hash, dirty registry or unknown source commit substitutes for the trusted snapshot.
- Local evaluator tests exercise its rejection behavior using explicitly synthetic harnesses. They provide no Pillow capability, Birth, commercial or historical V53 credit.

Run regression tests with `node --test scripts/evaluate-certification-evidence.test.mjs`.