import type { RegisteredTool } from "../../../brain/types.js";
import {
  buildUxIdentityComplianceReport,
  buildUxIdentityDoctrineDashboard,
  getUxIdentityDoctrineCatalog,
} from "../services/empire-ux-identity-doctrine-service.js";

export const empireUxIdentityDoctrineTools: RegisteredTool[] = [
  {
    name: "empire_ux_identity_doctrine.catalog",
    description: "UID-001→020 Immutable UX & Identity Doctrine catalog (read-only)",
    module: "empire-ux-identity-doctrine",
    authorityLevel: "L0",
    parameters: { type: "object", properties: {} },
    handler: async () => ({
      immutable: true,
      version: "1.0.0",
      doctrineCount: getUxIdentityDoctrineCatalog().length,
      doctrines: getUxIdentityDoctrineCatalog(),
    }),
  },
  {
    name: "empire_ux_identity_doctrine.navigation_review",
    description: "UID navigation review — routes, roles, and doctrine mapping",
    module: "empire-ux-identity-doctrine",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
    },
    handler: async (args) => {
      const report = buildUxIdentityComplianceReport(
        String(args.workspaceId ?? "ws_empire_1"),
        String(args.companyId ?? "co-grand-king"),
      );
      return { navigationReview: report.navigationReview };
    },
  },
  {
    name: "empire_ux_identity_doctrine.compliance",
    description: "UID UX & identity compliance audit for Empire Review",
    module: "empire-ux-identity-doctrine",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
    },
    handler: async (args) =>
      buildUxIdentityComplianceReport(
        String(args.workspaceId ?? "ws_empire_1"),
        String(args.companyId ?? "co-grand-king"),
      ),
  },
  {
    name: "empire_ux_identity_doctrine.dashboard",
    description: "UID-001→020 UX & identity dashboard with navigation review",
    module: "empire-ux-identity-doctrine",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
    },
    handler: async (args) =>
      buildUxIdentityDoctrineDashboard(
        String(args.workspaceId ?? "ws_empire_1"),
        String(args.companyId ?? "co-grand-king"),
      ),
  },
];
