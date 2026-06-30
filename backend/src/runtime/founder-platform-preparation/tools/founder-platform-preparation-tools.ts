import type { RegisteredTool } from "../../../brain/types.js";
import { buildFounderPlatformPreparation } from "../services/founder-platform-preparation-service.js";

export const founderPlatformPreparationTools: RegisteredTool[] = [{
  name: "founder_platform_preparation.dashboard",
  description: "REAL-021 Founder platform architecture (separate from Grand King)",
  module: "founder-platform-preparation",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildFounderPlatformPreparation(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
