# G7-05 — Grand King Revenue & Financial Operations · Executive Audit

**Mission:** G7-05 — Grand King Revenue & Financial Operations  
**Authority:** Grand King · Pillow §17 · EKLS · Brain · G4 Cockpit · Registry System (EA-003) · G7 Production Stack  
**Date:** 2026-07-03  
**Status:** **COMPLETE**  
**Scope:** Establishes the canonical production financial operations layer — revenue, costs, profitability, payouts, subscriptions, advertising spend, taxes, refunds, and financial KPIs aggregated from the G7 stack without replacing payment providers  
**Stop directive:** G7-06 **not started**

---

## Executive Summary

G7-05 implements the **Grand King Revenue & Financial Operations** subsystem — the production financial operations layer for the Grand King workspace. It aggregates revenue, expenses, profitability, payouts, subscriptions, advertising spend, refunds, chargebacks, and executive financial KPIs from registry-driven signals sourced through the G7 commerce and production stack.

Stripe, Amazon, Shopify, and future providers continue to own payment execution. This mission provides operational aggregates, ledger records, KPI engines, and Cockpit backend contracts — not payment processor replacement.

All financial behaviour resolves through registry references — **REG-FINANCIAL-POLICY**, **REG-COMMERCE-POLICY**, **REG-CONNECTION-PROVIDER**, **REG-READINESS-POLICY** — with fee and tax rates derived from policy refs, not hardcoded provider values. Pillow governs every financial operation with no bypass.

**G7-06 not started** per mission directive.

---

## 1. Financial Domains (13)

Amazon Revenue · Shopify Revenue · Stripe Revenue · Subscription Revenue · Advertising Spend · Supplier Cost · Refunds · Chargebacks · Shipping Cost · Operational Cost · Net Profit · Cash Position · Projected Profit

---

## 2. Financial States (8)

`pending` · `processing` · `completed` · `failed` · `reconciled` · `requires_review` · `blocked` · `cancelled`

---

## 3. Financial Record Contract Fields

`financialRecordId` · `workspaceId` · `brandId` · `providerId` · `transactionType` · `currency` · `grossAmount` · `fees` · `refundAmount` · `taxAmount` · `netAmount` · `status` · `reconciliationStatus` · `evidence` · `createdAt` · `updatedAt` · `correlationId` · `governanceState` · `domainId`

---

## 4. Financial KPIs (12)

Gross Revenue · Net Revenue · Gross Profit · Net Profit · Profit Margin · Subscription MRR · Advertising ROI · Refund Rate · Chargeback Rate · Cash Available · Outstanding Payouts · Operational Expenses

All KPI metric refs resolve from **REG-FINANCIAL-POLICY** (`kpiMetricRefs` array).

---

## 5. Subsystem Components

| Component | Location |
|-----------|----------|
| Financial operation contracts | `contracts/financial-operations-types.ts` |
| Cockpit backend contracts | `contracts/financial-operations-cockpit-contracts.ts` |
| Brain module contract | `contract/financial-operations-module.ts` (G7-05) |
| Financial operations service | `services/grand-king-revenue-financial-operations-service.ts` |
| Financial ledger | `services/financial-ledger.ts` |
| Revenue aggregation engine | `services/revenue-aggregation-engine.ts` |
| Expense aggregation engine | `services/expense-aggregation-engine.ts` |
| Profitability engine | `services/profitability-engine.ts` |
| Payout tracker | `services/payout-tracker.ts` |
| Subscription tracker | `services/subscription-tracker.ts` |
| Advertising spend tracker | `services/advertising-spend-tracker.ts` |
| Refund tracker | `services/refund-tracker.ts` |
| Financial KPI engine | `services/financial-kpi-engine.ts` |
| Executive finance dashboard | `services/executive-finance-dashboard.ts` |
| Financial policy seed | `data/financial-policy-seed.ts` |
| Registry resolver | `registry/financial-operations-registry-resolver.ts` |
| Pillow governance | `governance/financial-operations-pillow-governance.ts` |
| EKLS integration | `ekls/financial-operations-ekls-integration.ts` |
| Plugin host | `plugins/financial-operations-plugin-host.ts` |
| Brain tools (9 required + helpers) | `tools/financial-operations-tools.ts` |

---

## 6. Registry Integration

| Registry | Purpose |
|----------|---------|
| REG-FINANCIAL-POLICY | Default currency, fee/tax rate refs, domain refs, KPI metrics (new) |
| REG-COMMERCE-POLICY | Commerce policy dependency for domain mapping |
| REG-CONNECTION-PROVIDER | Provider resolution for revenue/advertising/supplier domains |
| REG-READINESS-POLICY | Reconciliation policy dependency |

**New registry:** `REG-FINANCIAL-POLICY` added to production workspace registry tier with seed row `financial-policy-grand-king-production`.

---

## 7. Brain Tools (9 Required)

| Tool | Purpose |
|------|---------|
| `financial_overview` | Financial overview + Cockpit view |
| `financial_summary` | Executive financial summary |
| `financial_dashboard` | Executive finance dashboard |
| `profitability_report` | Profitability computation |
| `cash_position` | Cash position summary |
| `advertising_roi` | Advertising ROI metrics |
| `subscription_metrics` | Subscription MRR and churn |
| `financial_risk_register` | Financial anomaly risk register |
| `financial_status` | Framework status and registry deps |

Additional helper tools: `initialize_grand_king_revenue_financial_operations`, `financial_dependencies`, `financial_health`, `financial_records`, `financial_payouts`.

---

## 8. EKLS Kinds (5)

`financial_record_created` · `financial_reconciled` · `profitability_updated` · `financial_anomaly_detected` · `financial_learning_recorded`

Consumer channel: `grand-king-revenue-financial-operations`

---

## 9. Cockpit Backend Contracts (No UI Redesign)

| Section | Contract Field |
|---------|----------------|
| Financial Dashboard | `financialDashboard` |
| Revenue Dashboard | `revenueDashboard` |
| Profit Dashboard | `profitDashboard` |
| Cash Flow | `cashFlow` |
| Payout Status | `payoutStatus` |
| Advertising ROI | `advertisingRoi` |
| Executive Financial Summary | `executiveFinancialSummary` |

View ID: `cockpit-grand-king-revenue-financial-operations` · Design language: `g4-cockpit`

---

## 10. Pillow Governance

Validates:

- Financial authority
- Workspace authority
- Transaction visibility
- Financial integrity
- Executive authority

No financial operation bypass permitted.

---

## 11. Plugin Support

Plugin kinds without modifying finance core:

- `payment_provider`
- `financial_provider`
- `ledger_provider`
- `roi_analyser`
- `financial_report`

---

## 12. Security Posture

Never exposed in financial outputs:

- Bank credentials
- Payment credentials
- Tokens
- Customer payment information
- Supplier payment information

Secret redaction utility: `redactFinancialSecrets()` in contract types.

---

## 13. Hardcode Governance

Not hardcoded:

- Currencies (from REG-FINANCIAL-POLICY `defaultCurrency`)
- Providers (from REG-CONNECTION-PROVIDER)
- Fees (from policy `feeRateRefs` with registry-derived signals)
- Taxes (from policy `taxRateRefs` with registry-derived signals)
- Payment processors

---

## 14. Test Coverage

**File:** `backend/src/validation/tests/g7-05-grand-king-revenue-financial-operations.test.ts`  
**Result:** 18/18 PASS

| Test Area | Status |
|-----------|--------|
| Financial aggregation | ✅ |
| Profit calculation | ✅ |
| Cash flow | ✅ |
| Financial KPIs | ✅ |
| Brain tools | ✅ |
| Pillow governance | ✅ |
| EKLS recording | ✅ |
| Cockpit contracts | ✅ |
| Plugin compatibility | ✅ |
| Registry resolution | ✅ |
| Secret redaction | ✅ |

---

## 15. Validation Summary

| Check | Result |
|-------|--------|
| Backend typecheck | **PASS** |
| Frontend typecheck | **PASS** |
| G7-05 tests | **18/18 PASS** |
| Executive audit | **Generated** |

---

## 16. Integration Points

| System | Integration |
|--------|-------------|
| G7-00 Live Operations | Production eligibility signals |
| G7-01 Production Workspace | Workspace + connection providers |
| G7-02 Commerce Operations | Commerce operation signals for revenue |
| G7-03 Business Automation | Stack initialization dependency |
| G7-04 Executive Decision Centre | Stack initialization dependency |
| Brain | 14 tools registered in `brain/index.ts` |
| EKLS | Gateway channel `grand-king-revenue-financial-operations` |
| Cockpit | Backend contracts only — no UI redesign |
| Pillow | Governance on all financial operations |

---

## 17. Mission Completion

✅ Implementation complete  
✅ Backend typecheck passes  
✅ Frontend typecheck passes  
✅ Tests pass (18/18)  
✅ Executive audit generated  

**G7-06 not started.**

---

*Grand King Revenue & Financial Operations — G7-05 Executive Audit · EmpireAI Production Programme*
