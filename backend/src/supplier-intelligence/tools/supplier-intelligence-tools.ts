import type { RegisteredTool } from "../../brain/types.js";
import { buildSupplierDashboard } from "../services/supplier-dashboard-service.js";
import { buildSupplierAdapterRegistry } from "../services/supplier-adapter-registry-service.js";
import { findSupplierOpportunities, listSupplierProducts } from "../services/supplier-opportunity-service.js";
import { scoreSupplierProduct } from "../services/supplier-scoring-service.js";
import { compareSuppliersForProduct } from "../services/supplier-comparison-service.js";
import { supplierProductSchema } from "../models/supplier-product.js";
import { buildCjAdapterSkeleton } from "../adapters/cj-dropshipping-adapter.js";
import { getEmpireAccessRecord } from "../../operational-access/services/empire-access-registry-service.js";

export const supplierIntelligenceFoundationTools: RegisteredTool[] = [
  {
    name: "supplier_intelligence.dashboard",
    description: "Supplier Intelligence Dashboard SUP-011",
    module: "supplier-intelligence",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
    },
    handler: async (args) =>
      buildSupplierDashboard(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        args.companyId ? String(args.companyId) : "co-grand-king",
      ),
  },
  {
    name: "supplier_intelligence.adapters",
    description: "Supplier adapter registry SUP-001",
    module: "supplier-intelligence",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) =>
      buildSupplierAdapterRegistry(args.workspaceId ? String(args.workspaceId) : "ws_empire_1"),
  },
  {
    name: "supplier_intelligence.score",
    description: "Score supplier product SUP-004",
    module: "supplier-intelligence",
    authorityLevel: "L2",
    parameters: { type: "object", properties: { product: { type: "object" } }, required: ["product"] },
    handler: async (args) => {
      const product = supplierProductSchema.parse({ ...args.product as object, ingestedAt: new Date().toISOString() });
      return scoreSupplierProduct(product);
    },
  },
  {
    name: "supplier_intelligence.compare",
    description: "Compare suppliers for product idea SUP-006",
    module: "supplier-intelligence",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        productIdea: { type: "string" },
        targetCountry: { type: "string" },
        workspaceId: { type: "string" },
      },
    },
    handler: async (args) => {
      const ws = args.workspaceId ? String(args.workspaceId) : "ws_empire_1";
      const products = listSupplierProducts(ws);
      return compareSuppliersForProduct(
        String(args.productIdea ?? "Product"),
        String(args.targetCountry ?? "US"),
        products,
      );
    },
  },
  {
    name: "supplier_intelligence.opportunities",
    description: "Supplier launch opportunities SUP-008",
    module: "supplier-intelligence",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) =>
      findSupplierOpportunities(args.workspaceId ? String(args.workspaceId) : "ws_empire_1"),
  },
  {
    name: "supplier_intelligence.cj_adapter",
    description: "CJ adapter skeleton SUP-003",
    module: "supplier-intelligence",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) => {
      const ws = args.workspaceId ? String(args.workspaceId) : "ws_empire_1";
      const record = getEmpireAccessRecord(ws, "cj-dropshipping");
      return buildCjAdapterSkeleton(Boolean(record.credentialsRef));
    },
  },
];
