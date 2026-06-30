import type { RegisteredTool } from "../../../brain/types.js";
import {
  buildMarketStrategySummary,
  compareMarketStrategies,
  generateMarketStrategyForOpportunity,
  getMarketStrategy,
  listMarketStrategies,
} from "../services/market-domination-strategy-service.js";

export const marketDominationStrategyTools: RegisteredTool[] = [
  {
    name: "market_strategy.generate",
    description: "Generate complete market domination strategy for approved business — mandatory before build, no execution",
    module: "market-domination-strategy-engine",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        businessOpportunityId: { type: "string" },
        actor: { type: "string" },
      },
      required: ["businessOpportunityId"],
    },
    handler: async (args) =>
      generateMarketStrategyForOpportunity(
        String(args.businessOpportunityId),
        args.actor ? String(args.actor) : undefined,
      ),
  },
  {
    name: "market_strategy.list",
    description: "List market domination strategies for Grand King account",
    module: "market-domination-strategy-engine",
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
      listMarketStrategies(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
      ),
  },
  {
    name: "market_strategy.get",
    description: "Get market domination strategy document by ID",
    module: "market-domination-strategy-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { strategyId: { type: "string" } },
      required: ["strategyId"],
    },
    handler: async (args) => getMarketStrategy(String(args.strategyId)),
  },
  {
    name: "market_strategy.compare",
    description: "Compare two market domination strategies side-by-side",
    module: "market-domination-strategy-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        strategyA: { type: "string" },
        strategyB: { type: "string" },
      },
      required: ["strategyA", "strategyB"],
    },
    handler: async (args) =>
      compareMarketStrategies(String(args.strategyA), String(args.strategyB)),
  },
  {
    name: "market_strategy.summary",
    description: "Workspace summary of market domination strategies and build recommendations",
    module: "market-domination-strategy-engine",
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
      buildMarketStrategySummary(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
      ),
  },
];

export { buildMarketStrategyDashboard } from "../services/market-domination-strategy-service.js";
