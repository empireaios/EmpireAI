import type { RegisteredTool } from "../../../brain/types.js";
import { buildPerformanceReview } from "../services/performance-review-service.js";

export const performanceReviewTools: RegisteredTool[] = [{
  name: "performance_review.dashboard",
  description: "REAL-093 performance-review dashboard",
  module: "performance-review",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildPerformanceReview(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
