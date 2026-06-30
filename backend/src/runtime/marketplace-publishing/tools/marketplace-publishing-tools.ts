import type { RegisteredTool } from "../../../brain/types.js";
import { MARKETPLACE_PUBLISH_IDS } from "../models/marketplace-adapter.js";
import {
  buildMarketplaceListingPackage,
  listMarketplaceAdapters,
} from "../services/marketplace-publishing-service.js";

export const marketplacePublishingTools: RegisteredTool[] = [
  {
    name: "marketplace_publishing.adapters",
    description: "REAL-003 marketplace adapter registry",
    module: "marketplace-publishing",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => listMarketplaceAdapters(),
  },
  {
    name: "marketplace_publishing.build",
    description: "REAL-003 build marketplace listing package (governance enforced)",
    module: "marketplace-publishing",
    authorityLevel: "L3",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        productId: { type: "string" },
        marketplaceId: { type: "string", enum: MARKETPLACE_PUBLISH_IDS },
        title: { type: "string" },
        description: { type: "string" },
        price: { type: "number" },
      },
      required: ["productId", "marketplaceId", "title", "description", "price"],
    },
    handler: async (args) =>
      buildMarketplaceListingPackage({
        workspaceId: args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        companyId: args.companyId ? String(args.companyId) : "co-grand-king",
        productId: String(args.productId),
        marketplaceId: args.marketplaceId as (typeof MARKETPLACE_PUBLISH_IDS)[number],
        title: String(args.title),
        description: String(args.description),
        bulletPoints: [],
        specifications: {},
        price: Number(args.price),
        images: [],
        executiveCouncilApproved: false,
        kingApproved: false,
      }),
  },
];
