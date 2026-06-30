import type { RegisteredTool } from "../../../brain/types.js";
import { buildMissionCommandEngine } from "../services/mission-command-engine-service.js";

export const missionCommandEngineTools: RegisteredTool[] = [{
  name: "mission_command_engine.dashboard",
  description: "REAL-057 Mission command engine dashboard",
  module: "mission-command-engine",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildMissionCommandEngine(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
