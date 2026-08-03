# EmpireAI Worker Performance Review System

PILLOW-WPR-001 / Q1-11 provides the Worker Performance Review service.

The Worker Performance Review service continuously evaluates how well every AI Worker performs over time. Pillow should know not only whether a worker completed work, but how well the worker consistently performs.

Performance reviews become a permanent executive record used by future assignment, optimization and certification systems.

The Worker Performance Review service NEVER performs worker tasks. It evaluates worker performance.

> Note: Doctrine ID is **PILLOW-WPR-001**. There is one authoritative Worker Performance Review service. Every AI Worker must receive continuous performance reviews throughout its lifecycle.

## Boundaries

The Worker Performance Review service:

- **does** evaluate worker performance, score worker capability, recommend improvements, and produce executive performance reports
- does **not** execute worker tasks
- does **not** replace Worker Monitoring
- does **not** replace Workforce Certification Monitor
- does **not** override Pillow
- does **not** override Grand King

## Performance record

Each record includes: Performance Review ID, Timestamp, Worker ID, Worker Name, Department, Review Period, Quality Score, Accuracy Score, Speed Score, Reliability Score, Collaboration Score, Recovery Score, Business Outcome Score, Executive Rating, Improvement Recommendations, and Metadata version (`WPR-001-v1`).

## Performance metrics

Default: quality, accuracy, speed, reliability, consistency, collaboration, recovery, efficiency, business value, governance compliance.

Additional metrics can be registered through configuration without redesign.

## Performance ratings

Default: outstanding, excellent, good, acceptable, needs_improvement, poor.

Additional rating systems can be registered through configuration without redesign.

## Mandatory performance rules

Evaluate every active worker. Preserve historical performance. Detect improving and declining performance. Recommend improvements. Integrate with Worker Assignment Engine, Workforce Certification Monitor, and Adaptive Workforce Optimizer.

## Safety

Credentials and authentication tokens are never exposed. Performance operations preserve auditability and traceability. Sensitive values are masked in logs. Performance records never claim that the service executed worker tasks, replaced Worker Monitoring, replaced Workforce Certification Monitor, overrode Pillow, or overrode Grand King.
