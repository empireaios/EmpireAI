import { randomUUID } from "node:crypto";

import { getDatabase } from "../../../brain/database.js";
import { ConnectorConnectionRepository } from "../../../connectors/connection-repository.js";
import { loadLivePaymentEnv, isStripeLiveConfigured } from "../../../revenue/live-payment-engine/config/live-payment-env.js";
import type {
  MarketplaceConnection,
  MarketplaceConnectionStatus,
  MarketplaceHealthStatus,
  MarketplaceId,
} from "../models/marketplace-connection.js";
import {
  getMarketplaceDefinition,
  MARKETPLACE_CONNECTOR_MAP,
  MARKETPLACE_DEFINITIONS,
} from "./marketplace-definitions.js";

let repositoryInstance: SqliteMarketplaceConnectionRepository | null = null;

export function getMarketplaceConnectionRepository(): SqliteMarketplaceConnectionRepository {
  if (!repositoryInstance) {
    repositoryInstance = new SqliteMarketplaceConnectionRepository();
  }
  return repositoryInstance;
}

export function resetMarketplaceConnectionRepository(): void {
  repositoryInstance = null;
}

function mapRow(row: Record<string, unknown>): MarketplaceConnection {
  return JSON.parse(String(row.connection_json)) as MarketplaceConnection;
}

export class SqliteMarketplaceConnectionRepository {
  saveConnection(connection: MarketplaceConnection): MarketplaceConnection {
    const db = getDatabase();
    const record = { ...connection, updatedAt: new Date().toISOString() };
    db.prepare(
      `INSERT INTO marketplace_connections
        (marketplace_id, workspace_id, status, connection_json, updated_at)
       VALUES
        (@marketplaceId, @workspaceId, @status, @connectionJson, @updatedAt)
       ON CONFLICT(marketplace_id, workspace_id) DO UPDATE SET
         status = excluded.status,
         connection_json = excluded.connection_json,
         updated_at = excluded.updated_at`,
    ).run({
      marketplaceId: record.marketplaceId,
      workspaceId: record.workspaceId,
      status: record.status,
      connectionJson: JSON.stringify(record),
      updatedAt: record.updatedAt,
    });
    return record;
  }

  getConnection(workspaceId: string, marketplaceId: MarketplaceId): MarketplaceConnection | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT connection_json FROM marketplace_connections
         WHERE workspace_id = @workspaceId AND marketplace_id = @marketplaceId`,
      )
      .get({ workspaceId, marketplaceId });
    return row ? mapRow(row as Record<string, unknown>) : null;
  }

  listConnections(workspaceId: string): MarketplaceConnection[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT connection_json FROM marketplace_connections WHERE workspace_id = @workspaceId`,
      )
      .all({ workspaceId });
    return (rows as Record<string, unknown>[]).map(mapRow);
  }
}

function assessHealth(status: MarketplaceConnectionStatus): MarketplaceHealthStatus {
  switch (status) {
    case "CONNECTED":
      return "HEALTHY";
    case "CONNECTING":
      return "UNKNOWN";
    case "EXPIRED":
    case "ERROR":
      return "UNHEALTHY";
    default:
      return "UNKNOWN";
  }
}

function buildDefaultConnection(workspaceId: string, marketplaceId: MarketplaceId): MarketplaceConnection {
  const definition = getMarketplaceDefinition(marketplaceId);
  const timestamp = new Date().toISOString();
  return {
    marketplaceId,
    workspaceId,
    displayName: definition.displayName,
    status: "NOT_CONNECTED",
    health: "UNKNOWN",
    permissionStatus: "NOT_GRANTED",
    availableApis: definition.availableApis,
    requiredHumanSteps: definition.requiredHumanSteps,
    oauthReady: definition.oauthSupported,
    oauthUrl: definition.oauthSupported
      ? `/marketplace-infrastructure/${marketplaceId}/oauth/start`
      : undefined,
    connectorId: MARKETPLACE_CONNECTOR_MAP[marketplaceId],
    lastCheckedAt: timestamp,
    updatedAt: timestamp,
    metadata: { philosophy: definition.philosophy },
  };
}

function syncFromConnectorCatalog(
  workspaceId: string,
  connection: MarketplaceConnection,
): MarketplaceConnection {
  const connectorId = MARKETPLACE_CONNECTOR_MAP[connection.marketplaceId];
  if (!connectorId) {
    return connection;
  }

  const connectorRepo = new ConnectorConnectionRepository();
  const existing = connectorRepo
    .listByWorkspace(workspaceId)
    .find((entry) => entry.connectorId === connectorId);

  if (!existing) {
    return connection;
  }

  const statusMap: Record<string, MarketplaceConnectionStatus> = {
    connected: "CONNECTED",
    degraded: "ERROR",
    disconnected: "NOT_CONNECTED",
    available: "NOT_CONNECTED",
  };

  return {
    ...connection,
    status: statusMap[existing.status] ?? connection.status,
    health: assessHealth(statusMap[existing.status] ?? connection.status),
    permissionStatus: existing.status === "connected" ? "GRANTED" : "NOT_GRANTED",
    credentialsRef: existing.credentialsRef ?? undefined,
    connectorId,
    lastCheckedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/** Marketplace Infrastructure Engine — connection status without storing passwords. */
export function listMarketplaceConnections(workspaceId: string): MarketplaceConnection[] {
  const repository = getMarketplaceConnectionRepository();
  const existing = repository.listConnections(workspaceId);
  const byId = new Map(existing.map((entry) => [entry.marketplaceId, entry]));

  return (Object.keys(MARKETPLACE_DEFINITIONS) as MarketplaceId[]).map((marketplaceId) => {
    const base = byId.get(marketplaceId) ?? buildDefaultConnection(workspaceId, marketplaceId);
    const synced = syncFromConnectorCatalog(workspaceId, base);
    if (!byId.has(marketplaceId)) {
      repository.saveConnection(synced);
    }
    return synced;
  });
}

export function getMarketplaceConnection(
  workspaceId: string,
  marketplaceId: MarketplaceId,
): MarketplaceConnection {
  const repository = getMarketplaceConnectionRepository();
  const existing = repository.getConnection(workspaceId, marketplaceId);
  const connection = syncFromConnectorCatalog(
    workspaceId,
    existing ?? buildDefaultConnection(workspaceId, marketplaceId),
  );
  if (!existing) {
    repository.saveConnection(connection);
  }
  return connection;
}

export function startMarketplaceConnection(
  workspaceId: string,
  marketplaceId: MarketplaceId,
  actor: string,
): MarketplaceConnection {
  const definition = getMarketplaceDefinition(marketplaceId);
  const repository = getMarketplaceConnectionRepository();
  const connection: MarketplaceConnection = {
    ...buildDefaultConnection(workspaceId, marketplaceId),
    status: "CONNECTING",
    health: "UNKNOWN",
    permissionStatus: "PENDING",
    oauthUrl: definition.oauthSupported
      ? `/marketplace-infrastructure/${marketplaceId}/oauth/start?workspace=${workspaceId}`
      : undefined,
    metadata: {
      philosophy: definition.philosophy,
      actor,
      startedAt: new Date().toISOString(),
    },
  };
  return repository.saveConnection(connection);
}

export function completeMarketplaceConnection(
  workspaceId: string,
  marketplaceId: MarketplaceId,
  input: { credentialsRef: string; actor?: string },
): MarketplaceConnection {
  const repository = getMarketplaceConnectionRepository();
  const connectorId = MARKETPLACE_CONNECTOR_MAP[marketplaceId];

  if (connectorId) {
    const connectorRepo = new ConnectorConnectionRepository();
    connectorRepo.upsert({
      workspaceId,
      connectorId,
      category: "commerce",
      status: "connected",
      credentialsRef: input.credentialsRef,
      metadata: { marketplaceId, connectedBy: input.actor ?? "system", oauth: true },
    });
  }

  const connection: MarketplaceConnection = {
    ...getMarketplaceConnection(workspaceId, marketplaceId),
    status: "CONNECTED",
    health: "HEALTHY",
    permissionStatus: "GRANTED",
    credentialsRef: input.credentialsRef,
    metadata: {
      ...getMarketplaceConnection(workspaceId, marketplaceId).metadata,
      connectedAt: new Date().toISOString(),
      connectedBy: input.actor ?? "system",
    },
  };
  return repository.saveConnection(connection);
}

export function markMarketplaceConnectionError(
  workspaceId: string,
  marketplaceId: MarketplaceId,
  reason: string,
): MarketplaceConnection {
  const repository = getMarketplaceConnectionRepository();
  const connection: MarketplaceConnection = {
    ...getMarketplaceConnection(workspaceId, marketplaceId),
    status: "ERROR",
    health: "UNHEALTHY",
    metadata: {
      ...getMarketplaceConnection(workspaceId, marketplaceId).metadata,
      error: reason,
      errorAt: new Date().toISOString(),
    },
  };
  return repository.saveConnection(connection);
}

export function getMarketplaceConnectionGuide(marketplaceId: MarketplaceId) {
  return getMarketplaceDefinition(marketplaceId);
}

/** Non-marketplace infrastructure connections for Grand King's dashboard. */
export function getInfrastructureConnectionStatus(
  workspaceId: string,
  connectorId: string,
): MarketplaceConnectionStatus {
  const connectorRepo = new ConnectorConnectionRepository();
  const existing = connectorRepo
    .listByWorkspace(workspaceId)
    .find((entry) => entry.connectorId === connectorId);

  if (existing?.status === "connected") {
    return "CONNECTED";
  }
  if (existing?.status === "degraded") {
    return "ERROR";
  }

  if (connectorId === "stripe") {
    const paymentEnv = loadLivePaymentEnv();
    if (isStripeLiveConfigured(paymentEnv)) {
      return "CONNECTED";
    }
    if (paymentEnv.STRIPE_SECRET_KEY) {
      return "CONNECTING";
    }
  }

  if (connectorId === "cj-dropshipping") {
    const hasCj = Boolean(process.env.CJ_API_KEY && process.env.CJ_API_SECRET);
    return hasCj ? "CONNECTING" : "NOT_CONNECTED";
  }

  return "NOT_CONNECTED";
}

export function createMarketplaceOAuthState(
  workspaceId: string,
  marketplaceId: MarketplaceId,
): string {
  return `mp-oauth:${workspaceId}:${marketplaceId}:${randomUUID()}`;
}
