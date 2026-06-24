/**
 * Connector Signal Ingestion module — turns connector observations into trusted product signals.
 */

import { createConnectorRegistryModule } from "../../connector-registry/contract/connector-registry-module.js";
import type { ConnectorRegistryModule } from "../../connector-registry/contract/connector-registry-module.js";
import { createGlobalProductSignalModule } from "../../global-product-signals/contract/global-product-signal-module.js";
import type { GlobalProductSignalModule } from "../../global-product-signals/contract/global-product-signal-module.js";
import {
  ConnectorSignalIngestionEngine,
  type ConnectorIngestionOutcome,
} from "../engines/connector-signal-ingestion-engine.js";
import { mapConnectorSignalToProductSignal, resolveSignalSourceForConnector } from "../mappers/connector-signal-mapper.js";
import type { ConnectorIngestionEventInput } from "../models/connector-ingestion-event.js";
import type { ConnectorIngestionResult } from "../models/connector-ingestion-result.js";
import type {
  ConnectorSignalIngestionQuery,
  ConnectorSignalIngestionRepository,
} from "../repositories/connector-signal-ingestion-repository.js";
import { createInMemoryConnectorSignalIngestionRepository } from "../repositories/in-memory-connector-signal-ingestion-repository.js";
import type { ConnectorIngestionOptions } from "../validators/connector-signal-validator.js";
import { connectorSignalValidator } from "../validators/connector-signal-validator.js";

export const CONNECTOR_SIGNAL_INGESTION_MODULE_ID = "connector-signal-ingestion" as const;
export type ConnectorSignalIngestionModuleId = typeof CONNECTOR_SIGNAL_INGESTION_MODULE_ID;

export const CONNECTOR_SIGNAL_INGESTION_MODULE_VERSION = "0.1.0" as const;

export type ConnectorSignalIngestionCapability =
  | "connector-signal-ingestion.ingest"
  | "connector-signal-ingestion.map"
  | "connector-signal-ingestion.validate"
  | "connector-signal-ingestion.results";

export const CONNECTOR_SIGNAL_INGESTION_CAPABILITIES: readonly ConnectorSignalIngestionCapability[] = [
  "connector-signal-ingestion.ingest",
  "connector-signal-ingestion.map",
  "connector-signal-ingestion.validate",
  "connector-signal-ingestion.results",
] as const;

export type ConnectorSignalIngestionModuleContract = {
  moduleId: ConnectorSignalIngestionModuleId;
  version: string;
  capabilities: readonly ConnectorSignalIngestionCapability[];
};

export const CONNECTOR_SIGNAL_INGESTION_MODULE_CONTRACT: ConnectorSignalIngestionModuleContract = {
  moduleId: CONNECTOR_SIGNAL_INGESTION_MODULE_ID,
  version: CONNECTOR_SIGNAL_INGESTION_MODULE_VERSION,
  capabilities: CONNECTOR_SIGNAL_INGESTION_CAPABILITIES,
};

/** Orchestrates connector signal validation, mapping, and registry persistence. */
export class ConnectorSignalIngestionModule {
  readonly contract = CONNECTOR_SIGNAL_INGESTION_MODULE_CONTRACT;
  private readonly engine: ConnectorSignalIngestionEngine;

  constructor(
    private readonly ingestionRepository: ConnectorSignalIngestionRepository,
    connectorRegistry: ConnectorRegistryModule = createConnectorRegistryModule(),
    productSignalRegistry: GlobalProductSignalModule = createGlobalProductSignalModule(),
  ) {
    this.engine = new ConnectorSignalIngestionEngine(
      connectorRegistry,
      productSignalRegistry,
      ingestionRepository,
    );
  }

  async ingest(
    workspaceId: string,
    input: ConnectorIngestionEventInput,
    options: ConnectorIngestionOptions = {},
  ): Promise<ConnectorIngestionOutcome> {
    return this.engine.ingest(workspaceId, input, options);
  }

  mapSignal = mapConnectorSignalToProductSignal;
  resolveSignalSource = resolveSignalSourceForConnector;
  validator = connectorSignalValidator;

  async getIngestionResult(
    workspaceId: string,
    resultId: string,
  ): Promise<ConnectorIngestionResult | null> {
    return this.ingestionRepository.getById(workspaceId, resultId);
  }

  async getIngestionResultByEvent(
    workspaceId: string,
    eventId: string,
  ): Promise<ConnectorIngestionResult | null> {
    return this.ingestionRepository.getByEventId(workspaceId, eventId);
  }

  async listIngestionResults(
    workspaceId: string,
    filters: Omit<ConnectorSignalIngestionQuery, "workspaceId"> = {},
  ): Promise<ConnectorIngestionResult[]> {
    return this.ingestionRepository.list({ workspaceId, ...filters });
  }
}

/** Factory for a connector signal ingestion module with optional custom dependencies. */
export function createConnectorSignalIngestionModule(
  ingestionRepository: ConnectorSignalIngestionRepository = createInMemoryConnectorSignalIngestionRepository(),
  connectorRegistry: ConnectorRegistryModule = createConnectorRegistryModule(),
  productSignalRegistry: GlobalProductSignalModule = createGlobalProductSignalModule(),
): ConnectorSignalIngestionModule {
  return new ConnectorSignalIngestionModule(
    ingestionRepository,
    connectorRegistry,
    productSignalRegistry,
  );
}

export const connectorSignalIngestionModule = createConnectorSignalIngestionModule();
