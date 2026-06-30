import type { RegisteredTool } from "../../../brain/types.js";
import { SupplierProductInputSchema } from "../../commerce-intelligence-studio/models/commercial-review.js";
import { buildListingIntelligence } from "../services/listing-intelligence-service.js";

export const listingIntelligenceTools: RegisteredTool[] = [
  {
    name: "listing_intelligence.build",
    description: "REAL-004 build listing intelligence package (reuses CIS)",
    module: "listing-intelligence",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        product: { type: "object" },
        brandName: { type: "string" },
      },
      required: ["product"],
    },
    handler: async (args) => {
      const product = SupplierProductInputSchema.parse(args.product);
      return buildListingIntelligence(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        args.companyId ? String(args.companyId) : "co-grand-king",
        product,
        args.brandName ? String(args.brandName) : undefined,
      );
    },
  },
];
