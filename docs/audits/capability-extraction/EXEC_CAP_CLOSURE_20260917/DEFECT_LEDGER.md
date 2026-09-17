# Defect ledger — EXEC_CAP_CLOSURE_20260917

Severity: P0 = unauthorized/data-loss/cross-user; P1 = stuck work / wrong decision / invented claims / contradictory governing answers / broken mandatory capability.

| ID | Sev | Status | Summary | Evidence | Owner |
|----|-----|--------|---------|----------|-------|
| D-001 | P1 | MITIGATING | Prod worker flapping exit78 from ~2s residual lag; raised HIGH_LAG_EXIT_THRESHOLD_MS 2s→4s in `aef83cbf`; deploy `04ca659b` online | health + logs | integ |
| D-002 | P1 | CLOSED_PROD | ranking US$4,950 above US$5,000 — fixed parseMoney commas; prod `Eligible candidates: Alpha, Beta` / `Candidate selected: Beta` | evidence/PROD_RANK_COMMA_PROOF.json | WS-B |
| D-003 | P1 | PASS_LOCAL | later delivery correction supersession | correction-supersession.lock.test.ts | WS-B |
| D-004 | P1 | CLOSED_PROD | Supplied Order A/B/C contributions aggregate without selling-price demand; exact MANGO-742 / US$16.00 | evidence/PROD_D004_SUPPLIED_CONTRIB_PROOF.json | WS-B |
| D-005 | P1 | CLOSED_PROD | Demo catalog / US$6.87 substitution — re-verified Kestrel-only on `aef83cbf` | request-control proof | WS-A/E |
| D-006 | P1 | FIX_DEPLOYED_COMMIT | Accepted-without-answer: `PILLOW_RESULT_PENDING`+requestId; FE poll 240s; BFF opportunistic 45s | `95f67c9e` + durable-pending-receipt.lock | WS-A |
| D-007 | P1 | OPEN | V53 Birth Master workbook missing — coverage from repo sources | COVERAGE_MANIFEST.json | eval |
| D-008 | P1 | FIX_STAGED | Live listing recommended while NOT_BORN; Birth answered “commissioning” — wire `executive-authority-surface` before LLM | pillow-host.ts + authority-surface | WS-E |
| D-009 | P1 | FIX_STAGED | Compact candidate paragraphs + unicode ≥/≤ eligibility gates failed fact-binding | executive-decision-case-state.ts | WS-B |
| D-010 | P1 | OPEN | Normal-chat varied sample 10/24 on pre-fix SHA `1c90f64f` | NORMAL_CHAT_DRIVER_RESULTS.json | e2e |
| D-011 | P1 | OPEN | Authenticated browser UI automation not executed this session | — | e2e |
| D-012 | P2 | OPEN | Soak ≥2h incomplete | — | release |
| D-013 | P1 | OPEN | Held evaluation not generated (RC not frozen) | — | eval |

Do not close defects without observed retest evidence.
| D-006 | P1 | CLOSED_PROD | Pending labeled; FE poll 240s on path | deploy fabf9cfb / 370d2e8f |
| D-008 | P1 | CLOSED_PROD | Live refusal + Birth NOT_BORN facts | POST_DEPLOY_FOCUS_PROOF.json |
| D-009 | P1 | CLOSED_PROD | Compact Kestrel bind | POST_DEPLOY_FOCUS_PROOF.json |
