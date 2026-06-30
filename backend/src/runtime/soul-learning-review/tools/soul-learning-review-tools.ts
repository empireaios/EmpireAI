import type { RegisteredTool } from "../../../brain/types.js";
import { buildSoulLearningReview } from "../services/soul-learning-review-service.js";

export const soulLearningReviewTools: RegisteredTool[] = [{
  name: "soul_learning_review.dashboard",
  description: "REAL-087 soul-learning-review dashboard",
  module: "soul-learning-review",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildSoulLearningReview(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
