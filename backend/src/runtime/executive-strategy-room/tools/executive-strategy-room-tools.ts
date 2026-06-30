import type { RegisteredTool } from "../../../brain/types.js";
import { buildExecutiveStrategyRoom } from "../services/executive-strategy-room-service.js";

export const executiveStrategyRoomTools: RegisteredTool[] = [{
  name: "executive_strategy_room.dashboard",
  description: "REAL-085 executive-strategy-room dashboard",
  module: "executive-strategy-room",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildExecutiveStrategyRoom(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
