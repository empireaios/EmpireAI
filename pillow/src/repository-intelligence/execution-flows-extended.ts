import type { RuntimeFlow } from "./types.js";
import { RUNTIME_FLOWS } from "./runtime-flows.js";

/** Extended execution flows for repository architecture intelligence (PILLOW-RI-002). */
export const EXTENDED_EXECUTION_FLOWS: RuntimeFlow[] = [
  {
    id: "executive-home-flow",
    name: "Executive Home Rendering",
    steps: [
      { order: 1, component: "Founder Shell", description: "Grand King enters at /cockpit Executive Home" },
      { order: 2, component: "CockpitShell", description: "Sidebar · command strip · global assistant" },
      { order: 3, component: "ExecutiveHomePage", description: "Live KPI widgets and approval routing" },
      { order: 4, component: "BFF /api/brain/*", description: "Fetch executive relationship graph and KPIs" },
      { order: 5, component: "Founder Shell API", description: "Optional /api/pillow/founder-shell context" },
      { order: 6, component: "Render", description: "Executive summary without source code reading" },
    ],
  },
  {
    id: "executive-home-pillow-flow",
    name: "Executive Home → Pillow → Capability → Results",
    steps: [
      { order: 1, component: "Executive Home", description: "Grand King selects Pillow or asks via global assistant" },
      { order: 2, component: "Pillow", description: "Context build + knowledge routing" },
      { order: 3, component: "Capability Router", description: "Context task detection · subsystem routing" },
      { order: 4, component: "OpenAI Intelligence Platform", description: "LLMRouter completion with repository context" },
      { order: 5, component: "Marketplace APIs / Business Engines", description: "Brain dispatch when commerce or automation required" },
      { order: 6, component: "Results", description: "Response to Cockpit · journey recording" },
      { order: 7, component: "EKLS", description: "Executive Learning Engine observes conversation" },
    ],
  },
  {
    id: "authentication-flow",
    name: "Authentication Flow",
    steps: [
      { order: 1, component: "Login Page", description: "/login — Pillow Gateway or Founder Shell entry" },
      { order: 2, component: "POST /api/auth/login", description: "Session cookie issued" },
      { order: 3, component: "middleware.ts", description: "Auth guard for /cockpit/*" },
      { order: 4, component: "CockpitAuthGuard", description: "Client-side session validation" },
      { order: 5, component: "Founder role", description: "founder/admin permissions for Pillow routes" },
    ],
  },
  {
    id: "commerce-flow",
    name: "Commerce Flow",
    steps: [
      { order: 1, component: "Commerce Workspace", description: "/cockpit/commerce/* department" },
      { order: 2, component: "Brain store module", description: "Commerce readiness and portfolio" },
      { order: 3, component: "Commerce Intelligence", description: "Pillow commerce-intelligence engine" },
      { order: 4, component: "Grand King approval", description: "Irreversible actions gated" },
      { order: 5, component: "Marketplace APIs", description: "Supplier and launch integrations" },
    ],
  },
  {
    id: "marketing-flow",
    name: "Marketing Flow",
    steps: [
      { order: 1, component: "Commerce Marketing", description: "/cockpit/commerce/marketing" },
      { order: 2, component: "Ad Intelligence", description: "Campaign and ad intel panels" },
      { order: 3, component: "Brain dispatch", description: "Marketing automation agents" },
      { order: 4, component: "Founder approval", description: "Live spend requires approval" },
    ],
  },
  {
    id: "executive-approval-flow",
    name: "Executive Approval Flow",
    steps: [
      { order: 1, component: "Proposal", description: "Mission or automation proposal generated" },
      { order: 2, component: "ApprovalGateEngine", description: "Objective alignment evaluation" },
      { order: 3, component: "ExecutiveCommandStrip", description: "Pending approvals visible in Cockpit" },
      { order: 4, component: "Grand King", description: "Approve · reject · override" },
      { order: 5, component: "Execution", description: "Cursor Bridge or synchronizer proceeds" },
    ],
  },
  {
    id: "mission-generation-flow",
    name: "Mission Generation Flow",
    steps: [
      { order: 1, component: "Grand King instruction", description: "Business instruction to Pillow" },
      { order: 2, component: "Cursor Bridge", description: "Route · sync gates · assemble mission" },
      { order: 3, component: "Mission Planner", description: "Engineering plan and tasks" },
      { order: 4, component: "Cursor Protocol", description: "Constitutional mission document" },
      { order: 5, component: "Supervisor", description: "Observe mission start" },
      { order: 6, component: "Builder", description: "Execute via Cursor" },
    ],
  },
  {
    id: "artifact-generation-flow",
    name: "Artifact Generation Flow",
    steps: [
      { order: 1, component: "Mission complete", description: "Builder finishes implementation" },
      { order: 2, component: "Repository Synchronizer", description: "Preview and approval gate" },
      { order: 3, component: "Journey System", description: "Record mission in journey" },
      { order: 4, component: "Governance artifacts", description: "Docs and audit updates" },
      { order: 5, component: "Executive audit", description: "Audit reviewer certification" },
    ],
  },
];

export function getAllExecutionFlows(): RuntimeFlow[] {
  return [...RUNTIME_FLOWS, ...EXTENDED_EXECUTION_FLOWS];
}
