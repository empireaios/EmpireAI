export {
  CONNECTOR_HEALTH_STATES,
  connectorHealthSchema,
  validateConnectorHealth,
  createDefaultConnectorHealth,
} from "./models/connector-health.js";
export type {
  ConnectorHealthState,
  ConnectorHealth,
  ConnectorHealthInput,
} from "./models/connector-health.js";

export {
  CONNECTOR_CAPABILITY_KINDS,
  connectorCapabilitySchema,
  validateConnectorCapability,
} from "./models/connector-capability.js";
export type {
  ConnectorCapabilityKind,
  ConnectorCapability,
  ConnectorCapabilityInput,
} from "./models/connector-capability.js";

export {
  CONNECTOR_TYPES,
  CONNECTOR_STATUSES,
  eyeConnectorSchema,
  validateEyeConnector,
  KNOWN_CONNECTOR_TEMPLATES,
  resolveKnownConnectorTemplate,
} from "./models/eye-connector.js";
export type {
  ConnectorType,
  ConnectorStatus,
  EyeConnector,
  EyeConnectorCreateInput,
  EyeConnectorUpdateInput,
} from "./models/eye-connector.js";

export type {
  ConnectorRegistryQuery,
  ConnectorRegistry,
} from "./repositories/connector-registry.js";

export {
  InMemoryConnectorRegistry,
  createInMemoryConnectorRegistry,
} from "./repositories/in-memory-connector-registry.js";

export {
  normalizeConnectorId,
  validateConnectorRegistration,
  validateStatusTransition,
  validateHealthUpdate,
  normalizeConnectorCapability,
  connectorValidation,
} from "./utilities/connector-validation.js";

export {
  CONNECTOR_REGISTRY_MODULE_ID,
  CONNECTOR_REGISTRY_MODULE_VERSION,
  CONNECTOR_REGISTRY_CAPABILITIES,
  CONNECTOR_REGISTRY_MODULE_CONTRACT,
  ConnectorRegistryModule,
  createConnectorRegistryModule,
  connectorRegistryModule,
} from "./contract/connector-registry-module.js";
export type {
  ConnectorRegistryModuleId,
  ConnectorRegistryCapability,
  ConnectorRegistryModuleContract,
} from "./contract/connector-registry-module.js";
