import type { RegisteredTool } from "../../../brain/types.js";
import { buildGrandKingLiveOperationsMode } from "../services/grand-king-live-operations-mode-service.js";

export const grandKingLiveOperationsModeTools: RegisteredTool[] = [{
  name: "grand_king_live_operations_mode.dashboard",
  description: "REAL-036 Grand King live operations mode dashboard",
  module: "grand-king-live-operations-mode",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildGrandKingLiveOperationsMode(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
