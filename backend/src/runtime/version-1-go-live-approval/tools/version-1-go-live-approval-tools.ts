import type { RegisteredTool } from "../../../brain/types.js";
import { buildVersion1GoLiveApproval } from "../services/version-1-go-live-approval-service.js";

export const version1GoLiveApprovalTools: RegisteredTool[] = [{
  name: "version_1_go_live_approval.dashboard",
  description: "REAL-099 version-1-go-live-approval dashboard",
  module: "version-1-go-live-approval",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildVersion1GoLiveApproval(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
