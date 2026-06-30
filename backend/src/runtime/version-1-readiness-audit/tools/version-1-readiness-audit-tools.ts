import type { RegisteredTool } from "../../../brain/types.js";
import { buildVersion1ReadinessAudit } from "../services/version-1-readiness-audit-service.js";

export const version1ReadinessAuditTools: RegisteredTool[] = [{
  name: "version_1_readiness_audit.dashboard",
  description: "REAL-024 Version 1 readiness audit",
  module: "version-1-readiness-audit",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildVersion1ReadinessAudit(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
