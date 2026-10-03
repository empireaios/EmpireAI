# Defect A: passive-prohibition scope

Candidate is stacked on PR #36, `aeaa4ab466e55d5e16568578f0869259346edccc`. This is an offline engineering repair, not owner acceptance or deployment authorization. Defect B/current-truth provenance is unchanged.

## Evidence and mechanism

Read-only investigation recovered the complete retained rejected provider answer, its SHA-256, validator findings and terminal delivery state. The retained digest matched the recovered text exactly, with no truncation. The provider ledger records a completed provider response; application validation prevented delivery. Original requests, diagnostics, accounting and transcripts were not modified or retried. No owner prompt or unseen acceptance test was run.

The remaining defect is grammatical: passive prohibitions place a governed object before a negated auxiliary and passive action. The lexical detector sees the governance object and bypass participle, but the visible-answer denial recognizer previously understood active voice only. A prohibition was therefore treated as an adopted action. Whole-answer diagnostics additionally combined unrelated objects and actions; isolating propositions reduced the rejection to the passive prohibition.

Comparison:

| Retained case | PR #36 validator | Semantic distinction |
| --- | --- | --- |
| New application-validation failure | Rejects | Passive negation was not recognized |
| Previously repaired S2-05 | Accepts | Bounded negative contrast and nominal risk warning |
| Delivered combined CEO/Assurance answer | Accepts | Evidence challenge plus active denial of mandatory-block bypass |

The combined comparator was created at 07:23 UTC and delivered at 07:24 UTC, before PR #36 deployment. It must not be mislabeled as post-deployment acceptance. The separate 08:44 UTC delivered answer concerns current-state provenance; that accepted Defect B was not reopened.

## Repair boundary

`isExplicitVisibleDenial` now recognizes complete passive prohibitions with bounded noun subjects, explicitly negated modal auxiliaries and passive action predicates. Coordinated subjects and predicates retain their common negative scope. The complete-clause match excludes free-form tails, nested instructions, conditions and exceptions. Unknown grammar remains subject to strict review. Request, command, tool and structured-action gates are unchanged.

There is no wording allowlist, owner-prompt fixture, provider call, auto-retry, release of the retained failed answer, or change to production authority. Concurrent Work A, PR #36, NOT_BORN and commerce LOCKED are preserved.

## Local validation

- 22 constitutional tests pass, including the unchanged 210 existing adjacent bypass regressions and all previous Assurance challenge cases.
- New generated coverage: 80 passive prohibitions, each alone and after a review clause; 2,240 unsafe adjacency combinations; 240 conditional exceptions; positive-passive and embedded-instruction controls; three strict execution-purpose checks.
- 15 existing offline owner-contract and locked-reasoning integration tests pass. These use synthetic fixtures, not owner-acceptance prompts.
- Pillow typecheck/build and backend typecheck pass; diff check passes.
- The exact recovered new draft fails before the repair and passes afterward. The exact retained S2-05 draft remains accepted. Reclassification is deterministic and does not execute prompts or infer a new answer.

Hosted CI status belongs to the PR's exact head checks. A new production revision is required to use this repair. Finish hosted CI and obtain owner authorization for that exact head before deployment. Rollback target is verified PR #36 `aeaa4ab466e55d5e16568578f0869259346edccc`, preserving its accepted provenance repair. Never roll back Railway merely to match a frontend revision pin.
