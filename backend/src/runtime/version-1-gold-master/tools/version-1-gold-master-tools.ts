import type { RegisteredTool } from "../../../brain/types.js";
import { buildVersion1GoldMaster } from "../services/version-1-gold-master-service.js";

export const version1GoldMasterTools: RegisteredTool[] = [{
  name: "version_1_gold_master.dashboard",
  description: "REAL-050 Version 1 gold master dashboard",
  module: "version-1-gold-master",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildVersion1GoldMaster(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
