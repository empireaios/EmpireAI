import type { RegisteredTool } from "../../../brain/types.js";
import { buildSecurityReview } from "../services/security-review-service.js";

export const securityReviewTools: RegisteredTool[] = [{
  name: "security_review.dashboard",
  description: "REAL-094 security-review dashboard",
  module: "security-review",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildSecurityReview(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
