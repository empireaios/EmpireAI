export {
  PRODUCTION_DEPLOYMENT_STATUSES,
  DEPLOYMENT_EXECUTION_MODES,
  deploymentApprovalSchema,
  productionDeploymentRecordSchema,
  validateProductionDeploymentRecord,
  isDeploymentApproved,
} from "./models/production-deployment-record.js";
export type {
  ProductionDeploymentStatus,
  DeploymentExecutionMode,
  DeploymentApproval,
  ProductionDeploymentRecord,
} from "./models/production-deployment-record.js";

export {
  DEPLOYMENT_LOG_LEVELS,
  deploymentLogEntrySchema,
  validateDeploymentLogEntry,
} from "./models/deployment-log-entry.js";
export type { DeploymentLogLevel, DeploymentLogEntry } from "./models/deployment-log-entry.js";

export {
  loadProductionDeploymentEnv,
  isVercelLiveConfigured,
} from "./config/production-deployment-env.js";
export type { ProductionDeploymentEnv } from "./config/production-deployment-env.js";

export type { ProductionDeploymentRepository } from "./repositories/production-deployment-repository.js";
export {
  SqliteProductionDeploymentRepository,
  getProductionDeploymentRepository,
  createDeploymentLog,
} from "./repositories/sqlite-production-deployment-repository.js";

export {
  collectDeploymentFiles,
  prepareVercelProject,
  createVercelDeployment,
  addVercelCustomDomain,
  rollbackVercelDeployment,
} from "./services/vercel-api-client.js";
export type {
  VercelDeploymentFile,
  VercelDeploymentResult,
  VercelDomainResult,
} from "./services/vercel-api-client.js";

export {
  prepareProductionDeployment,
  applyDeploymentApproval,
  executeProductionDeployment,
  rollbackProductionDeployment,
  getDeploymentLogs,
  ProductionDeploymentBlockedError,
} from "./services/production-deploy-service.js";
export type { PrepareProductionDeploymentInput } from "./services/production-deploy-service.js";

export { registerProductionDeploymentRoutes } from "./routes/production-deployment-routes.js";
export { productionDeploymentTools } from "./tools/production-deployment-tools.js";

export {
  PRODUCTION_STORE_DEPLOYMENT_MODULE_ID,
  PRODUCTION_STORE_DEPLOYMENT_VERSION,
  PRODUCTION_STORE_DEPLOYMENT_CAPABILITIES,
  ProductionStoreDeploymentModule,
  createProductionStoreDeploymentModule,
  productionStoreDeploymentModule,
} from "./contract/production-store-deployment-module.js";
export type {
  ProductionStoreDeploymentModuleId,
  ProductionStoreDeploymentCapability,
  PrepareProductionDeploymentInput as PrepareInput,
} from "./contract/production-store-deployment-module.js";
