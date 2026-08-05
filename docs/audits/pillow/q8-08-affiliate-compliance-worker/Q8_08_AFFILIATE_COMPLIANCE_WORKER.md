# Q8-08 Affiliate Compliance Worker

## Mission

- **ID:** Q8-08
- **Name:** Affiliate Compliance Worker
- **Doctrine:** `PILLOW-ACW-001`
- **Module:** `pillow/src/affiliate-compliance-worker/`
- **Worker ID:** `wkr-affiliate-compliance-01`
- **Status:** **FINAL PASS**

## Prior gates

| Mission | Status |
|---|---|
| Q8-01 Affiliate Factory Core | FINAL PASS |
| Q8-02 Affiliate Opportunity Worker | FINAL PASS |
| Q8-03 Comparison Site Worker | FINAL PASS |
| Q8-04 Review Content Worker | FINAL PASS |
| Q8-05 SEO Content Worker | FINAL PASS |
| Q8-06 Email Funnel Worker | FINAL PASS |
| Q8-07 Analytics Worker | FINAL PASS |

## Deliverable

Evidence-based affiliate compliance validation: consume opportunity/review/SEO packages; validate disclosures, platform rules, and disclaimers; detect risks; recommend remediation; assess readiness (without auto-approval); preserve compliance history; emit machine-readable Affiliate Compliance Reports consumable by Q8-09 Affiliate Certification.

Does **not** publish content, provide legal advice, replace legal professionals, fabricate compliance results, or implement Q8-09+.

## Wiring evidence

- Session: `pillow/src/session.ts` (`affiliateComplianceWorker`, `requirePillowAffiliateComplianceWorker`)
- Barrel: `pillow/src/index.ts`
- Subsystem: `affiliate-compliance-worker` in `orchestrator/types.ts` + `subsystem-registry.ts`
- Host: `backend/src/orchestration/pillow-host/pillow-host.ts`
- Routes: `/api/pillow/affiliate-compliance-worker/*`
- Offline bridge: `backend/src/orchestration/pillow-host/affiliate-compliance-worker-bridge.ts`
- Governance: `docs/governance/EMPIREAI_AFFILIATE_COMPLIANCE_WORKER_SYSTEM.md`
- Config: `config/affiliate-compliance-worker.config.json`

## Observed validation

On 2026-08-03:

```text
node --import tsx --test "src/validation/tests/affiliate-compliance-worker.test.ts"
# 12 pass / 0 fail

node --import tsx --test \
  "src/validation/tests/analytics-worker.test.ts" \
  "src/validation/tests/email-funnel-worker.test.ts" \
  "src/validation/tests/seo-content-worker.test.ts"
# 36 pass / 0 fail
```

Example engine run produced `acw-rpt-0001` with `consumableByQ809: true` and `legalConclusion: "not_legal_advice"`.

## Stop

Q8-08 complete. Do not begin Q8-09.
