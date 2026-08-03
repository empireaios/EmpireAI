# EmpireAI Worker Assignment Engine System

PILLOW-WAE-001 / Q1-09 provides the Worker Assignment Engine.

The Worker Assignment Engine is responsible for selecting the most appropriate AI Worker(s) for every mission. Pillow should never manually choose workers. Instead, Pillow provides the mission requirements. The Assignment Engine evaluates all registered workers and recommends the optimal assignment.

Assignments must always maximize quality while minimizing risk and resource conflicts.

> Note: Doctrine ID is **PILLOW-WAE-001**. There is one authoritative Worker Assignment Engine. Every future mission must receive worker assignments through this engine before execution.

## Boundaries

The Worker Assignment Engine:

- **does** evaluate workers, recommend assignments, select supporting workers, and produce assignment recommendations
- does **not** execute worker tasks
- does **not** replace the Workforce Orchestrator
- does **not** replace Task Negotiation Protocol
- does **not** override Pillow
- does **not** override Grand King

## Assignment record

Each record includes: Assignment ID, Timestamp, Mission ID, Business ID, Mission Requirements, Candidate Workers, Evaluation Criteria, Selected Primary Worker, Supporting Workers, Assignment Reason, Risk Assessment, Estimated Cost, Confidence Score, and Metadata version (`WAE-001-v1`).

## Assignment factors

Default: skills, certification, availability, current workload, authority, required tools, dependencies, risk, cost, historical performance.

Additional assignment factors can be registered through configuration without redesign.

## Mandatory assignment rules

Never assign uncertified workers. Never assign unavailable workers. Never exceed worker authority. Never violate the Authority Matrix. Respect the Responsibility Matrix. Respect Worker Lifecycle status. Respect Worker Certification status.

## Safety

Credentials and authentication tokens are never exposed. Assignment operations preserve auditability and traceability. Sensitive values are masked in logs. Assignment records never claim that the service executed worker tasks, replaced Workforce Orchestrator, replaced Task Negotiation Protocol, overrode Pillow, or overrode Grand King.
