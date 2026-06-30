import type { RegisteredTool } from "../../../brain/types.js";
import { listCountryIntelligenceProfiles, getCountryIntelligenceProfile } from "../services/country-intelligence-service.js";
import { buildCommerceEcosystemProfile, listCommerceEcosystemProfiles } from "../services/commerce-ecosystem-service.js";
import { computeExpansionIntelligenceScore, listExpansionIntelligenceScores } from "../services/expansion-intelligence-score-service.js";
import { rankGlobalOpportunities } from "../services/opportunity-ranking-service.js";
import { buildGlobalCommerceIntelligenceDashboard } from "../services/global-commerce-intelligence-dashboard-service.js";
import { OpportunityRankingInputSchema } from "../models/opportunity-ranking.js";

export const globalCommerceIntelligenceTools: RegisteredTool[] = [
  {
    name: "global_commerce_intelligence.countries",
    description: "Country intelligence profiles — market maturity, growth, regulatory dimensions (B-011)",
    module: "global-commerce-intelligence",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { countryCode: { type: "string" } } },
    handler: async (args) => {
      const code = args.countryCode ? String(args.countryCode) : undefined;
      return code ? getCountryIntelligenceProfile(code) : listCountryIntelligenceProfiles();
    },
  },
  {
    name: "global_commerce_intelligence.ecosystem",
    description: "Commerce ecosystem profile — marketplaces, payments, logistics as whole (B-012)",
    module: "global-commerce-intelligence",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { countryCode: { type: "string" } } },
    handler: async (args) => {
      const code = args.countryCode ? String(args.countryCode) : undefined;
      return code ? buildCommerceEcosystemProfile(code) : listCommerceEcosystemProfiles();
    },
  },
  {
    name: "global_commerce_intelligence.expansion_score",
    description: "Weighted expansion intelligence score per country (B-013)",
    module: "global-commerce-intelligence",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" }, countryCode: { type: "string" } },
      required: ["companyId"],
    },
    handler: async (args) => {
      const workspaceId = args.workspaceId ? String(args.workspaceId) : "ws_empire_1";
      const companyId = String(args.companyId);
      const countryCode = args.countryCode ? String(args.countryCode) : undefined;
      return countryCode
        ? computeExpansionIntelligenceScore(workspaceId, companyId, countryCode)
        : listExpansionIntelligenceScores(workspaceId, companyId);
    },
  },
  {
    name: "global_commerce_intelligence.opportunity.rank",
    description: "Rank countries and marketplaces for a product category (B-014)",
    module: "global-commerce-intelligence",
    authorityLevel: "L2",
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
    handler: async (args) => {
      const input = OpportunityRankingInputSchema.parse({
        productCategory: String(args.productCategory),
        supplierAvailable: args.supplierAvailable !== false,
        maxCountries: args.maxCountries ? Number(args.maxCountries) : undefined,
      });
      return rankGlobalOpportunities(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
        input,
      );
    },
  },
  {
    name: "global_commerce_intelligence.dashboard",
    description: "Global commerce intelligence Mission Control dashboard (B-015)",
    module: "global-commerce-intelligence",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
      required: ["companyId"],
    },
    handler: async (args) =>
      buildGlobalCommerceIntelligenceDashboard(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
      ),
  },
];
