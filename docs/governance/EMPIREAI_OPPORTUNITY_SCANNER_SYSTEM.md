# EmpireAI Opportunity Scanner System

PILLOW-OSC-001 / Q0-02 provides the Opportunity Scanner for Pillow.

The Opportunity Scanner accepts configured opportunity domains, scans for business and operational improvement opportunities, normalizes them into structured records, scores relevance / profit potential / feasibility / confidence / risk, and marks opportunities as pending Pillow review.

## Boundaries

The Opportunity Scanner:

- does **not** execute opportunities
- does **not** approve opportunities
- does **not** assign workers
- does **not** create businesses

It only discovers, structures, scores, and prepares opportunities for Pillow review.

## Opportunity record structure

Each record includes: Opportunity ID, Timestamp, Opportunity category, Source / signal, Summary, Business value hypothesis, Feasibility score, Profit potential score, Risk score, Confidence score, Recommended next step, Review status, Validation status, and Metadata version (`OSC-001-v1`).

## Safety

Credentials and authentication tokens are never exposed. Scanning preserves auditability and traceability. Sensitive values are masked in logs.
