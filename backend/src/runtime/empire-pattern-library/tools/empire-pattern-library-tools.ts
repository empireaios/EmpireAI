import type { RegisteredTool } from "../../../brain/types.js";
import { buildEmpirePatternLibrary } from "../services/empire-pattern-library-service.js";

export const empirePatternLibraryTools: RegisteredTool[] = [{
  name: "empire_pattern_library.dashboard",
  description: "REAL-088 empire-pattern-library dashboard",
  module: "empire-pattern-library",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildEmpirePatternLibrary(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
