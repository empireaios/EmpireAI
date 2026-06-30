import type { RegisteredTool } from "../../../brain/types.js";
import { buildAmazonCapabilityProfile } from "../services/amazon-capability-profile-service.js";
import { createAmazonListingPackage, evaluateListingById, listListingEvaluations } from "../services/amazon-readiness-service.js";
import { buildAmazonMissionControlDashboard } from "../services/amazon-mission-control-service.js";
import { AmazonListingPackageInputSchema } from "../models/amazon-listing-package.js";
import { createAmazonRuntimePlugin } from "../../plugins/marketplace/amazon/amazon-runtime-plugin.js";

export const amazonGlobalSellerTools: RegisteredTool[] = [
  {
    name: "amazon_global_seller.capability_profile",
    description: "Amazon Seller capability profile (RS-001)",
    module: "amazon-global-seller",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => buildAmazonCapabilityProfile(),
  },
  {
    name: "amazon_global_seller.runtime_plugin",
    description: "Amazon Runtime Plugin manifest and domain coverage (RS-002)",
    module: "amazon-global-seller",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => {
      const plugin = createAmazonRuntimePlugin();
      return { manifest: plugin.manifest, domainCoverage: plugin.getAmazonDomainCoverage() };
    },
  },
  {
    name: "amazon_global_seller.listing.create",
    description: "Create canonical Amazon listing package (RS-003)",
    module: "amazon-global-seller",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
      required: ["companyId"],
    },
    handler: async (args) => {
      const { workspaceId, companyId, ...rest } = args as Record<string, unknown>;
      const input = AmazonListingPackageInputSchema.parse(rest);
      return createAmazonListingPackage(
        workspaceId ? String(workspaceId) : "ws_empire_1",
        String(companyId),
        input,
      );
    },
  },
  {
    name: "amazon_global_seller.readiness.evaluate",
    description: "Evaluate Amazon listing readiness (RS-004)",
    module: "amazon-global-seller",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" }, listingId: { type: "string" } },
      required: ["companyId"],
    },
    handler: async (args) => {
      const workspaceId = args.workspaceId ? String(args.workspaceId) : "ws_empire_1";
      const companyId = String(args.companyId);
      if (args.listingId) {
        return evaluateListingById(workspaceId, companyId, String(args.listingId));
      }
      return listListingEvaluations(workspaceId, companyId);
    },
  },
  {
    name: "amazon_global_seller.dashboard",
    description: "Amazon Mission Control dashboard (RS-005)",
    module: "amazon-global-seller",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
      required: ["companyId"],
    },
    handler: async (args) =>
      buildAmazonMissionControlDashboard(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
      ),
  },
];
