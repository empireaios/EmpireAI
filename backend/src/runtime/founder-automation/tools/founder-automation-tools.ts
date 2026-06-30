import type { RegisteredTool } from "../../../brain/types.js";
import { buildFounderJourney } from "../services/founder-journey-service.js";
import { buildHumanActionQueue } from "../services/human-action-queue-service.js";
import { analyzeAutomationOpportunities } from "../services/automation-opportunity-service.js";
import { buildFounderWorkloadDashboard } from "../services/founder-workload-dashboard-service.js";
import { createAutomationPlan } from "../services/automation-planner-service.js";
import { AutomationPlanInputSchema } from "../models/automation-plan.js";

export const founderAutomationTools: RegisteredTool[] = [
  {
    name: "founder_automation.journey",
    description: "Founder lifecycle journey stages (E-011)",
    module: "founder-automation",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } }, required: ["companyId"] },
    handler: async (args) =>
      buildFounderJourney(args.workspaceId ? String(args.workspaceId) : "ws_empire_1", String(args.companyId)),
  },
  {
    name: "founder_automation.queue",
    description: "Human action queue for founder tasks (E-012)",
    module: "founder-automation",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } }, required: ["companyId"] },
    handler: async (args) =>
      buildHumanActionQueue(args.workspaceId ? String(args.workspaceId) : "ws_empire_1", String(args.companyId)),
  },
  {
    name: "founder_automation.opportunities",
    description: "Automation opportunity classification (E-013)",
    module: "founder-automation",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } }, required: ["companyId"] },
    handler: async (args) =>
      analyzeAutomationOpportunities(args.workspaceId ? String(args.workspaceId) : "ws_empire_1", String(args.companyId)),
  },
  {
    name: "founder_automation.plan",
    description: "Generate automation plan for founder goal (E-015)",
    module: "founder-automation",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" }, goal: { type: "string" }, targetCountryCode: { type: "string" }, productCategory: { type: "string" } },
      required: ["companyId", "goal"],
    },
    handler: async (args) => {
      const input = AutomationPlanInputSchema.parse({
        goal: String(args.goal),
        targetCountryCode: args.targetCountryCode ? String(args.targetCountryCode) : undefined,
        productCategory: args.productCategory ? String(args.productCategory) : undefined,
      });
      return createAutomationPlan(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
        input,
      );
    },
  },
  {
    name: "founder_automation.dashboard",
    description: "Founder workload Mission Control dashboard (E-014)",
    module: "founder-automation",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } }, required: ["companyId"] },
    handler: async (args) =>
      buildFounderWorkloadDashboard(args.workspaceId ? String(args.workspaceId) : "ws_empire_1", String(args.companyId)),
  },
];
