export {
  AuthorityMatrix,
  createAuthorityMatrix,
  resetAuthorityMatrixForTesting,
  type AuthorityMatrixOptions,
} from "./engine.js";
export {
  buildAuthorityMatrixConfiguration,
  DEFAULT_AUTHORITY_MATRIX_CONFIGURATION,
  DEFAULT_SEED_RULES,
  type AuthorityMatrixConfiguration,
} from "./configuration.js";
export {
  AUTHORITY_MATRIX_ID,
  AUTHORITY_MATRIX_SYSTEM_PATH,
  AMX_METADATA_VERSION,
  MATRIX_VERSION,
  AUTHORITY_LEVELS,
  DECISION_CATEGORIES,
  RISK_CLASSIFICATIONS,
  AUTHORITY_RULES,
  MATRIX_DECISIONS,
  AMX_CAPABILITIES,
} from "./paths.js";
export type {
  AuthorityMatrixState,
  AuthorityRuleDefinition,
  AuthorityBinding,
  AuthorityMatrixCatalog,
  AuthorityMatrixInput,
  AuthorityMatrixRunReport,
  AuthorityMatrixCockpitSnapshot,
  AuthorityMatrixEngineRecord,
  AuthorityMatrixValidationReport,
  AuthorityLevel,
  DecisionCategory,
  RiskClassification,
  MatrixDecision,
  AuthorityRuleId,
} from "./types.js";
