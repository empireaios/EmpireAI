/**
 * Canonical Empire Knowledge & Learning System (EKLS)
 * @see CANONICAL_EKLS_SPECIFICATION.md
 */

export { EKLS_SCHEMA_VERSION, type EklsKnowledgeObject } from "./contracts/knowledge-object-standard.js";
export { EKLS_SUBSYSTEM_REGISTRY, EKLS_SUBSYSTEM_IDS, EKLS_FEATURE_CATALOG_EXAMPLES } from "./contracts/subsystem-registry.js";
export { EKLS_LIFECYCLE_REGISTRY } from "./contracts/lifecycles.js";
export { EKLS_STORE_REGISTRY, resolveStoreBackend } from "./storage/store-registry.js";
export { EKLS_OWNERSHIP_POLICY } from "./policies/ownership-policy.js";
export {
  enforceEklsAccess,
  validateEklsGovernanceContext,
  EKLS_CANONICAL_SPEC_REF,
  type EklsGovernanceContext,
} from "./services/ekls-governance-gateway.js";
export {
  loadEklsUnifiedService,
  EKLS_CONSUMER_CHANNELS,
  EKLS_SCHEDULE_MANIFEST,
  type EklsUnifiedServiceView,
} from "./services/ekls-unified-service.js";
