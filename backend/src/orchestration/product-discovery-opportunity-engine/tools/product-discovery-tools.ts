import type { RegisteredTool } from "../../../brain/types.js";
import {
  approveProductOpportunities,
  buildDiscoveryDashboard,
  discoverOpportunitiesForInput,
  getDiscoverySession,
  listDiscoverySessions,
  runProductDiscovery,
  startProductDiscoverySession,
} from "../services/discovery-workflow-service.js";

export const productDiscoveryTools: RegisteredTool[] = [
  {
    name: "product_discovery.start",
    description: "Grand King chooses brand and category — start product discovery session",
    module: "product-discovery-opportunity-engine",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        brand: { type: "string" },
        category: { type: "string" },
        targetMarket: { type: "string" },
        budgetCents: { type: "number" },
        existingSupplierNetwork: { type: "array", items: { type: "string" } },
        actor: { type: "string" },
      },
      required: ["companyId", "brand", "category"],
    },
    handler: async (args) =>
      startProductDiscoverySession({
        workspaceId: args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        companyId: String(args.companyId),
        brand: String(args.brand),
        category: String(args.category),
        targetMarket: args.targetMarket ? String(args.targetMarket) : "US",
        budgetCents: typeof args.budgetCents === "number" ? args.budgetCents : undefined,
        existingSupplierNetwork: Array.isArray(args.existingSupplierNetwork)
          ? args.existingSupplierNetwork.map(String)
          : ["cj-dropshipping"],
        actor: args.actor ? String(args.actor) : undefined,
      }),
  },
  {
    name: "product_discovery.discover",
    description: "EA discovers and ranks product opportunities — discovery only, no publishing",
    module: "product-discovery-opportunity-engine",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        sessionId: { type: "string" },
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        brand: { type: "string" },
        category: { type: "string" },
        targetMarket: { type: "string" },
        existingSupplierNetwork: { type: "array", items: { type: "string" } },
      },
    },
    handler: async (args) => {
      if (args.sessionId) {
        return runProductDiscovery(String(args.sessionId));
      }
      return discoverOpportunitiesForInput({
        workspaceId: args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        companyId: String(args.companyId ?? "co-grand-king"),
        brand: String(args.brand ?? "Grand King Brand"),
        category: String(args.category ?? "kitchen"),
        targetMarket: args.targetMarket ? String(args.targetMarket) : "US",
        existingSupplierNetwork: Array.isArray(args.existingSupplierNetwork)
          ? args.existingSupplierNetwork.map(String)
          : ["cj-dropshipping"],
      });
    },
  },
  {
    name: "product_discovery.approve",
    description: "Grand King approves discovered opportunities — READY FOR PRODUCT BUILD",
    module: "product-discovery-opportunity-engine",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        sessionId: { type: "string" },
        opportunityIds: { type: "array", items: { type: "string" } },
        actor: { type: "string" },
      },
      required: ["sessionId", "opportunityIds"],
    },
    handler: async (args) =>
      approveProductOpportunities(
        String(args.sessionId),
        Array.isArray(args.opportunityIds) ? args.opportunityIds.map(String) : [],
        args.actor ? String(args.actor) : undefined,
      ),
  },
  {
    name: "product_discovery.get_session",
    description: "Get product discovery session with ranked opportunities",
    module: "product-discovery-opportunity-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { sessionId: { type: "string" } },
      required: ["sessionId"],
    },
    handler: async (args) => getDiscoverySession(String(args.sessionId)),
  },
  {
    name: "product_discovery.list_sessions",
    description: "List product discovery sessions for Grand King account",
    module: "product-discovery-opportunity-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
    },
    handler: async (args) =>
      listDiscoverySessions(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        args.companyId ? String(args.companyId) : undefined,
      ),
  },
  {
    name: "product_discovery.dashboard",
    description: "Discovery dashboard with top opportunities, domination score, ROI, margin, marketplace and supplier recommendations",
    module: "product-discovery-opportunity-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
      required: ["companyId"],
    },
    handler: async (args) =>
      buildDiscoveryDashboard(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
      ),
  },
];
