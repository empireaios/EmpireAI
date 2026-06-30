import type { RegisteredTool } from "../../../brain/types.js";
import {
  buildArchitectureComplianceReport,
  buildArchitectureConstraintsDashboard,
  getArchitectureConstraintCatalog,
} from "../services/empire-architecture-constraints-service.js";

export const empireArchitectureConstraintsTools: RegisteredTool[] = [
  {
    name: "empire_architecture_constraints.catalog",
    description: "ACD-001→030 Immutable Architecture Constraint catalog (read-only)",
    module: "empire-architecture-constraints",
    authorityLevel: "L0",
    parameters: { type: "object", properties: {} },
    handler: async () => ({
      immutable: true,
      version: "1.0.0",
      constraintCount: getArchitectureConstraintCatalog().length,
      constraints: getArchitectureConstraintCatalog(),
    }),
  },
  {
    name: "empire_architecture_constraints.dependency_review",
    description: "ACD dependency review — adapter boundaries and explicit edges",
    module: "empire-architecture-constraints",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
    },
    handler: async (args) => {
      const report = buildArchitectureComplianceReport(
        String(args.workspaceId ?? "ws_empire_1"),
        String(args.companyId ?? "co-grand-king"),
      );
      return { dependencyReview: report.dependencyReview };
    },
  },
  {
    name: "empire_architecture_constraints.compliance",
    description: "ACD architecture compliance audit for Empire Review",
    module: "empire-architecture-constraints",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
    },
    handler: async (args) =>
      buildArchitectureComplianceReport(
        String(args.workspaceId ?? "ws_empire_1"),
        String(args.companyId ?? "co-grand-king"),
      ),
  },
  {
    name: "empire_architecture_constraints.dashboard",
    description: "ACD-001→030 Architecture constraints dashboard with dependency review",
    module: "empire-architecture-constraints",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
    },
    handler: async (args) =>
      buildArchitectureConstraintsDashboard(
        String(args.workspaceId ?? "ws_empire_1"),
        String(args.companyId ?? "co-grand-king"),
      ),
  },
];
