import type { RegisteredTool } from "../../../brain/types.js";
import { buildCommercialReview } from "../services/commercial-review-service.js";

export const commercialReviewTools: RegisteredTool[] = [{
  name: "commercial_review.dashboard",
  description: "REAL-096 commercial-review dashboard",
  module: "commercial-review",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildCommercialReview(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
