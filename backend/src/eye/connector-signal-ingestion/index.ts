export {
  connectorIngestionEventSchema,
  validateConnectorIngestionEvent,
} from "./models/connector-ingestion-event.js";
export type {
  ConnectorIngestionEventInput,
  ConnectorIngestionEvent,
} from "./models/connector-ingestion-event.js";

export {
  INGESTION_RESULT_STATUSES,
  INGESTION_REJECTION_REASONS,
  connectorIngestionResultSchema,
  validateConnectorIngestionResult,
} from "./models/connector-ingestion-result.js";
export type {
  IngestionResultStatus,
  IngestionRejectionReason,
  ConnectorIngestionResult,
  ConnectorIngestionResultCreateInput,
} from "./models/connector-ingestion-result.js";

export {
  resolveSignalSourceForConnector,
  mapConnectorSignalToProductSignal,
  connectorSignalMapper,
} from "./mappers/connector-signal-mapper.js";

export {
  normalizeIngestionEventInput,
  validateConnectorForIngestion,
  validateConnectorSignalIngestion,
  connectorSignalValidator,
} from "./validators/connector-signal-validator.js";
export type {
  ConnectorIngestionOptions,
  ConnectorValidationOutcome,
} from "./validators/connector-signal-validator.js";

export type {
  ConnectorSignalIngestionQuery,
  ConnectorSignalIngestionRepository,
} from "./repositories/connector-signal-ingestion-repository.js";

export {
  InMemoryConnectorSignalIngestionRepository,
  createInMemoryConnectorSignalIngestionRepository,
} from "./repositories/in-memory-connector-signal-ingestion-repository.js";

export {
  ConnectorSignalIngestionEngine,
} from "./engines/connector-signal-ingestion-engine.js";
export type { ConnectorIngestionOutcome } from "./engines/connector-signal-ingestion-engine.js";

export {
  CONNECTOR_SIGNAL_INGESTION_MODULE_ID,
  CONNECTOR_SIGNAL_INGESTION_MODULE_VERSION,
  CONNECTOR_SIGNAL_INGESTION_CAPABILITIES,
  CONNECTOR_SIGNAL_INGESTION_MODULE_CONTRACT,
  ConnectorSignalIngestionModule,
  createConnectorSignalIngestionModule,
  connectorSignalIngestionModule,
} from "./contract/connector-signal-ingestion-module.js";
export type {
  ConnectorSignalIngestionModuleId,
  ConnectorSignalIngestionCapability,
  ConnectorSignalIngestionModuleContract,
} from "./contract/connector-signal-ingestion-module.js";
