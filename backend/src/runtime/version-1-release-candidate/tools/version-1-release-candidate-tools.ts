import type { RegisteredTool } from "../../../brain/types.js";
import { buildVersion1ReleaseCandidate } from "../services/version-1-release-candidate-service.js";

export const version1ReleaseCandidateTools: RegisteredTool[] = [{
  name: "version_1_release_candidate.dashboard",
  description: "REAL-098 version-1-release-candidate dashboard",
  module: "version-1-release-candidate",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildVersion1ReleaseCandidate(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
