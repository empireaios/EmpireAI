# EmpireAI Business Risk Worker

PILLOW-BRW-001 / Q2-08 provides the Business Risk Worker inside the Empire Builder Factory.

The Business Risk Worker receives the approved Business Blueprint (Q2-06) and Launch Plan (Q2-07) and performs a comprehensive risk assessment before executive approval.

It does **not** mitigate risks automatically, approve businesses, reject businesses, or launch businesses. It identifies, classifies, prioritizes, and reports risks.

> Note: Module id is `business-risk-worker`. The report type is `BrwBusinessRiskReport` / `BRW-RPT-v1`.

## Workflow

1. Receive the approved Business Blueprint from Q2-06.
2. Receive the Launch Plan from Q2-07.
3. Identify legal, operational, financial, brand, marketplace/platform, supplier, technical, security, compliance, and execution risks.
4. Assign likelihood and impact scores and overall risk ratings.
5. Recommend mitigation actions (recommendations only).
6. Produce a machine-readable Business Risk Report (`BRW-RPT-v1` / `BRW-001-v1`).
7. Submit through the Executive Reporting Runtime and preserve audit history.

## Risk categories

Legal, Operational, Financial, Brand, Marketplace / Platform, Supplier, Technical, Security, Compliance, Execution — architecture supports additional categories via configuration.

## Integrations

- Worker Registry
- Worker Lifecycle
- Worker Assignment Engine
- Business Blueprint Worker
- Launch Plan Worker
- Executive Reporting Runtime
- Worker Performance Review
- Worker Recovery System

## Boundaries

The Business Risk Worker:

- **does** identify, classify, prioritize risks, recommend mitigations, and produce executive risk reports
- does **not** remove risks automatically
- does **not** approve businesses
- does **not** reject businesses
- does **not** launch businesses
- does **not** override Pillow
- does **not** override Grand King
- does **not** implement Q2-09 or later

## Business Risk Report

Each report includes: Risk Report ID, Timestamp, Business Build Mission ID, Business Blueprint ID, Launch Plan ID, Risk Category entries with description, Likelihood, Impact, Overall Risk Rating, Recommended Mitigation, Residual Risk, Supporting Evidence, and Metadata Version (`BRW-001-v1`).

## Safety

Credentials and authentication tokens are never exposed. Full audit history is preserved. Sensitive values are masked in logs. Confirmed risks are distinguished from assumptions.
