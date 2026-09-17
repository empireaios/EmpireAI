# Defect ledger — EXEC_CAP_CLOSURE_20260917

Severity: P0 = unauthorized/data-loss/cross-user; P1 = stuck work / wrong decision / invented claims / contradictory governing answers / broken mandatory capability.

| ID | Sev | Status | Summary | Evidence | Owner |
|----|-----|--------|---------|----------|-------|
| D-001 | P1 | MITIGATING | Prod worker flapping exit78 from ~2s residual lag; raised HIGH_LAG_EXIT_THRESHOLD_MS 2s→4s in `aef83cbf`; deploy `04ca659b` online | health + logs | integ |
| D-002 | P1 | CLOSED_PROD | ranking US$4,950 above US$5,000 — fixed parseMoney commas; prod `Eligible candidates: Alpha, Beta` / `Candidate selected: Beta` | evidence/PROD_RANK_COMMA_PROOF.json | WS-B |
| D-003 | P1 | PASS_LOCAL | later delivery correction supersession | correction-supersession.lock.test.ts | WS-B |
| D-004 | P1 | OPEN | Supplied scenario arithmetic treated as missing live/selling-price facts | mission brief / DC05421 lineage | WS-B |
| D-005 | P1 | CLOSED_PROD | Demo catalog / US$6.87 substitution — re-verified Kestrel-only on `aef83cbf` | request-control proof | WS-A/E |
| D-006 | P1 | OPEN | Accepted-request without answer / missing retrieval ID (transport claim UNVERIFIED) | mission brief | WS-A |
| D-007 | P1 | OPEN | V53 Birth Master workbook missing — coverage from repo sources | COVERAGE_MANIFEST.json | eval |

Do not close defects without observed retest evidence.
