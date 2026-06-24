import { randomUUID } from "node:crypto";

import type { ConnectorRegistryModule } from "../../connector-registry/contract/connector-registry-module.js";
import type { GlobalProductSignal } from "../../global-product-signals/models/product-signal.js";
import type { GlobalProductSignalModule } from "../../global-product-signals/contract/global-product-signal-module.js";
import { mapConnectorSignalToProductSignal } from "../mappers/connector-signal-mapper.js";
import type { ConnectorIngestionEventInput } from "../models/connector-ingestion-event.js";
import type { ConnectorIngestionResult } from "../models/connector-ingestion-result.js";
import type { ConnectorSignalIngestionRepository } from "../repositories/connector-signal-ingestion-repository.js";
import {
  normalizeIngestionEventInput,
  type ConnectorIngestionOptions,
} from "../validators/connector-signal-validator.js";
import { validateConnectorSignalIngestion } from "../validators/connector-signal-validator.js";

export type ConnectorIngestionOutcome = {
  result: ConnectorIngestionResult;
  signal?: GlobalProductSignal;
};

/** Ingests connector observations into the global product signal registry. */
export class ConnectorSignalIngestionEngine {
  constructor(
    private readonly connectorRegistry: ConnectorRegistryModule,
    private readonly productSignalRegistry: GlobalProductSignalModule,
    private readonly ingestionRepository: ConnectorSignalIngestionRepository,
  ) {}

  async ingest(
    workspaceId: string,
    input: ConnectorIngestionEventInput,
    options: ConnectorIngestionOptions = {},
  ): Promise<ConnectorIngestionOutcome> {
    const eventId = randomUUID();
    let connectorId: string;

    try {
      const event = normalizeIngestionEventInput(workspaceId, input, eventId);
      connectorId = event.connectorId;

      const connector = await this.connectorRegistry.getConnector(workspaceId, event.connectorId);
      const validation = validateConnectorSignalIngestion(connector, options);

      if (!validation.eligible) {
        const result = await this.ingestionRepository.record({
          eventId,
          workspaceId,
          connectorId: event.connectorId,
          status: "REJECTED",
          reason: validation.reason ?? validation.message,
          signalId: null,
        });
        return { result };
      }

      const signalInput = mapConnectorSignalToProductSignal(connector!, event);
      const signal = await this.productSignalRegistry.register(workspaceId, signalInput);

      await this.connectorRegistry.recordConnectorSync(workspaceId, event.connectorId, event.observedAt);

      const result = await this.ingestionRepository.record({
        eventId,
        workspaceId,
        connectorId: event.connectorId,
        status: "SUCCESS",
        reason: "Signal ingested into global product signal registry",
        signalId: signal.signalId,
      });

      return { result, signal };
    } catch (error) {
      connectorId = input.connectorId;
      const result = await this.ingestionRepository.record({
        eventId,
        workspaceId,
        connectorId,
        status: "REJECTED",
        reason: error instanceof Error ? error.message : "INVALID_EVENT",
        signalId: null,
      });
      return { result };
    }
  }
}
