import type { RegisteredTool } from "../../brain/types.js";
import { buildGrandKingAccountDashboard } from "../services/grand-king-dashboard-service.js";
import { GRAND_KING_WORKSPACE_ID } from "../constants.js";
import { handleGrandKingAutomationTool } from "../automation/grand-king-automation-server.js";
import { getGrandKingRepository } from "../repositories/sqlite-grand-king-repository.js";

export const grandKingTools: RegisteredTool[] = [
  {
    name: "grand_king.dashboard",
    description: "Grand King account dashboard — products, tasks, suppliers, orders, AI decisions",
    module: "grand-king",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) =>
      buildGrandKingAccountDashboard(args.workspaceId ? String(args.workspaceId) : GRAND_KING_WORKSPACE_ID),
  },
  {
    name: "grand_king.automation.run",
    description: "Run Grand King scheduled automation job",
    module: "grand-king",
    authorityLevel: "L2",
    parameters: { type: "object", properties: { jobName: { type: "string" } } },
    handler: async (args) => handleGrandKingAutomationTool(args as { jobName?: string }),
  },
  {
    name: "grand_king.tasks.list",
    description: "List Grand King tasks",
    module: "grand-king",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) =>
      getGrandKingRepository().listTasks(args.workspaceId ? String(args.workspaceId) : GRAND_KING_WORKSPACE_ID),
  },
];
