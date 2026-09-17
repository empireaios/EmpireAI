# Rerun engineering qualification

From repo root (uses existing `.env` login; does not change production behavior):

```bash
node docs/audits/capability-extraction/EXEC_CAP_CLOSURE_20260917/evidence/post-deploy-focus-proof.mjs
node docs/audits/capability-extraction/EXEC_CAP_CLOSURE_20260917/evidence/normal-chat-driver.mjs
node --import tsx backend/scripts/exec-cap-stateful-missions.mjs
```

WAVE_CREDIT remains 0. SC-01 frozen. This is segregated engineering evaluation, not Overseer certification.

Continuation if unfinished: see `checkpoint.json`.
