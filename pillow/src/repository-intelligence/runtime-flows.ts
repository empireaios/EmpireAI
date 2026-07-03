import type { RuntimeFlow } from "./types.js";

/** Canonical runtime, startup, deployment, and recovery flows. */
export const RUNTIME_FLOWS: RuntimeFlow[] = [
  {
    id: "request-flow",
    name: "Authenticated Cockpit Request Flow",
    steps: [
      { order: 1, component: "Browser (empire-ai.co)", description: "User action in Cockpit or Pillow panel" },
      { order: 2, component: "Next.js BFF", description: "fetch /api/* with session cookie" },
      { order: 3, component: "Railway Brain API", description: "Fastify route handler + auth middleware" },
      { order: 4, component: "Brain dispatch / PillowHost", description: "Module routing or Pillow chat" },
      { order: 5, component: "Redis (optional)", description: "Queue jobs for async worker tasks" },
      { order: 6, component: "SQLite", description: "Persist audit, session, Pillow state" },
      { order: 7, component: "Response", description: "JSON back through BFF to browser" },
    ],
  },
  {
    id: "pillow-chat-flow",
    name: "Pillow Chat Flow",
    steps: [
      { order: 1, component: "GlobalAiAssistantProvider", description: "createPillowHostSession + sendPillowChat" },
      { order: 2, component: "BFF /api/pillow/*", description: "Proxy to Railway Pillow routes" },
      { order: 3, component: "PillowHost.routePrompt", description: "Context build + executive reasoning" },
      { order: 4, component: "ContextBuilder", description: "Repository slices + intelligence snapshot" },
      { order: 5, component: "LLMRouter", description: "OpenAI/Anthropic completion with assembled context" },
      { order: 6, component: "UI", description: "Render Pillow response in Cockpit panel" },
    ],
  },
  {
    id: "startup-flow",
    name: "PillowHost Startup Flow",
    steps: [
      { order: 1, component: "resolvePillowRepositoryRoot", description: "Prefer governance bundle on Railway" },
      { order: 2, component: "startPillow", description: "Bootstrap → Intelligence → ContextBuilder" },
      { order: 3, component: "Executive Self-Assessment", description: "Validate governance knowledge" },
      { order: 4, component: "Subsystem init", description: "Recovery, Sync, Supervisor, Command interface" },
      { order: 5, component: "lifecycle: running", description: "Accept sessions and chat" },
    ],
  },
  {
    id: "deploy-flow",
    name: "Production Deployment Flow",
    steps: [
      { order: 1, component: "GitHub push main", description: "Trigger Railway + Vercel builds" },
      { order: 2, component: "Railway build", description: "sync-pillow-governance → pillow build → backend build" },
      { order: 3, component: "Railway deploy", description: "node backend/dist/index.js with /data volume" },
      { order: 4, component: "Vercel build", description: "empireai-web Next.js standalone" },
      { order: 5, component: "Health checks", description: "/health and /api/pillow/health" },
    ],
  },
  {
    id: "recovery-flow",
    name: "Failure Recovery Flow",
    steps: [
      { order: 1, component: "PillowHost error", description: "Bootstrap or subsystem failure detected" },
      { order: 2, component: "Recovery Manager", description: "EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md procedure" },
      { order: 3, component: "Governance bundle", description: "Rebuild knowledge from .pillow-governance-bundle" },
      { order: 4, component: "Executive Self-Assessment", description: "Must pass before operational reasoning" },
      { order: 5, component: "Redeploy if needed", description: "Railway build must include all governance artifacts" },
    ],
  },
];
