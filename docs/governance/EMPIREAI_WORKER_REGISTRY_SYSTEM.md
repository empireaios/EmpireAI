# EmpireAI Worker Registry System

PILLOW-WRG-001 / Q1-07 provides the Worker Registry.

The Worker Registry is the single authoritative directory of every AI Worker within EmpireAI. No worker may exist unless it is registered.

Pillow must always know who the worker is, what role it performs, which department and factory it belongs to, what skills it possesses, which tools it may use, who governs it, its reporting line, and its operational status.

The Worker Registry is the identity layer of the AI Workforce.

> Note: Doctrine ID is **PILLOW-WRG-001**. There is one authoritative Worker Registry. Every AI Worker created in future Q Series missions must register here before becoming operational.

## Boundaries

The Worker Registry:

- **does** register workers, maintain worker identity, maintain the workforce directory, track worker status, and support workforce discovery
- does **not** execute worker tasks
- does **not** replace the Workforce Capability Registry
- does **not** replace the Organization Charter
- does **not** override Pillow
- does **not** override Grand King

## Worker record

Each worker includes: Registry Version, Worker ID, Worker Name, Worker Type, Department, Factory, Role, Reporting Line, Governing Authority (Pillow), Skill Profile, Approved Tools, Authority Level, Certification Status, Operational Status, Created Date, Last Updated, and Metadata version (`WRG-001-v1`).

## Worker states

Default: registered, active, busy, idle, suspended, retired, disabled, offline.

Additional worker states can be registered through configuration without redesign.

## Mandatory registry rules

Every registered worker must have a unique Worker ID, one primary role, one department, one factory, Pillow as governing authority, a reporting relationship, a skill profile, an approved tool list, an authority level, and a certification status. No worker may execute work unless registered.

## Safety

Credentials and authentication tokens are never exposed. Registry operations preserve auditability and traceability. Sensitive values are masked in logs. Worker records never claim that the registry executed worker tasks, replaced Workforce Capability Registry, replaced Organization Charter, overrode Pillow, or overrode Grand King.
