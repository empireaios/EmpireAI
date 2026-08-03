# EmpireAI Skill & Tool Router System

PILLOW-STR-001 / Q0-12 provides the Skill & Tool Router for Pillow.

The Skill & Tool Router is the authoritative executive routing service that matches executive intent to the most suitable AI workers and approved tools. Pillow never manually selects workers or tools. Pillow submits executive intent; the router determines required capabilities, best workers, approved tools, multi-worker needs, and escalation. The router never performs the work.

## Boundaries

Skill & Tool Router:

- **does** match workers, match tools, recommend routing, and produce routing plans
- does **not** execute work
- does **not** perform orchestration
- does **not** replace workers
- does **not** override Pillow
- does **not** override Grand King

## Routing Record

Each record includes: Routing ID, Timestamp, Executive Request, Required Capabilities, Selected Worker(s), Selected Tool(s), Routing Reason, Risk Assessment, Cost Assessment, Confidence Score, Alternative Routes, and Metadata version (`STR-001-v1`).

## Routing factors

Default factors: worker capability, worker availability, worker performance, worker authority, tool compatibility, tool availability, security, cost, risk, business context.

Additional routing criteria can be registered through configuration without redesigning the router.

## Registry integration

The router queries a Workforce Capability Registry-aligned catalog to evaluate workers, capabilities, and approved tools. Routing remains read-only and recommendation-only.

## Safety

Credentials and authentication tokens are never exposed. Routing operations preserve auditability and traceability. Sensitive values are masked in logs. Routing records never claim work execution or orchestration authority.
