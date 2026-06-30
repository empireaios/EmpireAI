import type { RegisteredTool } from "../../../brain/types.js";
import { buildEmpirePlaybookEngine } from "../services/empire-playbook-engine-service.js";

export const empirePlaybookEngineTools: RegisteredTool[] = [{
  name: "empire_playbook_engine.dashboard",
  description: "REAL-044 Empire playbook engine dashboard (executive reference only)",
  module: "empire-playbook-engine",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildEmpirePlaybookEngine(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
