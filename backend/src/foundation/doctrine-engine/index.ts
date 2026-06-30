export {
  DOCTRINE_STATUSES,
  DOCTRINE_LIFECYCLE_EVENTS,
  doctrineSchema,
  doctrineExecutablePolicySchema,
  CANONICAL_DOCTRINE_IDS,
  validateDoctrine,
} from "./models/doctrine.js";
export type {
  DoctrineStatus,
  DoctrineLifecycleEvent,
  DoctrineExecutablePolicy,
  Doctrine,
  DoctrineLifecycleRecord,
  DoctrinePublishInput,
  DoctrineModifyInput,
} from "./models/doctrine.js";

export type { DoctrineRepository } from "./repositories/doctrine-repository.js";
export {
  SqliteDoctrineRepository,
  getDoctrineRepository,
  resetDoctrineRepository,
  createDoctrineLifecycleRecord,
} from "./repositories/sqlite-doctrine-repository.js";

export { createDefaultDoctrines } from "./services/doctrine-default-doctrines.js";
export {
  compileDoctrineToGovernancePolicy,
  compileExecutableDoctrinePolicies,
} from "./services/doctrine-policy-compiler.js";

export {
  DoctrineNotFoundError,
  DoctrineConflictError,
  initializeDoctrines,
  publishDoctrine,
  modifyDoctrine,
  deprecateDoctrine,
  supersedeDoctrine,
  recordDoctrineReference,
  getDoctrine,
  listDoctrines,
  listDoctrineLifecycle,
  listWorkspaceDoctrineLifecycle,
  getExecutableDoctrinePolicies,
  recordDoctrineReferencesFromVerdict,
} from "./services/doctrine-engine-service.js";

export { registerDoctrineRoutes } from "./routes/doctrine-routes.js";
export { doctrineTools } from "./tools/doctrine-tools.js";

export {
  DOCTRINE_ENGINE_MODULE_ID,
  DOCTRINE_ENGINE_CAPABILITIES,
  createDoctrineModuleContract,
} from "./contract/doctrine-module.js";
export type {
  DoctrineEngineCapability,
  DoctrineModuleContract,
} from "./contract/doctrine-module.js";
