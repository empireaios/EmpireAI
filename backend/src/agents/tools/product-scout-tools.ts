import type { RegisteredTool } from "../../brain/types.js";
import {
  listScoutCatalog,
  productScoutEngine,
} from "../../intelligence/product-scout/index.js";

export const productScoutTools: RegisteredTool[] = [
  {
    name: "product-scout.evaluate",
    description: "Evaluate a product opportunity with Empire scoring and Guardian verdict",
    module: "product-scout",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        productId: { type: "string" },
        productName: { type: "string" },
        sampleIndex: { type: "number" },
      },
      required: ["workspaceId"],
    },
    handler: async (args) => {
      const workspaceId = String(args.workspaceId);

      if (args.productId) {
        const evaluation = productScoutEngine.evaluateMock(workspaceId, String(args.productId));
        productScoutEngine.persist(evaluation);
        return evaluation;
      }

      if (typeof args.sampleIndex === "number") {
        const evaluation = productScoutEngine.evaluateMock(workspaceId, args.sampleIndex);
        productScoutEngine.persist(evaluation);
        return evaluation;
      }

      if (args.productName) {
        const evaluation = productScoutEngine.evaluate({
          workspaceId,
          productName: String(args.productName),
        });
        productScoutEngine.persist(evaluation);
        return evaluation;
      }

      const evaluation = productScoutEngine.evaluateMock(workspaceId, 0);
      productScoutEngine.persist(evaluation);
      return evaluation;
    },
  },
  {
    name: "product-scout.scan_portfolio",
    description: "Scan mock product catalog and rank opportunities by Empire score",
    module: "product-scout",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        limit: { type: "number" },
      },
      required: ["workspaceId"],
    },
    handler: async (args) => {
      const workspaceId = String(args.workspaceId);
      const limit = typeof args.limit === "number" ? args.limit : undefined;
      const scan = productScoutEngine.scanPortfolio(workspaceId, limit);
      for (const evaluation of scan.evaluations) {
        productScoutEngine.persist(evaluation);
      }
      return scan;
    },
  },
  {
    name: "product-scout.recommend",
    description: "Return top Guardian-approved product recommendation from mock catalog",
    module: "product-scout",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
      },
      required: ["workspaceId"],
    },
    handler: async (args) => {
      const workspaceId = String(args.workspaceId);
      const recommendation = productScoutEngine.recommend(workspaceId);
      if (recommendation) {
        productScoutEngine.persist(recommendation);
      }
      return {
        workspaceId,
        catalogSize: listScoutCatalog().length,
        recommendation,
        status: recommendation ? "completed" : "no_viable_pick",
      };
    },
  },
];
