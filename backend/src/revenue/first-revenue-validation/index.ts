export {
  VALIDATION_STAGE_NAMES,
  VALIDATION_STAGE_STATUSES,
  validationStageResultSchema,
  firstRevenueValidationRecordSchema,
  validateFirstRevenueValidationRecord,
} from "./models/first-revenue-validation-record.js";
export type {
  ValidationStageName,
  ValidationStageStatus,
  ValidationStageResult,
  FirstRevenueValidationRecord,
} from "./models/first-revenue-validation-record.js";

export {
  loadFirstRevenueValidationEnv,
  isFirstRevenueValidationEnabled,
} from "./config/first-revenue-validation-env.js";
export type { FirstRevenueValidationEnv } from "./config/first-revenue-validation-env.js";

export type { FirstRevenueValidationRepository } from "./repositories/first-revenue-validation-repository.js";
export {
  SqliteFirstRevenueValidationRepository,
  getFirstRevenueValidationRepository,
  resetFirstRevenueValidationRepository,
  createValidationRecord,
} from "./repositories/sqlite-first-revenue-validation-repository.js";

export { executeFirstRevenueValidation } from "./services/first-revenue-validation-executor.js";
export type { ExecuteFirstRevenueValidationInput } from "./services/first-revenue-validation-executor.js";

export {
  assessProductionReadiness,
} from "./services/production-readiness-assessor.js";
export type { ProductionReadinessAssessment } from "./services/production-readiness-assessor.js";

export {
  FirstRevenueValidationBlockedError,
  runFirstRevenueValidation,
  getProductionReadinessAssessment,
  getFirstRevenueValidationById,
  listFirstRevenueValidations,
  getLatestFirstRevenueValidation,
} from "./services/first-revenue-validation-service.js";

export { registerFirstRevenueValidationRoutes } from "./routes/first-revenue-validation-routes.js";
export { firstRevenueValidationTools } from "./tools/first-revenue-validation-tools.js";

export {
  FIRST_REVENUE_VALIDATION_MODULE_ID,
  FIRST_REVENUE_VALIDATION_CAPABILITIES,
  createFirstRevenueValidationModuleContract,
} from "./contract/first-revenue-validation-module.js";
export type {
  FirstRevenueValidationCapability,
  FirstRevenueValidationModuleContract,
} from "./contract/first-revenue-validation-module.js";
