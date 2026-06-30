import type { RegisteredTool } from "../../../brain/types.js";
import { buildVersion2BacklogEngine } from "../services/version-2-backlog-engine-service.js";

export const version2BacklogEngineTools: RegisteredTool[] = [{
  name: "version_2_backlog_engine.dashboard",
  description: "REAL-023 Version 2 backlog queue",
  module: "version-2-backlog-engine",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildVersion2BacklogEngine(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
