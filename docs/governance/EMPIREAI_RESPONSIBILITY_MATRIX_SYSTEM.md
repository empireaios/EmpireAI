# EmpireAI Responsibility Matrix System

PILLOW-RMX-001 / Q1-06 provides the Responsibility Matrix.

The Responsibility Matrix is the official ownership framework for the AI Workforce. Every responsibility inside EmpireAI must have one accountable owner. No responsibility may be ambiguous. No responsibility may be duplicated without explicit collaboration rules.

Pillow must always know who owns a responsibility, who supports it, what inputs are required, what outputs are expected, what approvals are required, and what dependencies exist.

> Note: Doctrine ID is **PILLOW-RMX-001**. There is one authoritative Responsibility Matrix. Every AI Worker, Department and Factory must derive its operational responsibilities from this matrix.

## Boundaries

The Responsibility Matrix:

- **does** define ownership, define accountability, define dependencies, define approvals, and standardize responsibilities
- does **not** execute worker tasks
- does **not** replace the Authority Matrix
- does **not** replace the Organization Charter
- does **not** override Pillow
- does **not** override Grand King

## Responsibility record

Each responsibility includes: Matrix Version, Responsibility ID, Responsibility Name, Primary Owner, Supporting Workers, Department, Factory, Required Inputs, Expected Outputs, Dependencies, Required Approvals, Success Criteria, Failure Conditions, Escalation Target, and Metadata version (`RMX-001-v1`).

## Mandatory responsibility rules

Every responsibility must define exactly one accountable owner, optional supporting workers, required inputs, expected outputs, required approvals, dependency chain, escalation path, quality requirements, and completion criteria. No responsibility may exist outside this matrix.

## Safety

Credentials and authentication tokens are never exposed. Matrix operations preserve auditability and traceability. Sensitive values are masked in logs. Responsibility records never claim that the matrix executed worker tasks, replaced Authority Matrix, replaced Organization Charter, overrode Pillow, or overrode Grand King.
