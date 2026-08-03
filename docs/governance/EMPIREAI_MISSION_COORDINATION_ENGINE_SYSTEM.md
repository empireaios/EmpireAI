# EmpireAI Mission Coordination Engine System

PILLOW-MCE-001 / Q0-25 provides the Mission Coordination Engine.

The Mission Coordination Engine is responsible for coordinating the complete lifecycle of every mission executed by the AI Workforce. While the Workforce Orchestrator coordinates workers, the Mission Coordination Engine coordinates the mission itself. It ensures every mission progresses correctly through every stage until successful completion or controlled termination.

The Mission Coordination Engine never performs worker tasks. It coordinates mission execution.

> Note: Doctrine ID is **PILLOW-MCE-001**. There is one authoritative Mission Coordination Engine. All future missions must be coordinated through this service. Doctrine ID avoids collision with Execution Control Center (ECC).

## Boundaries

The Mission Coordination Engine:

- **does** coordinate mission lifecycle, monitor mission progress, coordinate approvals, coordinate worker dependencies, and report mission status
- does **not** execute worker logic
- does **not** replace Workforce Orchestrator
- does **not** replace Executive Planner
- does **not** override Pillow
- does **not** override Grand King

## Mission Record

Each record includes: Mission ID, Timestamp, Business ID, Mission Name, Mission Owner, Mission Status, Current Phase, Assigned Workers, Dependencies, Approval Checkpoints, Progress, Blockers, Completion Status, and Metadata version (`MCE-001-v1`).

## Mission states

Default: planned, waiting, ready, running, waiting approval, blocked, paused, recovering, completed, cancelled, failed.

Additional states can be registered through configuration without redesigning the engine.

## Mission phases

Default: planning, preparation, execution, review, approval, completion, closure.

## Safety

Credentials and authentication tokens are never exposed. Mission coordination operations preserve auditability and traceability. Sensitive values are masked in logs. Mission records never claim that the engine executed worker logic, replaced Workforce Orchestrator, replaced Executive Planner, overrode Pillow, or overrode Grand King.
