# EmpireAI Opportunity Evaluation Worker

PILLOW-OEW-001 / Q2-05 provides the Opportunity Evaluation Worker inside the Empire Builder Factory.

The Opportunity Evaluation Worker receives completed Business Model (Q2-03) and Market Research (Q2-04) outputs and performs an objective executive evaluation to determine whether a business opportunity is worth pursuing.

It does **not** approve the business. It produces a quantified evaluation for Pillow and, later, the Grand King.

> Note: Module id is `opportunity-evaluation-worker`. This is distinct from `opportunity-discovery-engine` and `opportunity-prioritization-engine`.

## Workflow

1. Receive Business Model from Q2-03.
2. Receive Market Research Report from Q2-04.
3. Evaluate market demand, implementation feasibility, revenue potential, and profitability potential.
4. Evaluate operational complexity, execution risk, and strategic fit with EmpireAI.
5. Generate weighted opportunity scores and recommend Proceed / Improve / Reject.
6. Produce a machine-readable Opportunity Evaluation Report (`OEW-RPT-v1` / `OEW-001-v1`).
7. Submit the report through the Executive Reporting Runtime and preserve audit history.

## Integrations

The worker integrates with:

- Worker Registry
- Worker Lifecycle
- Worker Assignment Engine
- Executive Reporting Runtime
- Worker Performance Review
- Worker Recovery System

## Boundaries

The Opportunity Evaluation Worker:

- **does** evaluate opportunities, score business viability, recommend next actions, and produce executive evaluation reports
- does **not** approve businesses
- does **not** modify business models
- does **not** launch businesses
- does **not** override Pillow
- does **not** override Grand King
- does **not** implement Q2-06 or later

## Opportunity Evaluation Report

Each report includes: Evaluation ID, Timestamp, Business Build Mission ID, Business Type, Demand Score, Feasibility Score, Profit Potential Score, Risk Score, Strategic Fit Score, Overall Opportunity Score, Recommendation, Supporting Evidence, Confidence Score, and Metadata Version (`OEW-001-v1`).

Every score is explained. Findings distinguish facts from assumptions and preserve complete traceability to prior Q2 worker outputs.

## Safety

Credentials and authentication tokens are never exposed. Full audit history is preserved. Sensitive values are masked in logs.
