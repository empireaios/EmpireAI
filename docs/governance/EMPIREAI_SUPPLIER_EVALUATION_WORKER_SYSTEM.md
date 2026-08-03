# EmpireAI Supplier Evaluation Worker

PILLOW-SEW-001 / Q3-05 provides the Supplier Evaluation Worker.

The Supplier Evaluation Worker evaluates every supplier discovered by the Supplier Discovery Worker and objectively determines whether a supplier is suitable for EmpireAI operations.

Its responsibility is **evaluation only**. It produces standardized Supplier Evaluation Reports for downstream workers.

> Note: Doctrine ID is **PILLOW-SEW-001**. Metadata version `SEW-001-v1`. Report version `SEW-RPT-v1`. Public alias: `SewSupplierEvaluationReport`.

## Boundaries

The Supplier Evaluation Worker:

- **does** receive Supplier Discovery Reports, score reliability/price/shipping/refund policy/fulfilment quality/communication/risk, generate an overall score, recommend Approve/Review/Reject, and produce machine-readable Supplier Evaluation Reports
- does **not** discover suppliers
- does **not** negotiate with suppliers
- does **not** place supplier orders
- does **not** modify supplier information
- does **not** implement Q3-06 or later
- does **not** override Pillow or Grand King

## Supplier Evaluation Report

Each report includes: Evaluation ID, Timestamp, Supplier ID, Supplier Name, Product ID, Reliability Score, Price Score, Shipping Score, Refund Policy Score, Fulfilment Quality Score, Communication Score, Risk Score, Overall Score, Recommendation, Supporting Evidence, Confidence Score, and Metadata version (`SEW-001-v1`).

## Recommendations

- **Approve** — overall score meets approve threshold with acceptable reliability, fulfilment, and risk floors
- **Review** — overall score meets review threshold but needs Pillow attention
- **Reject** — overall score below review threshold

## Prerequisites

- Q3-04 Supplier Discovery Worker (`PILLOW-SDW-001`)

## Safety

Credentials and authentication tokens are never exposed. Evaluations preserve discovery traceability and audit history. Facts are distinguished from assumptions. Sensitive values are masked in logs. Reports are submitted through the Executive Reporting Runtime.
