export {
  REVENUE_IMPROVEMENT_TYPES,
  revenueImprovementProposalSchema,
  revenueImprovementEngineSchema,
} from "./models/revenue-improvement-engine.js";

export type {
  RevenueImprovementProposal,
  RevenueImprovementEngine,
} from "./models/revenue-improvement-engine.js";

export { buildRevenueImprovementEngine } from "./services/revenue-improvement-engine-service.js";
export { registerRevenueImprovementEngineRoutes } from "./routes/revenue-improvement-engine-routes.js";
export { revenueImprovementEngineTools } from "./tools/revenue-improvement-engine-tools.js";

export const REVENUE_IMPROVEMENT_ENGINE_MODULE_ID = "revenue-improvement-engine" as const;
export const REVENUE_IMPROVEMENT_ENGINE_MISSION_ID = "REAL-017" as const;
