import type { RegisteredTool } from "../../../brain/types.js";
import { buildVersion1Completion } from "../services/version-1-completion-service.js";

export const version1CompletionTools: RegisteredTool[] = [{
  name: "version_1_completion.dashboard",
  description: "REAL-100 version-1-completion dashboard",
  module: "version-1-completion",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildVersion1Completion(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
