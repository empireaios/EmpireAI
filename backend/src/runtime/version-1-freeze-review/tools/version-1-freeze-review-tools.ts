import type { RegisteredTool } from "../../../brain/types.js";
import { buildVersion1FreezeReview } from "../services/version-1-freeze-review-service.js";

export const version1FreezeReviewTools: RegisteredTool[] = [{
  name: "version_1_freeze_review.dashboard",
  description: "REAL-097 version-1-freeze-review dashboard",
  module: "version-1-freeze-review",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildVersion1FreezeReview(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
