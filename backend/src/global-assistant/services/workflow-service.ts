import type { AssistantWorkflow } from "../models/global-assistant.js";
import { resolveScreenContext } from "../screen-registry.js";

const WORKFLOWS: AssistantWorkflow[] = [
  {
    workflowId: "wf-mission-home-daily",
    screenId: "mission-home",
    title: "Daily King briefing",
    description: "Review SUCCESS-001, surveillance signals, and today's mission.",
    steps: [
      "Open Mission Home executive summary row",
      "Review Critical Notifications (GC-03)",
      "Ask the assistant Why? on Empire Health or SUCCESS-001",
      "Execute the top recommended mission",
    ],
  },
  {
    workflowId: "wf-product-discovery",
    screenId: "product-discovery",
    title: "Discover and approve a product",
    description: "Find a winning SKU with chief evidence before supplier sourcing.",
    steps: [
      "Review scored products from discovery pipeline",
      "Use Why? on overall score and margin KPIs",
      "Approve product after evidence review",
      "Route to Supplier Intelligence",
    ],
  },
  {
    workflowId: "wf-approvals-king",
    screenId: "approvals",
    title: "King approval queue",
    description: "Process money-moving items through the approval gate.",
    steps: [
      "Review pending approvals count",
      "Open each item and read council evidence",
      "Approve, reject, or defer via owner route",
      "Confirm audit log entry",
    ],
  },
  {
    workflowId: "wf-infrastructure-connect",
    screenId: "infrastructure",
    title: "Connect commerce stack",
    description: "Validate REAL integration readiness before scaling.",
    steps: [
      "Review reality-integration dashboard",
      "Connect marketplace and supplier providers",
      "Run validation sync",
      "Return to Mission Home for blocker update",
    ],
  },
  {
    workflowId: "wf-ai-team-chiefs",
    screenId: "ai-team",
    title: "Consult the three chiefs",
    description: "REAL-031/032/033 recommend-only briefing.",
    steps: [
      "Review Commerce chief recommendations",
      "Review Growth rollout targets",
      "Review Customer trust and retention signals",
      "Generate a mission from top blocker",
    ],
  },
];

export function listGuidedWorkflows(screenPath: string): AssistantWorkflow[] {
  const screen = resolveScreenContext(screenPath);
  const matched = WORKFLOWS.filter((w) => w.screenId === screen.screenId);
  if (matched.length > 0) return matched;
  return WORKFLOWS.filter((w) => w.screenId === "mission-home");
}

export function getContextualHelp(screenPath: string) {
  const screen = resolveScreenContext(screenPath);
  const workflows = listGuidedWorkflows(screenPath);

  return {
    screen,
    helpTopics: [
      {
        topic: "Why?",
        description: `Ask for live evidence on any KPI on ${screen.screenTitle}. Sources: REAL-031, REAL-032, REAL-033, Executive Council, ESS.`,
      },
      {
        topic: "Missions",
        description: "Generate governed mission proposals from PROGRAM_CATALOG blockers (REAL-057). All require King approval.",
      },
      {
        topic: "Executive Audit",
        description: "Generate a markdown Executive Audit from current screen context and live evidence.",
      },
      {
        topic: "Commands",
        description: "Runtime commands register through the approval gate — nothing executes without King approval.",
      },
    ],
    workflows,
    boundApis: screen.boundApis ?? [],
    computedAt: new Date().toISOString(),
  };
}
