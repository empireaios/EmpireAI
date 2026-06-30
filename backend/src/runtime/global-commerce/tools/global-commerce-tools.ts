import type { RegisteredTool } from "../../../brain/types.js";
import { buildGlobalCommerceRegistry } from "../services/global-commerce-registry-service.js";
import { buildOrLoadGlobalCommerceIdentity } from "../services/global-commerce-identity-service.js";
import { computeOnboardingReadiness } from "../services/onboarding-readiness-service.js";
import { createGlobalExpansionPlan } from "../services/global-expansion-planner-service.js";
import { buildGlobalCommerceDashboard } from "../services/global-commerce-dashboard-service.js";
import { ExpansionPlanInputSchema } from "../models/expansion-plan.js";

export const globalCommerceTools: RegisteredTool[] = [
  {
    name: "global_commerce.registry",
    description: "Global commerce registry — regions, countries, marketplace coverage (B-006)",
    module: "global-commerce",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => buildGlobalCommerceRegistry(),
  },
  {
    name: "global_commerce.dashboard",
    description: "Global commerce Mission Control dashboard (B-010)",
    module: "global-commerce",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
      required: ["companyId"],
    },
    handler: async (args) =>
      buildGlobalCommerceDashboard(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
      ),
  },
  {
    name: "global_commerce.identity",
    description: "Global commerce identity for Grand King / Founder (B-007)",
    module: "global-commerce",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
      required: ["companyId"],
    },
    handler: async (args) =>
      buildOrLoadGlobalCommerceIdentity({
        workspaceId: args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        companyId: String(args.companyId),
      }),
  },
  {
    name: "global_commerce.onboarding",
    description: "Marketplace onboarding readiness for country/provider (B-008)",
    module: "global-commerce",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        countryCode: { type: "string" },
        providerId: { type: "string" },
      },
      required: ["companyId", "countryCode", "providerId"],
    },
    handler: async (args) =>
      computeOnboardingReadiness(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
        String(args.countryCode),
        String(args.providerId),
      ),
  },
  {
    name: "global_commerce.expansion.plan",
    description: "Global expansion planner — priority countries and marketplaces (B-009)",
    module: "global-commerce",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        productCategory: { type: "string" },
        supplierAvailable: { type: "boolean" },
        maxCountries: { type: "number" },
      },
      required: ["companyId", "productCategory"],
    },
    handler: async (args) =>
      createGlobalExpansionPlan(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
        ExpansionPlanInputSchema.parse({
          productCategory: args.productCategory,
          supplierAvailable: args.supplierAvailable,
          maxCountries: args.maxCountries,
        }),
      ),
  },
];
