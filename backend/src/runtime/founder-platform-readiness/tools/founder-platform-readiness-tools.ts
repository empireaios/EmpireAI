import type { RegisteredTool } from "../../../brain/types.js";
import { buildFounderPlatformReadiness } from "../services/founder-platform-readiness-service.js";

export const founderPlatformReadinessTools: RegisteredTool[] = [{
  name: "founder_platform_readiness.dashboard",
  description: "REAL-046 Founder platform readiness dashboard (extends REAL-021)",
  module: "founder-platform-readiness",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildFounderPlatformReadiness(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
