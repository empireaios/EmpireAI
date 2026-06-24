export {
  investigationTargetSchema,
  validateInvestigationTarget,
} from "./models/investigation-target.js";
export type {
  InvestigationTarget,
  InvestigationTargetInput,
} from "./models/investigation-target.js";

export {
  PRIORITY_SIGNAL_TYPES,
  prioritySignalSchema,
  validatePrioritySignal,
} from "./models/priority-signal.js";
export type { PrioritySignalType, PrioritySignal } from "./models/priority-signal.js";

export {
  PRIORITY_LEVELS,
  investigationPrioritySchema,
  validateInvestigationPriority,
  resolvePriorityLevel,
} from "./models/investigation-priority.js";
export type {
  InvestigationPriorityId,
  PriorityLevel,
  InvestigationPriority,
  InvestigationPriorityCreateInput,
} from "./models/investigation-priority.js";

export {
  PRIORITY_SCORING_WEIGHTS,
  scoreInvestigationPriority,
  priorityScoring,
} from "./scoring/priority-scoring.js";
export type {
  InvestigationOpportunityInput,
  InvestigationForecastInput,
  InvestigationTrustInput,
  InvestigationPriorityAnalysisInput,
  InvestigationPriorityScoreBreakdown,
} from "./scoring/priority-scoring.js";

export type {
  InvestigationRepositoryQuery,
  InvestigationRepository,
} from "./repositories/investigation-repository.js";

export {
  InMemoryInvestigationRepository,
  createInMemoryInvestigationRepository,
} from "./repositories/in-memory-investigation-repository.js";

export {
  InvestigationPriorityEngine,
  defaultInvestigationPriorityEngine,
} from "./engines/investigation-priority-engine.js";

export {
  INVESTIGATION_PRIORITY_INTELLIGENCE_MODULE_ID,
  INVESTIGATION_PRIORITY_INTELLIGENCE_MODULE_VERSION,
  INVESTIGATION_PRIORITY_INTELLIGENCE_CAPABILITIES,
  INVESTIGATION_PRIORITY_INTELLIGENCE_MODULE_CONTRACT,
  InvestigationPriorityModule,
  createInvestigationPriorityModule,
  investigationPriorityModule,
} from "./contract/investigation-priority-module.js";
export type {
  InvestigationPriorityIntelligenceModuleId,
  InvestigationPriorityIntelligenceCapability,
  InvestigationPriorityIntelligenceModuleContract,
} from "./contract/investigation-priority-module.js";
