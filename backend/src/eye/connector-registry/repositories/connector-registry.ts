import type { ConnectorCapability, ConnectorCapabilityInput } from "../models/connector-capability.js";
import type { ConnectorHealth, ConnectorHealthInput } from "../models/connector-health.js";
import type {
  ConnectorStatus,
  ConnectorType,
  EyeConnector,
  EyeConnectorCreateInput,
} from "../models/eye-connector.js";

export type ConnectorRegistryQuery = {
  workspaceId: string;
  connectorType?: ConnectorType;
  status?: ConnectorStatus;
  healthState?: ConnectorHealth["healthState"];
  capabilityKind?: ConnectorCapability["kind"];
  limit?: number;
  offset?: number;
};

/** Shared registry contract for external Eye intelligence connectors. */
export interface ConnectorRegistry {
  register(workspaceId: string, input: EyeConnectorCreateInput): Promise<EyeConnector>;
  getById(workspaceId: string, connectorId: string): Promise<EyeConnector | null>;
  updateStatus(
    workspaceId: string,
    connectorId: string,
    status: ConnectorStatus,
  ): Promise<EyeConnector>;
  updateHealth(
    workspaceId: string,
    connectorId: string,
    health: ConnectorHealthInput,
  ): Promise<EyeConnector>;
  updateLastSync(
    workspaceId: string,
    connectorId: string,
    lastSync: string,
  ): Promise<EyeConnector>;
  addCapability(
    workspaceId: string,
    connectorId: string,
    capability: ConnectorCapabilityInput,
  ): Promise<EyeConnector>;
  removeCapability(
    workspaceId: string,
    connectorId: string,
    capabilityId: string,
  ): Promise<EyeConnector>;
  list(query: ConnectorRegistryQuery): Promise<EyeConnector[]>;
  delete(workspaceId: string, connectorId: string): Promise<boolean>;
}
