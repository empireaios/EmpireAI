# AI Agents

Specialized AI agents that power EmpireAI's intelligent automation for entrepreneurs.

## Responsibilities

- Agent personas (e.g., strategy, marketing, operations, finance)
- System prompts, tool definitions, and orchestration logic
- Multi-agent workflows and handoff patterns
- Evaluation datasets and quality benchmarks
- Integration points with `backend/` for actions and data retrieval

## Planned Structure

```
ai-agents/
├── agents/        # Agent implementations and configurations
├── prompts/       # Reusable prompt templates and variants
└── tools/         # Callable tools agents use (search, CRM, calendar, etc.)
```

## Conventions

- Prompts are versioned and reviewed like code
- Tools declare clear input/output schemas aligned with `api/`
- No secrets in prompt files—use environment-backed configuration

## Status

Scaffold only. Application code not yet implemented.
