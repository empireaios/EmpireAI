export {
  IDENTITY_ENTITY_TYPES,
  IDENTITY_CHANGE_TYPES,
  identityEntitySchema,
  CANONICAL_ENTITY_IDS,
  validateIdentityEntity,
} from "./models/identity-entity.js";
export type {
  IdentityEntityType,
  IdentityChangeType,
  IdentityEntity,
  IdentityHistoryEntry,
  IdentityResolveResult,
  IdentityRegisterInput,
} from "./models/identity-entity.js";

export type { IdentityRegistryRepository } from "./repositories/identity-registry-repository.js";
export {
  SqliteIdentityRegistryRepository,
  getIdentityRegistryRepository,
  resetIdentityRegistryRepository,
  createIdentityHistoryEntry,
} from "./repositories/sqlite-identity-registry-repository.js";

export { createDefaultIdentityEntities } from "./services/identity-default-entities.js";
export { resolveIdentityEntity, getIdentityDisplayName } from "./services/identity-resolver.js";

export {
  IdentityEntityNotFoundError,
  IdentityEntityExistsError,
  initializeIdentityRegistry,
  registerIdentityEntity,
  getIdentityEntity,
  requireIdentityEntity,
  resolveIdentity,
  resolveIdentityDisplayName,
  listIdentityEntities,
  updateIdentityDisplayName,
  addIdentityAlias,
  removeIdentityAlias,
  listIdentityHistory,
} from "./services/identity-registry-service.js";

export { registerIdentityRegistryRoutes } from "./routes/identity-registry-routes.js";
export { identityRegistryTools } from "./tools/identity-registry-tools.js";

export {
  IDENTITY_REGISTRY_MODULE_ID,
  IDENTITY_REGISTRY_CAPABILITIES,
  createIdentityRegistryModuleContract,
} from "./contract/identity-registry-module.js";
export type {
  IdentityRegistryCapability,
  IdentityRegistryModuleContract,
} from "./contract/identity-registry-module.js";
