# Owner simulated financial completeness readback

Module: `backend/src/runtime/commerce-runtime/governed/work8-owner-finance.ts`.

`readOwnerSimulatedFinance(store, workspace, missionId)` verifies canonical receipt history, then projects existing simulated orders. Intended integration is `simulatedFinancials` on the existing authenticated `/api/owner/commerce` GET response. No new routes, authority or finance writes are introduced.

Owner fields: product title, order state, quantity/currency, quoted sales/COGS/freight and recorded refund-intent exposure. Quoted sales are not collected revenue; quoted costs are not settled invoices. Forecast fee percentages/duty/tax assumptions remain a separate labelled object. Missing charged fees, assessed taxes, supplier invoices/credits, settlement, payout holds, bank receipts and realised contribution are null. Delivery never implies bank settlement. Unknown supplier outcomes explicitly state that automatic resubmission is blocked.

Each order links the exact canonical receipt digest/version, mission/order identity, supplier quote provenance and refund intent IDs. No implicit conversion or cross-currency totals. Missions without orders return an empty list and `NO_SIMULATED_ORDERS`, never fabricated zero sales or complete financials.

Validation: two targeted tests under Node 22.23.2 with kernel egress denied; strict TypeScript pass. Tests cover a completed canonical worker lifecycle, expected quote amounts, canonical refund, missing charged amounts, unchanged history digest and workspace isolation. Runtime/owner UI integration is performed by the root agent and requires its own verification. This module cannot manufacture a financial completion receipt.
