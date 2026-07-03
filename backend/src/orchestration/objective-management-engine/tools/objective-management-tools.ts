import type { RegisteredTool } from "../../../brain/types.js";
import {
  assessImplementationRecommendation,
  buildObjectiveDashboard,
  evaluateAllActiveObjectives,
  evaluateObjective,
  getObjective,
  getObjectiveReportingSummary,
  initializeObjectiveManagement,
  listActiveObjectives,
} from "../services/objective-management-service.js";

export const objectiveManagementTools: RegisteredTool[] = [
  {
    name: "objective_management.initialize",
    description: "Initialize OMS and seed OBJ-001 PROOF-001 if empty",
    module: "objective-management",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
    },
    handler: async (args, context) => ({
      objectives: initializeObjectiveManagement(
        args.workspaceId ? String(args.workspaceId) : context.workspaceId,
        args.companyId ? String(args.companyId) : context.companyId ?? "co-grand-king",
      ),
    }),
  },
  {
    name: "objective_management.list",
    description: "List active executive objectives",
    module: "objective-management",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
    },
    handler: async (args, context) => ({
      objectives: listActiveObjectives(
        args.workspaceId ? String(args.workspaceId) : context.workspaceId,
        args.companyId ? String(args.companyId) : context.companyId,
      ),
    }),
  },
  {
    name: "objective_management.get",
    description: "Get executive objective by ID",
    module: "objective-management",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: { objectiveId: { type: "string" } },
      required: ["objectiveId"],
    },
    handler: async (args) => getObjective(String(args.objectiveId)),
  },
  {
    name: "objective_management.dashboard",
    description: "Build OMS dashboard — active objectives, health, alerts",
    module: "objective-management",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
    },
    handler: async (args, context) =>
      buildObjectiveDashboard(
        args.workspaceId ? String(args.workspaceId) : context.workspaceId,
        args.companyId ? String(args.companyId) : context.companyId ?? "co-grand-king",
      ),
  },
  {
    name: "objective_management.evaluate",
    description: "Evaluate a single objective against live Brain signals",
    module: "objective-management",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { objectiveId: { type: "string" } },
      required: ["objectiveId"],
    },
    handler: async (args) => evaluateObjective(String(args.objectiveId)),
  },
  {
    name: "objective_management.evaluate_all",
    description: "Periodically evaluate all active objectives and emit King alerts on material change",
    module: "objective-management",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
    },
    handler: async (args, context) =>
      evaluateAllActiveObjectives(
        args.workspaceId ? String(args.workspaceId) : context.workspaceId,
        args.companyId ? String(args.companyId) : context.companyId,
      ),
  },
  {
    name: "objective_management.assess_implementation",
    description:
      "Decision rule — does proposed implementation increase probability of achieving active objectives?",
    module: "objective-management",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        summary: { type: "string" },
        objectiveIds: { type: "array", items: { type: "string" } },
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
      required: ["title", "summary"],
    },
    handler: async (args, context) =>
      assessImplementationRecommendation({
        title: String(args.title),
        summary: String(args.summary),
        objectiveIds: args.objectiveIds as string[] | undefined,
        workspaceId: args.workspaceId ? String(args.workspaceId) : context.workspaceId,
        companyId: args.companyId ? String(args.companyId) : context.companyId,
      }),
  },
  {
    name: "objective_management.reporting_summary",
    description: "Implementation report summary for active primary objective",
    module: "objective-management",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
    },
    handler: async (args, context) =>
      getObjectiveReportingSummary(
        args.workspaceId ? String(args.workspaceId) : context.workspaceId,
        args.companyId ? String(args.companyId) : context.companyId ?? "co-grand-king",
      ),
  },
];
