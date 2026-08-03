# EmpireAI Decision Engine System

PILLOW-DE-001 / Q0-05 provides the Decision Engine for Pillow.

The Decision Engine is the authoritative executive reasoning service that evaluates multiple possible actions and recommends the best course of action. It reasons before execution. It does not execute work.

## Boundaries

Decision Engine:

- **does** evaluate options, compare alternatives, score decisions, and recommend actions
- does **not** execute work
- does **not** assign workers
- does **not** approve actions
- does **not** override Pillow
- does **not** replace Grand King approval

## Decision Package

Each package includes: Decision ID, Timestamp, Executive Objective, Candidate Options, Evaluation Matrix, Trade-off Analysis, Recommended Option, Confidence Score, Risk Assessment, Assumptions, Missing Information, Supporting Evidence, and Metadata version (`DE-001-v1`).

## Evaluation criteria

Default criteria: business_value, strategic_alignment, cost, complexity, risk, time, resource_requirement, probability_of_success.

Additional criteria can be registered through configuration without redesigning the Decision Engine.

## Safety

Credentials and authentication tokens are never exposed. Decision operations preserve auditability and traceability. Sensitive values are masked in logs. Recommendations never grant approval authority.
