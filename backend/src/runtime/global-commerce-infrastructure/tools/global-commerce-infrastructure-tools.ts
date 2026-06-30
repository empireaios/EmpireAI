import type { RegisteredTool } from "../../../brain/types.js";
import { buildCountryInfrastructureProfile, listCountryInfrastructureProfiles } from "../services/infrastructure-model-service.js";
import { getProviderDependencies, listProviderDependenciesForCountry } from "../services/infrastructure-dependency-service.js";
import { computeInfrastructureReadiness, listInfrastructureReadiness } from "../services/infrastructure-readiness-service.js";
import { buildExpansionDependencyGraph } from "../services/expansion-dependency-graph-service.js";
import { buildGlobalCommerceInfrastructureDashboard } from "../services/global-commerce-infrastructure-dashboard-service.js";

export const globalCommerceInfrastructureTools: RegisteredTool[] = [
  {
    name: "global_commerce_infrastructure.model",
    description: "Country commerce infrastructure model — 12 layers (D-001)",
    module: "global-commerce-infrastructure",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { countryCode: { type: "string" } } },
    handler: async (args) => {
      const code = args.countryCode ? String(args.countryCode) : undefined;
      return code ? buildCountryInfrastructureProfile(code) : listCountryInfrastructureProfiles();
    },
  },
  {
    name: "global_commerce_infrastructure.dependencies",
    description: "Provider infrastructure dependencies (D-002)",
    module: "global-commerce-infrastructure",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { countryCode: { type: "string" }, providerId: { type: "string" } }, required: ["countryCode"] },
    handler: async (args) => {
      const countryCode = String(args.countryCode);
      if (args.providerId) return getProviderDependencies(String(args.providerId), countryCode);
      return listProviderDependenciesForCountry(countryCode);
    },
  },
  {
    name: "global_commerce_infrastructure.readiness",
    description: "Infrastructure readiness score and blockers (D-003)",
    module: "global-commerce-infrastructure",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" }, countryCode: { type: "string" } }, required: ["companyId"] },
    handler: async (args) => {
      const workspaceId = args.workspaceId ? String(args.workspaceId) : "ws_empire_1";
      const companyId = String(args.companyId);
      const countryCode = args.countryCode ? String(args.countryCode) : undefined;
      return countryCode
        ? computeInfrastructureReadiness(workspaceId, companyId, countryCode)
        : listInfrastructureReadiness(workspaceId, companyId);
    },
  },
  {
    name: "global_commerce_infrastructure.graph",
    description: "Expansion dependency graph for country/marketplace (D-004)",
    module: "global-commerce-infrastructure",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" }, countryCode: { type: "string" }, providerId: { type: "string" } }, required: ["companyId", "countryCode"] },
    handler: async (args) =>
      buildExpansionDependencyGraph(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
        String(args.countryCode),
        args.providerId ? String(args.providerId) : undefined,
      ),
  },
  {
    name: "global_commerce_infrastructure.dashboard",
    description: "Global commerce infrastructure Mission Control dashboard (D-005)",
    module: "global-commerce-infrastructure",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } }, required: ["companyId"] },
    handler: async (args) =>
      buildGlobalCommerceInfrastructureDashboard(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
      ),
  },
];
