# Independent F29 / Runtime reconciliation — 18 October 2026

Decision: **STALE PR DESCRIPTION. Preserve accepted F29 and HH4; no repeat examination warranted.** Read-only GitHub reconciliation and retained receipt review performed by independent lane `/root/runtime_reconcile`. No source change, publication, workflow dispatch or test execution.

## Authoritative GitHub identities

PR #113 is open, draft and unmerged. Its current source head is `d6069705a9a2e8f7b58550afa2474a8382be2663`, complete tree `f2d7d7c085dc21e000c9b9e2a0aab2b17b410c1b`. The leading PR body still labels the older F29 campaign “Latest”. The PR updated timestamp is not evidence that its body describes the current source.

| Runtime run | Created UTC | Source | Complete tree | Terminal result |
|---|---|---|---|---|
| 38288789918 | 2026-10-12T18:07:24Z | `3db0b6fe083a3f3d23ebbf5475116b91866c694e` | `00d95aeb9578b7d213fad55fe1f0c5d5d6fddbd9` | FAILURE; historical startup failure before first injection |
| 38338899372 | 2026-10-13T02:51:33Z | `b3c775c676f35fa5a8009bde7384839997116b16` | `9f81cef990efb1a22a4828dfcf08f962f41a90c7` | SUCCESS; accepted F29 pair examination |
| 39114039616 | 2026-10-18T09:06:32Z | `d6069705a9a2e8f7b58550afa2474a8382be2663` | `f2d7d7c085dc21e000c9b9e2a0aab2b17b410c1b` | SUCCESS; all six jobs |

GitHub compare `3db0b6fe083a3f3d23ebbf5475116b91866c694e...d6069705a9a2e8f7b58550afa2474a8382be2663` returned status `ahead`, ahead_by 10, behind_by 0; merge base equals the old failed source. This is chronological advancement, not branch divergence. The newest twelve branch runs contain no newer Runtime failure than the current successful run.

Current Runtime jobs all SUCCESS: 117636030380 durable runtime; 117636030541 response-delivery; 117636030560 reasoning-admission; 117636030565 Railpack image; 117636030569 durable web; 117638596851 aggregate result. These results preserve their own source attribution and do not substitute for historical F29 acceptance.

## Reused independent F29 acceptance

Receipt: `docs/work8/f29-accepted-f27-followon-20261013/F29-FINAL-ACCEPTANCE.json` in the retained evidence worktree; paired terminal receipt `F29-CI-TERMINAL.json`.

Original decision: `ACCEPT_TWO_PREVIOUSLY_MISSING_F29_PAIR_ARMS`, scenario `W8-F29-REMAINING-V1`, dated 2026-10-13T03:10:22.240064+00:00. Source and tree are b3c775c6 / 9f81cef9 above. Runtime job 115105212931, artifact 11786661525, SHA256 `7f9cd27846f5a9fec01a7957f3e093b5430aa9a5bfc5f0e3b98659823648a8c6`.

| Arm | Detection milliseconds | Verified elapsed milliseconds | Preserved independent decision |
|---|---:|---:|---|
| both-observers-killed | 185.25205099999948 | 321.9107789999998 | ACCEPT_ACTUAL_PAIR_CONTAINMENT |
| launcher-and-guard-killed | 187.7048990000003 | 327.24427300000025 | ACCEPT_ACTUAL_PAIR_CONTAINMENT |

The receipt records genuine pair injection, outside-tested-process-group controller, fresh incident, verified containment and canonical financial preservation under original 660000ms detector / 720s arm bounds. Prior accepted worker SIGSTOP evidence is preserved separately. Both actual containers reached readiness. No artifact redownload or new independent binary examination is claimed here: this reconciliation reuses the retained independent acceptance and confirms its source/run against GitHub.

The earlier 180-second startup failure's root cause remains historically unconfirmed. Later successful actual readiness and independently accepted pair examinations supersede its status as an unresolved acceptance blocker; they do not retroactively establish its cause.

## Result and minimum next action

Preserve authoritative 43 accepted / 21 outstanding, including HH4, A9 and A11. No new original or amendment acceptance is asserted by this reconciliation. No F29 retest or speculative startup repair is justified by the stale description.

Refresh the stale PR narrative and tracker O9/O42 historical CI wording without altering accepted statuses or historical evidence. O30 still requires independently demonstrated external owner-alert delivery; O33/O39 full restoration and protected custody remain separate. This reconciliation does not close those contracts.

GitHub GET sources: `/repos/empireaios/EmpireAI/pulls/113`; `/actions/runs?branch=work8%2Fautonomous-examination-20261011&per_page=12`; `/actions/runs/38288789918`; `/actions/runs/38338899372`; `/actions/runs/39114039616/jobs`; and the exact compare endpoint above.
