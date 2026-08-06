# Remaining Verified Gaps

Only genuine remaining gaps after the Complete State Audit. Not a wishlist.

1. **Live commerce production flag unset**  
   - Gap: `LIVE_COMMERCE_INTEGRATION_MODE` missing on Railway → sandbox default → Amazon `supportsPublish=false`.  
   - Owner action: set to `production` after Seller Central confirmation.

2. **Pillow operational-ready flag unset**  
   - Gap: `EMPIRE_V1_OPERATIONAL_READY` not `true` → dry-run readiness mode.  
   - Owner action: set only after first controlled live validation.

3. **CJ mode confirmation**  
   - Gap: `CJ_INTEGRATION_MODE` present but must be confirmed `LIVE` for real catalogue (not fixtures).  
   - Owner action: verify variable value in Railway UI.

4. **Session stampede hardening deploy**  
   - Gap: hard session rate-limit added in admission control during this audit; must be on `origin/main` and Railway.  
   - Owner/system action: commit + push + confirm `/health/live` shows rate-limit stats.

5. **Demo vs live UI honesty**  
   - Gap: commerce marketing demo data can look “live.”  
   - Mitigation: operational guide warning; do not use demo panels for revenue decisions.

6. **Scaled probability-at-scale not proven**  
   - Gap: no evidence for safe 10k-SKU batch.  
   - Limit: safe batch 1–5 until proven.

7. **Working-tree noise**  
   - Gap: many unrelated local modified/untracked files outside this package.  
   - Action: do not treat them as certified; commit only audit/remediation artifacts.

No other mandatory missing programme missions (K Series intentionally skipped).
