import type { RegisteredTool } from "../../brain/types.js";
import {
  compareSuppliers,
  discoverSuppliers,
  evaluateSupplier,
  supplierIntelligenceEvaluationEngine,
} from "../../intelligence/supplier-intelligence-engine/index.js";

export const supplierIntelligenceTools: RegisteredTool[] = [
  {
    name: "supplier-intelligence.discover",
    description: "Discover suppliers from mock catalog with optional filters",
    module: "supplier-intelligence",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        region: { type: "string" },
        maxShipDays: { type: "number" },
        minReliability: { type: "number" },
        minProductCount: { type: "number" },
        excludeFakeRiskAbove: { type: "number" },
      },
      required: ["workspaceId"],
    },
    handler: async (args) => {
      const workspaceId = String(args.workspaceId);
      const filters = {
        region: args.region as string | undefined,
        maxShipDays: args.maxShipDays as number | undefined,
        minReliability: args.minReliability as number | undefined,
        minProductCount: args.minProductCount as number | undefined,
        excludeFakeRiskAbove: args.excludeFakeRiskAbove as number | undefined,
      };
      return discoverSuppliers(workspaceId, filters);
    },
  },
  {
    name: "supplier-intelligence.evaluate",
    description: "Evaluate a supplier with trust score, fake detection, and Guardian verdict",
    module: "supplier-intelligence",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        supplierId: { type: "string" },
        sellingPriceCents: { type: "number" },
        productCategory: { type: "string" },
        persist: { type: "boolean" },
      },
      required: ["workspaceId", "supplierId"],
    },
    handler: async (args) => {
      const workspaceId = String(args.workspaceId);
      const evaluation = evaluateSupplier({
        supplierId: String(args.supplierId),
        workspaceId,
        sellingPriceCents: args.sellingPriceCents as number | undefined,
        productCategory: args.productCategory as string | undefined,
      });

      if (args.persist !== false) {
        supplierIntelligenceEvaluationEngine.persist(evaluation, workspaceId);
      }

      return evaluation;
    },
  },
  {
    name: "supplier-intelligence.compare",
    description: "Compare multiple suppliers and rank by trust score with best pick",
    module: "supplier-intelligence",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        supplierIds: { type: "array", items: { type: "string" } },
        sellingPriceCents: { type: "number" },
        productCategory: { type: "string" },
      },
      required: ["workspaceId", "supplierIds"],
    },
    handler: async (args) => {
      const workspaceId = String(args.workspaceId);
      const supplierIds = (args.supplierIds as string[]) ?? [];
      return compareSuppliers(workspaceId, supplierIds, {
        sellingPriceCents: args.sellingPriceCents as number | undefined,
        productCategory: args.productCategory as string | undefined,
      });
    },
  },
];
