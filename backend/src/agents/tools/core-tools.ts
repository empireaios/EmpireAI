import type { RegisteredTool } from "../../brain/types.js";
import { formatCurrency } from "../../domain/format.js";
import { companies } from "../../domain/services/module-views.js";

export const coreTools: RegisteredTool[] = [
  {
    name: "portfolio.get_summary",
    description: "Retrieve portfolio summary metrics for a workspace",
    module: "dashboard",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
      required: ["workspaceId"],
    },
    handler: async (args) => {
      const totals = companies.portfolioTotals(String(args.workspaceId));
      return {
        revenue: formatCurrency(totals.revenueCents),
        margin: totals.avgMarginPct != null ? `${totals.avgMarginPct.toFixed(1)}%` : "—",
        companies: totals.companyCount,
        workspaceId: args.workspaceId,
      };
    },
  },
  {
    name: "intelligence.scan_market",
    description: "Run product intelligence scan for a category",
    module: "intelligence",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: {
        category: { type: "string" },
        limit: { type: "number" },
      },
      required: ["category"],
    },
    handler: async (args) => ({
      category: args.category,
      productsAnalyzed: args.limit ?? 100,
      topScore: 94,
      status: "completed",
    }),
  },
  {
    name: "suppliers.check_health",
    description: "Check supplier network health for a company",
    module: "suppliers",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: { companyId: { type: "string" } },
      required: ["companyId"],
    },
    handler: async (args) => ({
      companyId: args.companyId,
      healthy: 22,
      degraded: 1,
      fulfillmentRate: 0.984,
    }),
  },
  {
    name: "store.generate_assets",
    description: "Generate storefront assets for a company brand",
    module: "store",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        companyId: { type: "string" },
        brandDirection: { type: "string" },
      },
      required: ["companyId"],
    },
    handler: async (args) => ({
      companyId: args.companyId,
      brandDirection: args.brandDirection ?? "luxury-minimal",
      assetsCreated: 18,
    }),
  },
  {
    name: "marketing.generate_campaign",
    description: "Generate a marketing campaign brief",
    module: "marketing",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        companyId: { type: "string" },
        objective: { type: "string" },
      },
      required: ["companyId", "objective"],
    },
    handler: async (args) => ({
      companyId: args.companyId,
      objective: args.objective,
      channels: ["email", "content", "social"],
      status: "draft_ready",
    }),
  },
  {
    name: "ads.adjust_budget",
    description: "Adjust daily ad budget for a company",
    module: "ads",
    authorityLevel: "L3",
    parameters: {
      type: "object",
      properties: {
        companyId: { type: "string" },
        dailyBudget: { type: "number" },
      },
      required: ["companyId", "dailyBudget"],
    },
    handler: async (args) => ({
      companyId: args.companyId,
      dailyBudget: args.dailyBudget,
      status: "budget_updated",
    }),
  },
  {
    name: "finance.get_pl",
    description: "Retrieve profit and loss summary",
    module: "finance",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        period: { type: "string" },
      },
      required: ["workspaceId"],
    },
    handler: async (args) => ({
      workspaceId: args.workspaceId,
      period: args.period ?? "mtd",
      netProfit: "$1.03M",
      margin: "36.3%",
    }),
  },
  {
    name: "orders.list_open",
    description: "List open orders for fulfillment review",
    module: "orders",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: { companyId: { type: "string" } },
      required: ["companyId"],
    },
    handler: async (args) => ({
      companyId: args.companyId,
      openOrders: 8,
      processing: 3,
    }),
  },
  {
    name: "support.resolve_ticket",
    description: "Resolve a customer support ticket",
    module: "support",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        ticketId: { type: "string" },
        resolution: { type: "string" },
      },
      required: ["ticketId", "resolution"],
    },
    handler: async (args) => ({
      ticketId: args.ticketId,
      resolution: args.resolution,
      status: "resolved",
    }),
  },
  {
    name: "admin.get_system_health",
    description: "Retrieve platform system health metrics",
    module: "admin",
    authorityLevel: "L0",
    parameters: { type: "object", properties: {} },
    handler: async () => ({
      uptime: "99.97%",
      queueDepth: 124,
      agentFleet: 43416,
    }),
  },
];
