import type { RegisteredTool } from "../../../brain/types.js";
import { buildUxReviewPreparation } from "../services/ux-review-preparation-service.js";

export const uxReviewPreparationTools: RegisteredTool[] = [{
  name: "ux_review_preparation.dashboard",
  description: "REAL-092 ux-review-preparation dashboard",
  module: "ux-review-preparation",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildUxReviewPreparation(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
