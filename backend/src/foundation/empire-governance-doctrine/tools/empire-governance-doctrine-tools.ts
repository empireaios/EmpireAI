import type { RegisteredTool } from "../../../brain/types.js";
import {
  buildGovernanceComplianceReport,
  buildGovernanceDoctrineDashboard,
  getGovernanceDoctrineCatalog,
} from "../services/empire-governance-doctrine-service.js";
import { listAuthorityMatrix } from "../catalog/gvd-catalog.js";

export const empireGovernanceDoctrineTools: RegisteredTool[] = [
  {
    name: "empire_governance_doctrine.catalog",
    description: "GVD-001→030 Immutable Governance Doctrine catalog (read-only)",
    module: "empire-governance-doctrine",
    authorityLevel: "L0",
    parameters: { type: "object", properties: {} },
    handler: async () => ({
      immutable: true,
      version: "1.0.0",
      doctrineCount: getGovernanceDoctrineCatalog().length,
      doctrines: getGovernanceDoctrineCatalog(),
    }),
  },
  {
    name: "empire_governance_doctrine.authority_matrix",
    description: "GVD authority matrix — module roles and escalation",
    module: "empire-governance-doctrine",
    authorityLevel: "L0",
    parameters: { type: "object", properties: {} },
    handler: async () => ({ authorityMatrix: listAuthorityMatrix() }),
  },
  {
    name: "empire_governance_doctrine.compliance",
    description: "GVD governance compliance audit for Empire Review",
    module: "empire-governance-doctrine",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
    },
    handler: async (args) =>
      buildGovernanceComplianceReport(
        String(args.workspaceId ?? "ws_empire_1"),
        String(args.companyId ?? "co-grand-king"),
      ),
  },
  {
    name: "empire_governance_doctrine.dashboard",
    description: "GVD-001→030 Governance dashboard with catalog, matrix, compliance",
    module: "empire-governance-doctrine",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
    },
    handler: async (args) =>
      buildGovernanceDoctrineDashboard(
        String(args.workspaceId ?? "ws_empire_1"),
        String(args.companyId ?? "co-grand-king"),
      ),
  },
];
