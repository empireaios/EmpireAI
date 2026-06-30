import type { RegisteredTool } from "../../../brain/types.js";
import { buildLiveCommercialInvestigations } from "../services/live-commercial-investigations-service.js";

export const liveCommercialInvestigationsTools: RegisteredTool[] = [{
  name: "live_commercial_investigations.dashboard",
  description: "REAL-063 Live commercial investigations dashboard",
  module: "live-commercial-investigations",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildLiveCommercialInvestigations(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
