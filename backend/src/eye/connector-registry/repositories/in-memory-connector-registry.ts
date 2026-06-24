import type { ConnectorCapabilityInput } from "../models/connector-capability.js";
import { createDefaultConnectorHealth, type ConnectorHealthInput } from "../models/connector-health.js";
import type {
  ConnectorStatus,
  EyeConnector,
  EyeConnectorCreateInput,
} from "../models/eye-connector.js";
import {
  normalizeConnectorCapability,
  validateConnectorRegistration,
  validateHealthUpdate,
  validateStatusTransition,
} from "../utilities/connector-validation.js";
import type { ConnectorRegistry, ConnectorRegistryQuery } from "./connector-registry.js";

function storageKey(workspaceId: string, connectorId: string): string {
  return `${workspaceId}:${connectorId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

function requireConnector(store: Map<string, EyeConnector>, key: string, connectorId: string): EyeConnector {
  const connector = store.get(key);
  if (!connector) {
    throw new Error(`Eye connector not found: ${connectorId}`);
  }
  return connector;
}

/** In-memory ConnectorRegistry for Mission 035 tests and local development. */
export class InMemoryConnectorRegistry implements ConnectorRegistry {
  private readonly store = new Map<string, EyeConnector>();

  async register(workspaceId: string, input: EyeConnectorCreateInput): Promise<EyeConnector> {
    const normalized = validateConnectorRegistration(input);
    const key = storageKey(workspaceId, normalized.connectorId);
    if (this.store.has(key)) {
      throw new Error(`Eye connector already registered: ${normalized.connectorId}`);
    }

    const timestamp = nowIso();
    const connector: EyeConnector = {
      connectorId: normalized.connectorId,
      connectorName: normalized.connectorName,
      connectorType: normalized.connectorType,
      status: normalized.status ?? "REGISTERED",
      health: normalized.health ?? createDefaultConnectorHealth(),
      lastSync: normalized.lastSync ?? null,
      capabilities: (normalized.capabilities ?? []).map((capability) =>
        normalizeConnectorCapability(capability),
      ),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(key, connector);
    return structuredClone(connector);
  }

  async getById(workspaceId: string, connectorId: string): Promise<EyeConnector | null> {
    const connector = this.store.get(storageKey(workspaceId, connectorId));
    return connector ? structuredClone(connector) : null;
  }

  async updateStatus(
    workspaceId: string,
    connectorId: string,
    status: ConnectorStatus,
  ): Promise<EyeConnector> {
    const key = storageKey(workspaceId, connectorId);
    const existing = requireConnector(this.store, key, connectorId);
    validateStatusTransition(existing.status, status);

    const updated: EyeConnector = {
      ...existing,
      status,
      updatedAt: nowIso(),
    };
    this.store.set(key, updated);
    return structuredClone(updated);
  }

  async updateHealth(
    workspaceId: string,
    connectorId: string,
    health: ConnectorHealthInput,
  ): Promise<EyeConnector> {
    const key = storageKey(workspaceId, connectorId);
    const existing = requireConnector(this.store, key, connectorId);
    const validatedHealth = validateHealthUpdate(health);

    const updated: EyeConnector = {
      ...existing,
      health: validatedHealth,
      updatedAt: nowIso(),
    };
    this.store.set(key, updated);
    return structuredClone(updated);
  }

  async updateLastSync(
    workspaceId: string,
    connectorId: string,
    lastSync: string,
  ): Promise<EyeConnector> {
    const key = storageKey(workspaceId, connectorId);
    const existing = requireConnector(this.store, key, connectorId);

    const updated: EyeConnector = {
      ...existing,
      lastSync,
      updatedAt: nowIso(),
    };
    this.store.set(key, updated);
    return structuredClone(updated);
  }

  async addCapability(
    workspaceId: string,
    connectorId: string,
    capability: ConnectorCapabilityInput,
  ): Promise<EyeConnector> {
    const key = storageKey(workspaceId, connectorId);
    const existing = requireConnector(this.store, key, connectorId);
    const normalized = normalizeConnectorCapability(capability);

    if (existing.capabilities.some((entry) => entry.capabilityId === normalized.capabilityId)) {
      throw new Error(`Capability already registered: ${normalized.capabilityId}`);
    }

    const updated: EyeConnector = {
      ...existing,
      capabilities: [...existing.capabilities, normalized],
      updatedAt: nowIso(),
    };
    this.store.set(key, updated);
    return structuredClone(updated);
  }

  async removeCapability(
    workspaceId: string,
    connectorId: string,
    capabilityId: string,
  ): Promise<EyeConnector> {
    const key = storageKey(workspaceId, connectorId);
    const existing = requireConnector(this.store, key, connectorId);
    const nextCapabilities = existing.capabilities.filter(
      (capability) => capability.capabilityId !== capabilityId,
    );

    if (nextCapabilities.length === existing.capabilities.length) {
      throw new Error(`Capability not found: ${capabilityId}`);
    }

    const updated: EyeConnector = {
      ...existing,
      capabilities: nextCapabilities,
      updatedAt: nowIso(),
    };
    this.store.set(key, updated);
    return structuredClone(updated);
  }

  async list(query: ConnectorRegistryQuery): Promise<EyeConnector[]> {
    let results = [...this.store.entries()]
      .filter(([key]) => key.startsWith(`${query.workspaceId}:`))
      .map(([, connector]) => connector);

    if (query.connectorType) {
      results = results.filter((connector) => connector.connectorType === query.connectorType);
    }
    if (query.status) {
      results = results.filter((connector) => connector.status === query.status);
    }
    if (query.healthState) {
      results = results.filter((connector) => connector.health.healthState === query.healthState);
    }
    if (query.capabilityKind) {
      results = results.filter((connector) =>
        connector.capabilities.some(
          (capability) => capability.kind === query.capabilityKind && capability.enabled,
        ),
      );
    }

    results.sort(
      (left, right) =>
        left.connectorName.localeCompare(right.connectorName) ||
        left.connectorId.localeCompare(right.connectorId),
    );

    return paginate(results.map((connector) => structuredClone(connector)), query.limit, query.offset);
  }

  async delete(workspaceId: string, connectorId: string): Promise<boolean> {
    return this.store.delete(storageKey(workspaceId, connectorId));
  }
}

/** Factory for a fresh in-memory connector registry. */
export function createInMemoryConnectorRegistry(): InMemoryConnectorRegistry {
  return new InMemoryConnectorRegistry();
}
