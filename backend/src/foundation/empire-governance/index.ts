export {
  GOVERNANCE_DOMAINS,
  GOVERNANCE_EFFECTS,
  governancePolicyRuleSchema,
  governanceDecisionRequestSchema,
  governanceVerdictSchema,
  validateGovernancePolicyRule,
  validateGovernanceDecisionRequest,
} from "./models/governance-policy.js";
export type {
  GovernanceDomain,
  GovernanceEffect,
  GovernancePolicyRule,
  GovernanceDecisionRequest,
  GovernanceVerdict,
  GovernanceDecisionRecord,
} from "./models/governance-policy.js";

export {
  GOVERNANCE_ENV_FLAGS,
  readGovernanceEnvFlag,
  isGovernanceEnvEnabled,
} from "./config/governance-env-bridge.js";
export type { GovernanceEnvFlagKey } from "./config/governance-env-bridge.js";

export type { GovernanceRepository } from "./repositories/governance-repository.js";
export {
  SqliteGovernanceRepository,
  getGovernanceRepository,
  resetGovernanceRepository,
  createGovernanceDecisionRecord,
} from "./repositories/sqlite-governance-repository.js";

export {
  createDefaultGovernancePolicies,
  resolveGovernanceDomain,
} from "./services/governance-default-policies.js";
export { evaluateGovernancePolicies } from "./services/governance-evaluator.js";

export {
  GovernanceEngine,
  GovernanceBlockedError,
  getGovernanceEngine,
  resetGovernanceEngine,
  initializeGovernancePolicies,
  evaluateGovernanceDecision,
  assessGovernanceDispatch,
} from "./services/governance-engine.js";

export { registerGovernanceRoutes } from "./routes/governance-routes.js";
export { governanceTools } from "./tools/governance-tools.js";

export {
  EMPIRE_GOVERNANCE_MODULE_ID,
  EMPIRE_GOVERNANCE_CAPABILITIES,
  createEmpireGovernanceModuleContract,
} from "./contract/empire-governance-module.js";
export type {
  GovernanceCapability,
  EmpireGovernanceModuleContract,
} from "./contract/empire-governance-module.js";
