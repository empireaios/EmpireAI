import type { RegisteredTool } from "../../../brain/types.js";
import { buildArchitectureReview } from "../services/architecture-review-service.js";

export const architectureReviewTools: RegisteredTool[] = [{
  name: "architecture_review.dashboard",
  description: "REAL-095 architecture-review dashboard",
  module: "architecture-review",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildArchitectureReview(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
