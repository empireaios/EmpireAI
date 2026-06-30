import type { RegisteredTool } from "../../../brain/types.js";
import { buildExecutiveWarRoom } from "../services/executive-war-room-service.js";

export const executiveWarRoomTools: RegisteredTool[] = [{
  name: "executive_war_room.dashboard",
  description: "REAL-055 Executive war room visual debate dashboard",
  module: "executive-war-room",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildExecutiveWarRoom(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
