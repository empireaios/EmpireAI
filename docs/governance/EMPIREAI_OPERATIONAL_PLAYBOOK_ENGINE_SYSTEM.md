# EmpireAI Operational Playbook Engine System

PILLOW-OPBK-001 / Q0-15 provides the Operational Playbook Engine for Pillow.

The Operational Playbook Engine is the authoritative executive playbook service that lets Pillow execute standardized operational procedures consistently across EmpireAI. Pillow does not reinvent workflows every time. Instead, Pillow identifies the appropriate approved playbook and prepares an executable workflow for the AI Workforce. The engine never performs worker tasks itself — it interprets, validates, and coordinates approved playbooks.

> Note: Doctrine ID is **PILLOW-OPBK-001**. `PILLOW-OPE-001` (Opportunity Prioritization) and `PILLOW-PBE-001` (Portfolio Balance) are reserved and must not be reused. This module is distinct from the backend `empire-playbook-engine` runtime surface.

## Boundaries

Operational Playbook Engine:

- **does** register playbooks, interpret playbooks, validate playbooks, prepare executable workflows, and track execution progress
- does **not** execute worker tasks
- does **not** replace workers
- does **not** replace the Workforce Orchestrator
- does **not** override Pillow
- does **not** override Grand King

## Playbook Record

Each definition includes: Playbook ID, Version, Category, Name, Purpose, Preconditions, Execution Steps, Required Capabilities, Required Tools, Approval Requirements, Success Criteria, Failure Criteria, and Metadata version (`OPBK-001-v1`).

## Playbook types

Default categories: business, commerce, media, marketplace, marketing, finance, customer service, operations, recovery, emergency.

Additional playbook types can be registered through configuration without redesigning the engine.

## Safety

Credentials and authentication tokens are never exposed. Playbook operations preserve auditability and traceability. Sensitive values are masked in logs. Execution records never claim worker-task execution, worker replacement, Workforce Orchestrator replacement, Pillow override, or Grand King override.
