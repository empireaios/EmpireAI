export {
  PROMISE_STATUSES,
  PROMISE_LIFECYCLE_EVENTS,
  promiseSchema,
  CANONICAL_PROMISE_IDS,
  validateKingPromise,
  isTerminalPromiseStatus,
} from "./models/king-promise.js";
export type {
  PromiseStatus,
  PromiseLifecycleEvent,
  KingPromise,
  PromiseLifecycleRecord,
  PromiseRegisterInput,
  PromiseProgressInput,
  PromiseModifyInput,
} from "./models/king-promise.js";

export type { PromiseRepository } from "./repositories/promise-repository.js";
export {
  SqlitePromiseRepository,
  getPromiseRepository,
  resetPromiseRepository,
  createPromiseLifecycleRecord,
} from "./repositories/sqlite-promise-repository.js";

export { createDefaultPromises } from "./services/promise-default-promises.js";

export {
  PromiseNotFoundError,
  PromiseConflictError,
  initializePromiseRegister,
  registerPromise,
  modifyPromise,
  updatePromiseProgress,
  addPromiseDependency,
  removePromiseDependency,
  fulfillPromise,
  markPromiseObsolete,
  supersedePromise,
  getPromise,
  listPromises,
  listPromiseLifecycle,
  listWorkspacePromiseLifecycle,
  getPromiseDependencyGraph,
} from "./services/promise-register-service.js";

export { registerPromiseRegisterRoutes } from "./routes/promise-register-routes.js";
export { promiseRegisterTools } from "./tools/promise-register-tools.js";

export {
  PROMISE_REGISTER_MODULE_ID,
  PROMISE_REGISTER_CAPABILITIES,
  createPromiseRegisterModuleContract,
} from "./contract/promise-register-module.js";
export type {
  PromiseRegisterCapability,
  PromiseRegisterModuleContract,
} from "./contract/promise-register-module.js";
