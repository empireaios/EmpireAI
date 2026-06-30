import type { RegisteredTool } from "../../../brain/types.js";
import { buildSuccess001ReadinessReview } from "../services/success-001-readiness-review-service.js";

export const success001ReadinessReviewTools: RegisteredTool[] = [{
  name: "success_001_readiness_review.dashboard",
  description: "REAL-069 SUCCESS-001 readiness review dashboard",
  module: "success-001-readiness-review",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildSuccess001ReadinessReview(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
