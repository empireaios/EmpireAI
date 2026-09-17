# Defect ledger — EXEC_CAP_CLOSURE_20260917

Severity: P0 = unauthorized/data-loss/cross-user; P1 = stuck work / wrong decision / invented claims / contradictory governing answers / broken mandatory capability.

| ID | Sev | Status | Summary | Evidence | Owner |
|----|-----|--------|---------|----------|-------|
| D-001 | P1 | OPEN | Prod worker flapping (exit 78, restarts≥6); chat may degrade to tier0_only | health/live 2026-09-17 | integ |
| D-002 | P1 | OPEN | Historical ranking US$4,950 above US$5,000 (verify if still present) | mission brief / prior audits | WS-B |
| D-003 | P1 | OPEN | Later factual corrections ignored (verify/regress) | mission brief | WS-B |
| D-004 | P1 | OPEN | Supplied scenario arithmetic treated as missing live/selling-price facts | mission brief / DC05421 lineage | WS-B |
| D-005 | P1 | MITIGATED_LEAD | Demo catalog / US$6.87 substitution in Shadow CEO chat | request-control e45cb051 proof; re-verify on current SHA | WS-A/E |
| D-006 | P1 | OPEN | Accepted-request without answer / missing retrieval ID (transport claim UNVERIFIED) | mission brief | WS-A |
| D-007 | P1 | OPEN | V53 Birth Master workbook missing — coverage must use repo canonical sources | workspace search | eval |
| D-008 | info | OPEN | Large unrelated dirty worktree docs/.tmp — preserve; do not stage | git status | integ |

Do not close defects without observed retest evidence.
