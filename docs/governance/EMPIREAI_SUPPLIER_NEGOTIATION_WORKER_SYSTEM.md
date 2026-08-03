# EmpireAI Supplier Negotiation Worker

PILLOW-SNW-001 / Q3-06 provides the Supplier Negotiation Worker.

The Supplier Negotiation Worker prepares professional supplier negotiation packages before any communication with suppliers.

Its responsibility is **preparation only**. It generates negotiation strategy, questions, comparison analysis, and message drafts for downstream approval and execution.

> Note: Doctrine ID is **PILLOW-SNW-001**. Metadata version `SNW-001-v1`. Report version `SNW-RPT-v1`. Public alias: `SnwSupplierNegotiationReport`.

## Boundaries

The Supplier Negotiation Worker:

- **does** receive Supplier Evaluation Reports, compare suppliers, identify negotiation opportunities, prepare MOQ/pricing/shipping/fulfilment/refund questions, draft professional negotiation messages, recommend a preferred supplier, and produce machine-readable Supplier Negotiation Reports
- does **not** contact suppliers automatically
- does **not** commit to agreements
- does **not** place orders
- does **not** implement Q3-07 or later
- does **not** override Pillow or Grand King

## Supplier Negotiation Report

Each report includes: Negotiation ID, Timestamp, Product ID, Candidate Suppliers, Preferred Supplier, Comparison Summary, MOQ Negotiation, Price Negotiation, Shipping Negotiation, Fulfilment Questions, Refund Questions, Draft Negotiation Message, Recommendation, Supporting Evidence, and Metadata version (`SNW-001-v1`).

## Recommendations

- **Prefer** — preferred supplier is clear enough to prepare transmission after Pillow approval
- **Review** — candidates need Pillow attention before preferring one
- **Defer** — evaluation quality is insufficient to negotiate

## Prerequisites

- Q3-05 Supplier Evaluation Worker (`PILLOW-SEW-001`)

## Safety

Credentials and authentication tokens are never exposed. Negotiations preserve evaluation and discovery traceability and audit history. Draft messages explicitly state they have not been transmitted. Reports are submitted through the Executive Reporting Runtime.
