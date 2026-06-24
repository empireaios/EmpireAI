import type { IngestionResultStatus } from "../models/connector-ingestion-result.js";
import type {
  ConnectorIngestionResult,
  ConnectorIngestionResultCreateInput,
} from "../models/connector-ingestion-result.js";

export type ConnectorSignalIngestionQuery = {
  workspaceId: string;
  connectorId?: string;
  status?: IngestionResultStatus;
  limit?: number;
  offset?: number;
};

/** Persists connector signal ingestion outcomes. */
export interface ConnectorSignalIngestionRepository {
  record(input: ConnectorIngestionResultCreateInput): Promise<ConnectorIngestionResult>;
  getById(workspaceId: string, resultId: string): Promise<ConnectorIngestionResult | null>;
  getByEventId(workspaceId: string, eventId: string): Promise<ConnectorIngestionResult | null>;
  list(query: ConnectorSignalIngestionQuery): Promise<ConnectorIngestionResult[]>;
}
