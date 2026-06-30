import type { RegisteredTool } from "../../../brain/types.js";
import { buildVersion1AcceptanceTest } from "../services/version-1-acceptance-test-service.js";

export const version1AcceptanceTestTools: RegisteredTool[] = [{
  name: "version_1_acceptance_test.dashboard",
  description: "REAL-048 Version 1 acceptance test dashboard",
  module: "version-1-acceptance-test",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildVersion1AcceptanceTest(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
