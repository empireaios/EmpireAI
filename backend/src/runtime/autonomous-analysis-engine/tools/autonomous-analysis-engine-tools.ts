import type { RegisteredTool } from "../../../brain/types.js";
import { buildAutonomousAnalysisEngine } from "../services/autonomous-analysis-engine-service.js";

export const autonomousAnalysisEngineTools: RegisteredTool[] = [{
  name: "autonomous_analysis_engine.dashboard",
  description: "REAL-059 Autonomous analysis engine dashboard",
  module: "autonomous-analysis-engine",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildAutonomousAnalysisEngine(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
