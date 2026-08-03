# EmpireAI Product Evaluation Worker

PILLOW-PEW-001 / Q3-03 provides the Product Evaluation Worker.

The Product Evaluation Worker evaluates every product discovered by the Product Discovery Worker and objectively determines whether a product is commercially suitable for EmpireAI.

Its responsibility is **evaluation only**. It produces standardized Product Evaluation Reports for downstream workers.

> Note: Doctrine ID is **PILLOW-PEW-001**. Metadata version `PEW-001-v1`. Report version `PEW-RPT-v1`. Public alias: `PewProductEvaluationReport`.

## Boundaries

The Product Evaluation Worker:

- **does** receive discovered products, score margin/demand/competition/shipping/risk/reviews/creative potential, generate an overall score, recommend Proceed/Review/Reject, and produce machine-readable Product Evaluation Reports
- does **not** discover products
- does **not** select suppliers
- does **not** create listings
- does **not** purchase inventory
- does **not** implement Q3-04 or later
- does **not** override Pillow or Grand King

## Product Evaluation Report

Each report includes: Evaluation ID, Timestamp, Product ID, Product Name, Category, Margin Score, Demand Score, Competition Score, Shipping Score, Risk Score, Review Score, Creative Potential Score, Overall Score, Recommendation, Supporting Evidence, Confidence Score, and Metadata version (`PEW-001-v1`).

## Recommendations

- **Proceed** — overall score meets proceed threshold with acceptable risk/demand floors
- **Review** — overall score meets review threshold but needs Pillow attention
- **Reject** — overall score below review threshold

## Prerequisites

- Q3-02 Product Discovery Worker (`PILLOW-PDW-001`)

## Safety

Credentials and authentication tokens are never exposed. Evaluations preserve discovery traceability and audit history. Facts are distinguished from assumptions. Sensitive values are masked in logs.
