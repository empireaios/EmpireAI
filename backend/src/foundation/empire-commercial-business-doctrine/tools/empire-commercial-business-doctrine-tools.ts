import type { RegisteredTool } from "../../../brain/types.js";
import {
  buildCommercialComplianceReport,
  buildCommercialBusinessDoctrineDashboard,
  getCommercialBusinessDoctrineCatalog,
} from "../services/empire-commercial-business-doctrine-service.js";

export const empireCommercialBusinessDoctrineTools: RegisteredTool[] = [
  {
    name: "empire_commercial_business_doctrine.catalog",
    description: "CBD-001→020 Immutable Commercial Business Doctrine catalog (read-only)",
    module: "empire-commercial-business-doctrine",
    authorityLevel: "L0",
    parameters: { type: "object", properties: {} },
    handler: async () => ({
      immutable: true,
      version: "1.0.0",
      doctrineCount: getCommercialBusinessDoctrineCatalog().length,
      doctrines: getCommercialBusinessDoctrineCatalog(),
    }),
  },
  {
    name: "empire_commercial_business_doctrine.integrity_review",
    description: "CBD commercial integrity review — business rules and ownership boundaries",
    module: "empire-commercial-business-doctrine",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
    },
    handler: async (args) => {
      const report = buildCommercialComplianceReport(
        String(args.workspaceId ?? "ws_empire_1"),
        String(args.companyId ?? "co-grand-king"),
      );
      return { commercialIntegrityReview: report.commercialIntegrityReview, businessRuleCoverage: report.businessRuleCoverage };
    },
  },
  {
    name: "empire_commercial_business_doctrine.compliance",
    description: "CBD commercial compliance audit for Empire Review",
    module: "empire-commercial-business-doctrine",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
    },
    handler: async (args) =>
      buildCommercialComplianceReport(
        String(args.workspaceId ?? "ws_empire_1"),
        String(args.companyId ?? "co-grand-king"),
      ),
  },
  {
    name: "empire_commercial_business_doctrine.dashboard",
    description: "CBD-001→020 Commercial doctrine dashboard with integrity review",
    module: "empire-commercial-business-doctrine",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
    },
    handler: async (args) =>
      buildCommercialBusinessDoctrineDashboard(
        String(args.workspaceId ?? "ws_empire_1"),
        String(args.companyId ?? "co-grand-king"),
      ),
  },
];
