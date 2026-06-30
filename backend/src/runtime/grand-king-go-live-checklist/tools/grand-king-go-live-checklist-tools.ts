import type { RegisteredTool } from "../../../brain/types.js";
import { buildGrandKingGoLiveChecklist } from "../services/grand-king-go-live-checklist-service.js";

export const grandKingGoLiveChecklistTools: RegisteredTool[] = [{
  name: "grand_king_go_live_checklist.dashboard",
  description: "REAL-049 Grand King go-live checklist dashboard",
  module: "grand-king-go-live-checklist",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildGrandKingGoLiveChecklist(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
