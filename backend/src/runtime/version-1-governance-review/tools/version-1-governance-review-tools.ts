import type { RegisteredTool } from "../../../brain/types.js";
import { buildVersion1GovernanceReview } from "../services/version-1-governance-review-service.js";

export const version1GovernanceReviewTools: RegisteredTool[] = [{
  name: "version_1_governance_review.dashboard",
  description: "REAL-068 Version 1 governance review dashboard",
  module: "version-1-governance-review",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildVersion1GovernanceReview(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
