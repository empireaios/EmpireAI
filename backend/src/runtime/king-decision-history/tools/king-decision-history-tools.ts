import type { RegisteredTool } from "../../../brain/types.js";
import { buildKingDecisionHistory } from "../services/king-decision-history-service.js";

export const kingDecisionHistoryTools: RegisteredTool[] = [{
  name: "king_decision_history.dashboard",
  description: "REAL-086 king-decision-history dashboard",
  module: "king-decision-history",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildKingDecisionHistory(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
