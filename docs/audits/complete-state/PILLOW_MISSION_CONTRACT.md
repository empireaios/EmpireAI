# Pillow Mission Contract — required for every Pillow change

Every future Pillow engineering mission must declare (start) and report (end):

## Start

```
CAPABILITIES_TOUCHED=
LESSONS_TOUCHED=
ROUTING_TOUCHED=
MEMORY_TOUCHED=
EXPECTED_INVALIDATION=
REQUIRED_REGRESSION_TIERS=   # FAST | DEPLOY | FULL_CERTIFICATION
```

## End

```
ACTUAL_CAPABILITIES_CHANGED=
ACTUAL_INVALIDATION=
REGRESSION_RESULTS=
NEW_FAILURE_LESSONS=
LESSON_UPDATES=
CORPUS_UPDATES=
CANDIDATE_SHA=
```

## Tiers

| Tier | When | Scope |
|---|---|---|
| FAST | PR / local | compositional smoke + affected specimens |
| DEPLOY | pre-prod | constitutional corpus variants + cross-capability |
| FULL_CERTIFICATION | Birth Wave close | full corpus + clean streak + 10× gauntlet + permanence |

## Doctrine

- Historical PASS ≠ current certification streak
- Material failure → streak = 0
- Change-impact via `capabilitiesInvalidatedByPaths`
- Do not encode sealed exams
- Birth cannot self-authorize

See also: `certification-constitution.ts`, `constitutional-regression-corpus.ts`
