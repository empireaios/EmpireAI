# AI Agents

Agent definitions, tools, and workflows for EmpireAI — registered through the **EmpireAI Brain** in `backend/`.

## Architecture

Agents are **not** standalone executors. Every agent runs through the Brain orchestrator:

```
Module UI → POST /brain/dispatch → Orchestrator → Agent Manager → LLM + Tools
```

## Where code lives

| Concern | Location |
|---------|----------|
| Agent definitions | `backend/src/agents/definitions/agents.ts` |
| Module routes | `backend/src/agents/routes/module-routes.ts` |
| Tool handlers | `backend/src/agents/tools/` |
| Workflows | `backend/src/agents/workflows/workflows.ts` |
| Brain core | `backend/src/brain/` |

## Adding a new agent

1. Implement tools in `backend/src/agents/tools/`
2. Add agent definition to `backend/src/agents/definitions/agents.ts`
3. Map module action in `backend/src/agents/routes/module-routes.ts`

No changes to the Brain core are required.

## Registered agents

Victoria (AI CEO), Morgan (Product Intelligence), Alex (Suppliers), Casey (Store Builder), Riley (Marketing), Taylor (Ad Manager), Blake (Finance), Sam (Orders), Nova (Support), Avery (Dashboard), Sentinel (Admin).

See `backend/README.md` for setup and API documentation.
