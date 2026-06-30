import type { RegisteredTool } from "../../../brain/types.js";
import { buildConstitutionComplianceReport, buildConstitutionDashboard, getCoreConstitutionCatalog } from "../services/empire-constitution-service.js";

export const empireConstitutionTools: RegisteredTool[] = [
  {
    name: "empire_constitution.catalog",
    description: "CTD-001→040 Immutable Core Constitution catalog (read-only)",
    module: "empire-constitution",
    authorityLevel: "L0",
    parameters: { type: "object", properties: {} },
    handler: async () => ({
      immutable: true,
      version: "1.0.0",
      articleCount: getCoreConstitutionCatalog().length,
      articles: getCoreConstitutionCatalog(),
    }),
  },
  {
    name: "empire_constitution.compliance",
    description: "CTD constitution compliance audit for Empire Review",
    module: "empire-constitution",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
    },
    handler: async (args) =>
      buildConstitutionComplianceReport(
        String(args.workspaceId ?? "ws_empire_1"),
        String(args.companyId ?? "co-grand-king"),
      ),
  },
  {
    name: "empire_constitution.dashboard",
    description: "CTD-001→040 Constitution dashboard with catalog + compliance",
    module: "empire-constitution",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
    },
    handler: async (args) =>
      buildConstitutionDashboard(
        String(args.workspaceId ?? "ws_empire_1"),
        String(args.companyId ?? "co-grand-king"),
      ),
  },
];
