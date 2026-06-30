import type { RegisteredTool } from "../../../brain/types.js";
import { SupplierProductInputSchema } from "../../commerce-intelligence-studio/models/commercial-review.js";
import { buildProductMediaIntelligence } from "../services/product-media-service.js";

export const productMediaTools: RegisteredTool[] = [
  {
    name: "product_media.build",
    description: "REAL-005 product media recommendations (no image AI)",
    module: "product-media",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        product: { type: "object" },
      },
      required: ["product"],
    },
    handler: async (args) => {
      const product = SupplierProductInputSchema.parse(args.product);
      return buildProductMediaIntelligence(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        args.companyId ? String(args.companyId) : "co-grand-king",
        product,
      );
    },
  },
];
