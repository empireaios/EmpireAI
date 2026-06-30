export {
  PORTFOLIO_SIGNAL_TYPES,
  portfolioSignalSchema,
  validatePortfolioSignal,
} from "./models/portfolio-signal.js";
export type { PortfolioSignalType, PortfolioSignal } from "./models/portfolio-signal.js";

export {
  PORTFOLIO_STATES,
  opportunityPortfolioSchema,
  validateOpportunityPortfolio,
  computePortfolioStats,
} from "./models/opportunity-portfolio.js";
export type {
  PortfolioState,
  OpportunityPortfolioId,
  OpportunityPortfolio,
  OpportunityPortfolioCreateInput,
} from "./models/opportunity-portfolio.js";

export {
  PRIORITY_LEVELS,
  RISK_LEVELS,
  portfolioEntrySchema,
  validatePortfolioEntry,
} from "./models/portfolio-entry.js";
export type {
  PortfolioEntryId,
  PriorityLevel,
  RiskLevel,
  PortfolioEntry,
  PortfolioEntryCreateInput,
} from "./models/portfolio-entry.js";

export type {
  PortfolioRepositoryQuery,
  PortfolioRepository,
} from "./repositories/portfolio-repository.js";

export {
  InMemoryPortfolioRepository,
  createInMemoryPortfolioRepository,
} from "./repositories/in-memory-portfolio-repository.js";

export {
  PORTFOLIO_SIGNAL_WEIGHTS,
  scorePortfolioEntry,
  rankPortfolioInputs,
  portfolioScoring,
} from "./scoring/portfolio-scoring.js";
export type {
  PortfolioRevenueOpportunityInput,
  PortfolioScoringInput,
  PortfolioScoreBreakdown,
} from "./scoring/portfolio-scoring.js";

export {
  OpportunityPortfolioEngine,
  defaultOpportunityPortfolioEngine,
} from "./engines/opportunity-portfolio-engine.js";
export type { PortfolioScoringInput as PortfolioEngineScoringInput } from "./engines/opportunity-portfolio-engine.js";

export {
  OPPORTUNITY_PORTFOLIO_MODULE_ID,
  OPPORTUNITY_PORTFOLIO_MODULE_VERSION,
  OPPORTUNITY_PORTFOLIO_CAPABILITIES,
  OPPORTUNITY_PORTFOLIO_MODULE_CONTRACT,
  OpportunityPortfolioModule,
  createOpportunityPortfolioModule,
  opportunityPortfolioModule,
} from "./contract/opportunity-portfolio-module.js";
export type {
  OpportunityPortfolioModuleId,
  OpportunityPortfolioCapability,
  OpportunityPortfolioModuleContract,
} from "./contract/opportunity-portfolio-module.js";
