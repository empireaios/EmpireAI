import { randomUUID } from "node:crypto";

import type {
  ConnectorIngestionResult,
  ConnectorIngestionResultCreateInput,
} from "../models/connector-ingestion-result.js";
import type {
  ConnectorSignalIngestionQuery,
  ConnectorSignalIngestionRepository,
} from "./connector-signal-ingestion-repository.js";

function storageKey(workspaceId: string, resultId: string): string {
  return `${workspaceId}:${resultId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

/** In-memory ConnectorSignalIngestionRepository for Mission 036 tests and local development. */
export class InMemoryConnectorSignalIngestionRepository implements ConnectorSignalIngestionRepository {
  private readonly store = new Map<string, ConnectorIngestionResult>();
  private readonly eventIndex = new Map<string, string>();

  async record(input: ConnectorIngestionResultCreateInput): Promise<ConnectorIngestionResult> {
    const result: ConnectorIngestionResult = {
      resultId: randomUUID(),
      eventId: input.eventId,
      workspaceId: input.workspaceId,
      connectorId: input.connectorId,
      status: input.status,
      reason: input.reason,
      signalId: input.signalId ?? null,
      createdAt: nowIso(),
    };

    this.store.set(storageKey(input.workspaceId, result.resultId), result);
    this.eventIndex.set(`${input.workspaceId}:${input.eventId}`, result.resultId);
    return structuredClone(result);
  }

  async getById(workspaceId: string, resultId: string): Promise<ConnectorIngestionResult | null> {
    const result = this.store.get(storageKey(workspaceId, resultId));
    return result ? structuredClone(result) : null;
  }

  async getByEventId(workspaceId: string, eventId: string): Promise<ConnectorIngestionResult | null> {
    const resultId = this.eventIndex.get(`${workspaceId}:${eventId}`);
    if (!resultId) {
      return null;
    }
    return this.getById(workspaceId, resultId);
  }

  async list(query: ConnectorSignalIngestionQuery): Promise<ConnectorIngestionResult[]> {
    let results = [...this.store.entries()]
      .filter(([key]) => key.startsWith(`${query.workspaceId}:`))
      .map(([, result]) => result);

    if (query.connectorId) {
      results = results.filter((result) => result.connectorId === query.connectorId);
    }
    if (query.status) {
      results = results.filter((result) => result.status === query.status);
    }

    results.sort(
      (left, right) =>
        right.createdAt.localeCompare(left.createdAt) ||
        left.connectorId.localeCompare(right.connectorId),
    );

    return paginate(results.map((result) => structuredClone(result)), query.limit, query.offset);
  }
}

/** Factory for a fresh in-memory connector signal ingestion repository. */
export function createInMemoryConnectorSignalIngestionRepository(): InMemoryConnectorSignalIngestionRepository {
  return new InMemoryConnectorSignalIngestionRepository();
}
