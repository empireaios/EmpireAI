# POST_FOUNDATION_REPAIR_1 — Heterogeneous Obligation Composition

**Candidate base:** `90350010` (Foundation Reset)  
**Mission:** Wave 1 clean-cert T1 independent failure repair  
**Date:** 2026-08-19  
**Wave certification:** NOT awarded (WAVE_1 remains UNCERTIFIED, streak 0)

## A. Independent T1 failure (classes)

- MULTI_OBLIGATION_DECOMPOSITION_FAILURE
- HETEROGENEOUS_OBLIGATION_IDENTITY_COLLAPSE
- SIBLING_TEMPLATE_CLONING / GENERIC_EVIDENCE_TEMPLATE_DOMINANCE
- MATERIAL_TASK_OMISSION
- GOVERNANCE_CONTAMINATION
- ACCEPTED_REQUEST_RESIDUE_CONTAMINATION
- FINAL_VISIBLE_COMPLETION_FAILURE

Sealed prompt (Asteria / VL-900 / amounts) was **not** replayed.

## B. Live-path root cause

1. **Coverage oracle too weak:** for multi-task asks, a single global `premise_audit` kind signal marked *all* siblings completed (`assessTaskCoverage`).
2. **Evidence synthesizer:** `synthesizeEvidenceStructureAudit` collapsed many siblings into the same “Unsupported as realised result” body.
3. **Clone detector bypass:** `detectSiblingTemplateCloning` could reject candidates in `sealWithCoverage`, but the ultimate `fail_closed` path in `releaseExecutiveAnswer` **re-released** cloned forced completion without re-checking.
4. **Governance injection:** `buildUsefulDegradedExecutiveAnswer` appended Grand King approval text whenever `authorityConstrained: true`; `pillow-host` set that flag on DS/answer-gate failures even for evidence-only asks.
5. **Recovery residue:** the same degraded builder **always** appended “you do not need to resubmit…”.

## C. Why Foundation qualification missed it

- Constitutional corpus had only **short** 3–4 obligation specimens (not 8-hetero).
- Some foundation tests graded with **stub synthesizers** that returned one generic evidence paragraph — enough to pass weak requiredAny oracles.
- Clone detection required `multipart && tasks>=3` and Jaccard ≥ 0.9 on newline fragments — easy to miss section-level clones.
- Ultimate release path bypassed clone rejection.
- Degraded contamination path was not forbidden on evidence specimens.

## D–G. Repairs

| Area | Change |
|------|--------|
| Decomposition | Local classification: synthesis→recommendation, supersession→temporal, weigh→evidence_explanation |
| Synthesizer | Operation-specific branches (customer/order, refund arithmetic, claim-by-claim, provenance weigh, synthesis, scoped supersession) |
| Coverage | Multipart/multi-task requires **local token overlap**; holistic silent-drop lift disabled for large multiparts |
| Clone detect | Section-level blocks; repeated verdict templates; Jaccard 0.78 / dup≥2; applies when taskCount≥5 |
| Release | Ultimate fail_closed re-checks clones; `stripIrrelevantLifecycleContamination` |
| Degraded UX | Governance only if authority markers; **no** resubmit boilerplate |
| Host | DS/answer-gate: `authorityConstrained` only when ask has authority semantics |

## H. EKLS

- Updated `birth.lesson.sibling_identity` (heterogeneous ops + latent governance/recovery).
- Added `birth.lesson.no_lifecycle_residue_on_evidence`.
- Memory informs reasoning; must not become response template / router.

## I–J. Corpus

Added:

- `cr.hetero_multipart_no_clone` (P0)
- `cr.no_governance_on_evidence` (P0)

Strict grade for hetero: sections≥6, refund/identity/supersession signals, no clone.

## Certification state (unchanged by this mission)

```
WAVE_1_CURRENT_CERTIFICATION=UNCERTIFIED
WAVE_1_CLEAN_STREAK=0
WAVE_2_CURRENT_CERTIFICATION=UNCERTIFIED
WAVE_3=LOCKED
BIRTH_AUTHORISED=NO
BIRTH_TIMESTAMP=NULL
```

Grand King + ChatGPT restart Wave 1 T1 with a **new** unseen test after deploy.

## Deploy / Level C resume notes

| SHA | Role |
|-----|------|
| `85a6500e` | Core hetero + governance/recovery repair |
| `baf64d7a` | TSC fix for Railway build |
| `1495a973` | Synthetic-scoped release reconstruct (Level C 7/8; CASE6 Mini Fan) |
| `ba470bb4` | Final chat-path hard-strip of synthetic→live briefing |
| `6e2bc5a3` | **LIVE** — Level C **8/8 PASS** (2026-08-19) |

Level C evidence: `POST_FOUNDATION_REPAIR_1_LEVEL_C.json`

```
WAVE_1_CURRENT_CERTIFICATION=UNCERTIFIED
WAVE_1_CLEAN_STREAK=0
WAVE_2_CURRENT_CERTIFICATION=UNCERTIFIED
WAVE_3=LOCKED
BIRTH_AUTHORISED=NO
BIRTH_TIMESTAMP=NULL
```
