# Automation

Operational automation for EmpireAI—workflows, scripts, and scheduled tasks that keep the platform and customer journeys running.

## Responsibilities

- CI/CD helper scripts and pipeline definitions (where not in `deployment/`)
- Scheduled jobs (reports, cleanups, agent batch runs)
- Integration workflows (CRM, email, analytics, billing)
- Cursor Automations and internal tooling scripts
- Alerting and notification pipelines

## Planned Structure

```
automation/
├── workflows/     # Declarative workflow definitions
└── scripts/       # One-off and maintenance scripts
```

## Conventions

- Scripts must be idempotent where possible
- Log actions for auditability
- Secrets via environment or secret manager—never hardcoded

## Status

Scaffold only. Application code not yet implemented.
