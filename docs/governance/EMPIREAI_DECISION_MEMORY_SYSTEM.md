# EmpireAI Decision Memory System

PILLOW-DMEM-001 / Q0-16 provides Decision Memory for Pillow.

Decision Memory is the permanent executive knowledge repository for every significant decision made by Pillow and the AI Workforce. Pillow should never make the same executive decision twice without understanding why it was made, what alternatives existed, what evidence supported it, whether it succeeded, and what the final outcome was. Decision Memory never makes decisions — it records executive decision intelligence.

> Note: Doctrine ID is **PILLOW-DMEM-001**. `PILLOW-DE-001` is reserved by Decision Engine (Q0-05) and must not be reused. Decision Memory does not replace Execution Memory (PILLOW-EXM-001).

## Boundaries

Decision Memory:

- **does** store decisions, retrieve decisions, search decisions, link decisions, and preserve executive history
- does **not** make decisions
- does **not** execute work
- does **not** replace Execution Memory
- does **not** override Pillow
- does **not** override Grand King

## Decision Record

Each record includes: Decision ID, Timestamp, Executive Objective, Business ID, Mission ID, Decision Summary, Recommended Option, Alternative Options, Decision Rationale, Supporting Evidence, Assumptions, Risk Assessment, Confidence Score, Approval Status, Final Outcome, Related Workers, and Metadata version (`DMEM-001-v1`).

## Lookup capabilities

Default dimensions: decision ID, business, mission, worker, outcome, confidence, date, approval status.

Additional lookup dimensions can be registered through configuration without redesigning Decision Memory.

## Safety

Credentials and authentication tokens are never exposed. Decision Memory operations preserve auditability and traceability. Sensitive values are masked in logs. Decision records never claim that Decision Memory made decisions, executed work, replaced Execution Memory, overrode Pillow, or overrode Grand King.
