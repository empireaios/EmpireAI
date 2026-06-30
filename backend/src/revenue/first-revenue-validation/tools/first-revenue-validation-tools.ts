import type { RegisteredTool } from "../../../brain/types.js";
import {
  getFirstRevenueValidationById,
  getLatestFirstRevenueValidation,
  getProductionReadinessAssessment,
  listFirstRevenueValidations,
  runFirstRevenueValidation,
} from "../services/first-revenue-validation-service.js";

export const firstRevenueValidationTools: RegisteredTool[] = [
  {
    name: "first_revenue_validation.run",
    description: "Execute full Product → Profit validation cycle for Grand King's Account",
    module: "first-revenue-validation",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        correlationId: { type: "string" },
        brandId: { type: "string" },
      },
      required: ["workspaceId", "companyId"],
    },
    handler: async (args) =>
      runFirstRevenueValidation({
        workspaceId: String(args.workspaceId),
        companyId: String(args.companyId),
        correlationId: args.correlationId ? String(args.correlationId) : undefined,
        brandId: args.brandId ? String(args.brandId) : undefined,
      }),
  },
  {
    name: "first_revenue_validation.assess_production_readiness",
    description: "Assess whether Grand King's Account is production-ready for live revenue",
    module: "first-revenue-validation",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => getProductionReadinessAssessment(),
  },
  {
    name: "first_revenue_validation.get_validation",
    description: "Get validation run by ID or latest for workspace",
    module: "first-revenue-validation",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        validationId: { type: "string" },
      },
      required: ["workspaceId"],
    },
    handler: async (args) => {
      if (args.validationId) {
        return getFirstRevenueValidationById(String(args.validationId));
      }
      return getLatestFirstRevenueValidation(
        String(args.workspaceId),
        args.companyId ? String(args.companyId) : undefined,
      );
    },
  },
  {
    name: "first_revenue_validation.list_validations",
    description: "List first revenue validation runs",
    module: "first-revenue-validation",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
      required: ["workspaceId"],
    },
    handler: async (args) =>
      listFirstRevenueValidations(
        String(args.workspaceId),
        args.companyId ? String(args.companyId) : undefined,
      ),
  },
];
