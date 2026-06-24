import { CONNECTOR_CATALOG, createStubConnector } from "./catalog.js";
import { ConnectorConnectionRepository } from "./connection-repository.js";
import { getConnectorMetadata, listConnectorMetadata, type ConnectorMetadata } from "./metadata.js";
import type {
  ConnectorCapability,
  ConnectorCategory,
  ConnectorDefinition,
  ConnectorContext,
  EmpireConnector,
} from "./types.js";

export class ConnectorRegistry {
  private readonly connectors = new Map<string, EmpireConnector>();
  readonly connections = new ConnectorConnectionRepository();

  constructor(overrides?: EmpireConnector[]) {
    for (const definition of CONNECTOR_CATALOG) {
      this.connectors.set(definition.id, createStubConnector(definition));
    }
    for (const connector of overrides ?? []) {
      this.connectors.set(connector.definition.id, connector);
    }
  }

  listDefinitions(category?: ConnectorCategory): ConnectorDefinition[] {
    return category
      ? CONNECTOR_CATALOG.filter((c) => c.category === category)
      : [...CONNECTOR_CATALOG];
  }

  listMetadata(category?: ConnectorCategory): ConnectorMetadata[] {
    return listConnectorMetadata(category);
  }

  getMetadata(connectorId: string): ConnectorMetadata | undefined {
    return getConnectorMetadata(connectorId);
  }

  get(connectorId: string): EmpireConnector | undefined {
    return this.connectors.get(connectorId);
  }

  require(connectorId: string): EmpireConnector {
    const connector = this.get(connectorId);
    if (!connector) throw new Error(`Unknown connector: ${connectorId}`);
    return connector;
  }

  async invoke<T = unknown>(
    connectorId: string,
    capability: ConnectorCapability,
    context: ConnectorContext,
    payload: Record<string, unknown>,
  ): Promise<T> {
    const connector = this.require(connectorId);
    if (!connector.definition.capabilities.includes(capability)) {
      throw new Error(
        `Connector ${connectorId} does not support capability: ${capability}`,
      );
    }
    return connector.invoke<T>(capability, context, payload);
  }
}

export const defaultConnectorRegistry = new ConnectorRegistry();
