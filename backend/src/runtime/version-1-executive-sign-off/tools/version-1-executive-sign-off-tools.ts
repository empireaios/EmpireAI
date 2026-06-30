import type { RegisteredTool } from "../../../brain/types.js";
import { buildVersion1ExecutiveSignOff } from "../services/version-1-executive-sign-off-service.js";

export const version1ExecutiveSignOffTools: RegisteredTool[] = [{
  name: "version_1_executive_sign_off.dashboard",
  description: "REAL-070 Version 1 executive sign-off dashboard",
  module: "version-1-executive-sign-off",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildVersion1ExecutiveSignOff(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
