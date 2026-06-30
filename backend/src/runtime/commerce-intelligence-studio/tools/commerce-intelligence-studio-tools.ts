import type { RegisteredTool } from "../../../brain/types.js";
import { SupplierProductInputSchema } from "../models/commercial-review.js";
import { WinningListingInputSchema } from "../models/winning-listing.js";
import { runCommercialReview, listCommercialReviews } from "../services/commercial-review-service.js";
import { generateWinningListing, listWinningListings } from "../services/winning-listing-service.js";
import { recommendCommercialStrategy } from "../services/commercial-strategy-service.js";
import { classifyProductExperiment, runFullCommercialIntelligence } from "../services/experiment-service.js";
import { buildCisMissionControlDashboard } from "../services/cis-mission-control-service.js";

export const commerceIntelligenceStudioTools: RegisteredTool[] = [
  {
    name: "commerce_intelligence_studio.review",
    description: "Commercial review from 9 perspectives (CIS-001)",
    module: "commerce-intelligence-studio",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } }, required: ["companyId"] },
    handler: async (args) => {
      const { workspaceId, companyId, ...rest } = args as Record<string, unknown>;
      const product = SupplierProductInputSchema.parse(rest);
      return runCommercialReview(
        workspaceId ? String(workspaceId) : "ws_empire_1",
        String(companyId),
        product,
      );
    },
  },
  {
    name: "commerce_intelligence_studio.listing",
    description: "Generate platform-neutral winning listing (CIS-002)",
    module: "commerce-intelligence-studio",
    authorityLevel: "L2",
    parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" }, brandName: { type: "string" } }, required: ["companyId", "brandName"] },
    handler: async (args) => {
      const { workspaceId, companyId, brandName, tone, targetAudience, ...rest } = args as Record<string, unknown>;
      const product = SupplierProductInputSchema.parse(rest);
      const input = WinningListingInputSchema.parse({ supplierProductId: product.supplierProductId, brandName, tone, targetAudience });
      return generateWinningListing(
        workspaceId ? String(workspaceId) : "ws_empire_1",
        String(companyId),
        product,
        input,
      );
    },
  },
  {
    name: "commerce_intelligence_studio.strategy",
    description: "Recommend commercial strategy (CIS-003)",
    module: "commerce-intelligence-studio",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } }, required: ["companyId"] },
    handler: async (args) => {
      const { workspaceId, companyId, ...rest } = args as Record<string, unknown>;
      const product = SupplierProductInputSchema.parse(rest);
      return recommendCommercialStrategy(
        workspaceId ? String(workspaceId) : "ws_empire_1",
        String(companyId),
        product,
      );
    },
  },
  {
    name: "commerce_intelligence_studio.experiment",
    description: "Classify product experiment (CIS-004)",
    module: "commerce-intelligence-studio",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } }, required: ["companyId"] },
    handler: async (args) => {
      const { workspaceId, companyId, ...rest } = args as Record<string, unknown>;
      const product = SupplierProductInputSchema.parse(rest);
      return classifyProductExperiment(
        workspaceId ? String(workspaceId) : "ws_empire_1",
        String(companyId),
        product,
      );
    },
  },
  {
    name: "commerce_intelligence_studio.dashboard",
    description: "Commerce Intelligence Studio Mission Control (CIS-005)",
    module: "commerce-intelligence-studio",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } }, required: ["companyId"] },
    handler: async (args) =>
      buildCisMissionControlDashboard(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
      ),
  },
];
