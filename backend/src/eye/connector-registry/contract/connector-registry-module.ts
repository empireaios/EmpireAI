/**
 * Eye Connector Registry module — central catalog for external intelligence sources.
 */

import type { ConnectorCapabilityInput } from "../models/connector-capability.js";
import type { ConnectorHealthInput } from "../models/connector-health.js";
import type {
  ConnectorStatus,
  ConnectorType,
  EyeConnector,
  EyeConnectorCreateInput,
} from "../models/eye-connector.js";
import { KNOWN_CONNECTOR_TEMPLATES, resolveKnownConnectorTemplate } from "../models/eye-connector.js";
import type { ConnectorRegistry, ConnectorRegistryQuery } from "../repositories/connector-registry.js";
import { createInMemoryConnectorRegistry } from "../repositories/in-memory-connector-registry.js";
import { validateConnectorRegistration } from "../utilities/connector-validation.js";

export const CONNECTOR_REGISTRY_MODULE_ID = "eye-connector-registry" as const;
export type ConnectorRegistryModuleId = typeof CONNECTOR_REGISTRY_MODULE_ID;

export const CONNECTOR_REGISTRY_MODULE_VERSION = "0.1.0" as const;

export type ConnectorRegistryCapability =
  | "connector-registry.register"
  | "connector-registry.lookup"
  | "connector-registry.health"
  | "connector-registry.status"
  | "connector-registry.capabilities"
  | "connector-registry.list";

export const CONNECTOR_REGISTRY_CAPABILITIES: readonly ConnectorRegistryCapability[] = [
  "connector-registry.register",
  "connector-registry.lookup",
  "connector-registry.health",
  "connector-registry.status",
  "connector-registry.capabilities",
  "connector-registry.list",
] as const;

export type ConnectorRegistryModuleContract = {
  moduleId: ConnectorRegistryModuleId;
  version: string;
  capabilities: readonly ConnectorRegistryCapability[];
};

export const CONNECTOR_REGISTRY_MODULE_CONTRACT: ConnectorRegistryModuleContract = {
  moduleId: CONNECTOR_REGISTRY_MODULE_ID,
  version: CONNECTOR_REGISTRY_MODULE_VERSION,
  capabilities: CONNECTOR_REGISTRY_CAPABILITIES,
};

/** Orchestrates connector registration, health, status, and capability management. */
export class ConnectorRegistryModule {
  readonly contract = CONNECTOR_REGISTRY_MODULE_CONTRACT;

  constructor(private readonly registry: ConnectorRegistry) {}

  validateRegistration(input: EyeConnectorCreateInput): EyeConnectorCreateInput {
    return validateConnectorRegistration(input);
  }

  async registerConnector(
    workspaceId: string,
    input: EyeConnectorCreateInput,
  ): Promise<EyeConnector> {
    return this.registry.register(workspaceId, this.validateRegistration(input));
  }

  async registerKnownConnector(
    workspaceId: string,
    connectorId: string,
  ): Promise<EyeConnector> {
    const template = resolveKnownConnectorTemplate(connectorId);
    if (!template) {
      throw new Error(`Unknown connector template: ${connectorId}`);
    }
    return this.registerConnector(workspaceId, template);
  }

  async getConnector(workspaceId: string, connectorId: string): Promise<EyeConnector | null> {
    return this.registry.getById(workspaceId, connectorId);
  }

  async updateConnectorStatus(
    workspaceId: string,
    connectorId: string,
    status: ConnectorStatus,
  ): Promise<EyeConnector> {
    return this.registry.updateStatus(workspaceId, connectorId, status);
  }

  async updateConnectorHealth(
    workspaceId: string,
    connectorId: string,
    health: ConnectorHealthInput,
  ): Promise<EyeConnector> {
    return this.registry.updateHealth(workspaceId, connectorId, health);
  }

  async recordConnectorSync(
    workspaceId: string,
    connectorId: string,
    lastSync: string = new Date().toISOString(),
  ): Promise<EyeConnector> {
    return this.registry.updateLastSync(workspaceId, connectorId, lastSync);
  }

  async addConnectorCapability(
    workspaceId: string,
    connectorId: string,
    capability: ConnectorCapabilityInput,
  ): Promise<EyeConnector> {
    return this.registry.addCapability(workspaceId, connectorId, capability);
  }

  async removeConnectorCapability(
    workspaceId: string,
    connectorId: string,
    capabilityId: string,
  ): Promise<EyeConnector> {
    return this.registry.removeCapability(workspaceId, connectorId, capabilityId);
  }

  async listConnectors(
    workspaceId: string,
    filters: Omit<ConnectorRegistryQuery, "workspaceId"> = {},
  ): Promise<EyeConnector[]> {
    return this.registry.list({ workspaceId, ...filters });
  }

  listKnownConnectorTemplates(): readonly EyeConnectorCreateInput[] {
    return KNOWN_CONNECTOR_TEMPLATES;
  }
}

/** Factory for a connector registry module with optional custom registry. */
export function createConnectorRegistryModule(
  registry: ConnectorRegistry = createInMemoryConnectorRegistry(),
): ConnectorRegistryModule {
  return new ConnectorRegistryModule(registry);
}

export const connectorRegistryModule = createConnectorRegistryModule();
