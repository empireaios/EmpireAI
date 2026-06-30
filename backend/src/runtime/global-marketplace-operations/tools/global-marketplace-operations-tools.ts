import type { RegisteredTool } from "../../../brain/types.js";
import { SupplierProductInputSchema } from "../../commerce-intelligence-studio/models/commercial-review.js";
import { buildGlobalMarketplaceDistributionDashboard } from "../services/global-marketplace-distribution-dashboard-service.js";
import { buildGlobalMarketplaceOperations, getCountryOperationsView } from "../services/country-marketplace-operations-service.js";
import { buildGlobalDistributionPlan } from "../services/global-product-distribution-engine-service.js";
import { buildGlobalDistributionExecutiveDebate } from "../services/global-distribution-executive-debate-service.js";

export const globalMarketplaceOperationsTools: RegisteredTool[] = [
  {
    name: "global_marketplace_operations.dashboard",
    description: "REAL-009 global marketplace distribution dashboard",
    module: "global-marketplace-operations",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
    },
    handler: async (args) =>
      buildGlobalMarketplaceDistributionDashboard(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        args.companyId ? String(args.companyId) : "co-grand-king",
      ),
  },
  {
    name: "global_marketplace_operations.country",
    description: "REAL-010 country marketplace performance tabs",
    module: "global-marketplace-operations",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        countryCode: { type: "string" },
      },
      required: ["countryCode"],
    },
    handler: async (args) =>
      getCountryOperationsView(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        args.companyId ? String(args.companyId) : "co-grand-king",
        String(args.countryCode).toUpperCase(),
      ),
  },
  {
    name: "global_marketplace_operations.distribution_plan",
    description: "REAL-011 global product distribution plan",
    module: "global-marketplace-operations",
    authorityLevel: "L3",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        productId: { type: "string" },
        product: { type: "object" },
      },
      required: ["productId", "product"],
    },
    handler: async (args) => {
      const product = SupplierProductInputSchema.parse(args.product);
      return buildGlobalDistributionPlan(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        args.companyId ? String(args.companyId) : "co-grand-king",
        product,
        String(args.productId),
      );
    },
  },
  {
    name: "global_marketplace_operations.distribution_debate",
    description: "REAL-012 global distribution executive debate",
    module: "global-marketplace-operations",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        productId: { type: "string" },
        product: { type: "object" },
      },
      required: ["productId", "product"],
    },
    handler: async (args) => {
      const product = SupplierProductInputSchema.parse(args.product);
      const plan = buildGlobalDistributionPlan(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        args.companyId ? String(args.companyId) : "co-grand-king",
        product,
        String(args.productId),
      );
      return buildGlobalDistributionExecutiveDebate(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        args.companyId ? String(args.companyId) : "co-grand-king",
        plan,
      );
    },
  },
];
