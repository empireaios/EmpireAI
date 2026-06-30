import type { RegisteredTool } from "../../../brain/types.js";
import { buildVersion1Lockdown } from "../services/version-1-lockdown-service.js";

export const version1LockdownTools: RegisteredTool[] = [{
  name: "version_1_lockdown.baseline",
  description: "REAL-025 Version 1 baseline lock and inventories",
  module: "version-1-lockdown",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildVersion1Lockdown(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
