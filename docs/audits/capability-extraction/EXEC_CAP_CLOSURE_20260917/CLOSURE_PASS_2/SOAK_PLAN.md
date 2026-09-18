# SOAK_PLAN — CLOSURE_PASS_2

**WAVE_CREDIT:** 0 · **Birth:** NOT_BORN · **Real commerce:** locked · **SC-01:** FROZEN

## Scope

Exactly one bounded soak after UI harness works.

| Field | Value |
|-------|--------|
| Duration | ≥ 120 continuous minutes |
| Ordinary chat | ≥ 24 varied prompts (unseen names/layouts) |
| Multi-step missions | ≥ 3 synthetic executive missions |
| Midpoint | Controlled worker restart (`railway restart`) |
| Reconnect | Simulated browser disconnect via re-login + durable retrieve |
| Runner | `soak/soak-runner.mjs` |
| Heartbeats | `SOAK_HEARTBEATS.jsonl` every ≤15 minutes |
| Results | `SOAK_RESULTS.json` |

## Predeclared pass criteria

1. 0 lost admitted requests
2. 0 contradictory executive answers
3. 0 duplicate effects
4. 0 unauthorized effects
5. 100% completed results durably retrievable
6. ≥95% completed within 20 seconds
7. 100% completed or durably retrievable within 90 seconds
8. Restart and reconnect preserve request state
9. Synthetic and real-commerce boundaries remain intact
10. Duration ≥ 120 minutes

A temporary transport response is **not** a pass unless the durable completed answer is subsequently retrieved.

## Workload themes

Corrections, counterfactuals, arithmetic, eligibility/ranking, approval gates, state recovery — with unseen vendor/candidate names (Nimbus, Quill, Zephyr, Orchid, Vela, Lyra, HarborCalc, etc.).

## Non-goals

- No real listings, purchases, ads, or payments
- No Wave/Birth credit
- No secret printing
