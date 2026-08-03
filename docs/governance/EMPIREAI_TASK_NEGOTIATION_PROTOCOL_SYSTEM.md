# EmpireAI Task Negotiation Protocol System

PILLOW-TNP-001 / Q0-20 provides the Task Negotiation Protocol.

The Task Negotiation Protocol enables AI Workers to intelligently negotiate among themselves before accepting work. Pillow should never manually decide which worker owns every task. Workers evaluate capabilities, negotiate ownership, identify dependencies, request assistance, agree on execution order, and report the negotiated result back to Pillow. Pillow remains the final executive authority. Workers never negotiate around Pillow.

> Note: Doctrine ID is **PILLOW-TNP-001**. Task Negotiation Protocol does not replace Workforce Orchestrator (PILLOW-PWO-001) and does not execute worker tasks.

## Boundaries

The Task Negotiation Protocol:

- **does** coordinate worker negotiation, determine task ownership, build dependency relationships, coordinate handoffs, and escalate unresolved conflicts
- does **not** execute worker tasks
- does **not** replace Workforce Orchestrator
- does **not** replace Pillow
- does **not** override Grand King
- does **not** perform strategic planning

## Negotiation Record

Each record includes: Negotiation ID, Timestamp, Mission ID, Task ID, Candidate Workers, Capability Assessment, Ownership Decision, Supporting Workers, Dependency Graph, Negotiation Result, Escalation Status, and Metadata version (`TNP-001-v1`).

## Negotiation outcomes

Default: accepted, declined, shared ownership, delegated, escalated, waiting dependency, cancelled.

Additional outcomes can be registered through configuration without redesigning the protocol.

## Safety

Credentials and authentication tokens are never exposed. Negotiation operations preserve auditability and traceability. Sensitive values are masked in logs. Negotiation records never claim that the protocol executed worker tasks, replaced Workforce Orchestrator, replaced Pillow, overrode Grand King, or performed strategic planning.
