export {
  DECISION_CATEGORIES,
  DECISION_STATUSES,
  DECISION_LIFECYCLE_EVENTS,
  empireDecisionSchema,
  decisionAlternativeSchema,
  decisionTradeoffSchema,
  CANONICAL_DECISION_IDS,
  validateEmpireDecision,
  isTerminalDecisionStatus,
} from "./models/empire-decision.js";
export type {
  DecisionCategory,
  DecisionStatus,
  DecisionLifecycleEvent,
  DecisionAlternative,
  DecisionTradeoff,
  EmpireDecision,
  DecisionLifecycleRecord,
  DecisionRecordInput,
  DecisionModifyInput,
} from "./models/empire-decision.js";

export type { DecisionRepository } from "./repositories/decision-repository.js";
export {
  SqliteDecisionRepository,
  getDecisionRepository,
  resetDecisionRepository,
  createDecisionLifecycleRecord,
} from "./repositories/sqlite-decision-repository.js";

export { createDefaultDecisions } from "./services/decision-default-decisions.js";

export {
  DecisionNotFoundError,
  DecisionConflictError,
  initializeDecisionRegistry,
  recordDecision,
  proposeDecision,
  approveDecision,
  modifyDecision,
  supersedeDecision,
  deprecateDecision,
  getDecision,
  listDecisions,
  listDecisionLifecycle,
  listWorkspaceDecisionLifecycle,
} from "./services/decision-registry-service.js";

export { registerDecisionRegistryRoutes } from "./routes/decision-registry-routes.js";
export { decisionRegistryTools } from "./tools/decision-registry-tools.js";

export {
  DECISION_REGISTRY_MODULE_ID,
  DECISION_REGISTRY_CAPABILITIES,
  createDecisionRegistryModuleContract,
} from "./contract/decision-registry-module.js";
export type {
  DecisionRegistryCapability,
  DecisionRegistryModuleContract,
} from "./contract/decision-registry-module.js";
