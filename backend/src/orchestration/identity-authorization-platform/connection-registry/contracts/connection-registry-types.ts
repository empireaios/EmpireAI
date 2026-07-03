/**
 * G8-01 — Connection Registry contract types.
 */

export {
  CONNECTION_REGISTRY_VERSION,
  CONNECTION_REGISTRY_PROVIDER_IDS,
  PROVIDER_CATEGORIES,
  CONNECTION_STATUSES,
  READINESS_STATES,
  CONNECTION_REGISTRY_EKLS_KINDS,
  type ConnectionRegistryProviderId,
  type ProviderCategory,
  type ConnectionStatus,
  type ReadinessState,
  type ConnectionRegistryEklsKind,
  type ConnectionDefinition,
  type WorkspaceConnectionProfile,
  type ConnectionRegistryPluginManifest,
  redactConnectionRegistrySecrets,
} from "../../../../registry/types/connection-registry-types.js";

export const CONNECTION_REGISTRY_FOUNDATION_VERSION = "g8-01-v1" as const;
