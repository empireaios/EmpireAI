import { normalizeConnectorId } from "../../connector-registry/utilities/connector-validation.js";
import type { EyeConnector } from "../../connector-registry/models/eye-connector.js";
import type { IngestionRejectionReason } from "../models/connector-ingestion-result.js";
import type {
  ConnectorIngestionEvent,
  ConnectorIngestionEventInput,
} from "../models/connector-ingestion-event.js";

export type ConnectorIngestionOptions = {
  allowUnhealthyConnector?: boolean;
};

export type ConnectorValidationOutcome = {
  eligible: boolean;
  reason?: IngestionRejectionReason;
  message: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

/** Normalizes and validates a connector ingestion event input. */
export function normalizeIngestionEventInput(
  workspaceId: string,
  input: ConnectorIngestionEventInput,
  eventId: string,
): ConnectorIngestionEvent {
  const connectorId = normalizeConnectorId(input.connectorId);
  const productId = input.productId.trim();

  if (!connectorId) {
    throw new Error("Connector id is required");
  }
  if (!productId) {
    throw new Error("Product id is required");
  }
  if (!input.evidence || input.evidence.length === 0) {
    throw new Error("At least one evidence item is required");
  }

  for (const item of input.evidence) {
    if (!item.kind.trim() || !item.summary.trim() || !item.value.trim()) {
      throw new Error("Evidence kind, summary, and value are required");
    }
  }

  return {
    eventId,
    workspaceId,
    connectorId,
    productId,
    observedAt: input.observedAt ?? nowIso(),
    strength: input.strength,
    evidence: input.evidence,
    metadata: input.metadata ?? {},
  };
}

/** Validates whether a connector is eligible to ingest signals. */
export function validateConnectorForIngestion(
  connector: EyeConnector | null,
  options: ConnectorIngestionOptions = {},
): ConnectorValidationOutcome {
  if (!connector) {
    return {
      eligible: false,
      reason: "UNKNOWN_CONNECTOR",
      message: "Connector is not registered",
    };
  }

  const healthState = connector.health.healthState;
  const isUnhealthy = healthState === "UNHEALTHY" || healthState === "UNKNOWN";

  if (isUnhealthy && !options.allowUnhealthyConnector) {
    return {
      eligible: false,
      reason: "UNHEALTHY_CONNECTOR",
      message: `Connector health is ${healthState}`,
    };
  }

  if (isUnhealthy && options.allowUnhealthyConnector) {
    return {
      eligible: true,
      message: "Unhealthy connector explicitly allowed for ingestion",
    };
  }

  const isActiveOrHealthy =
    connector.status === "ACTIVE" ||
    healthState === "HEALTHY" ||
    (connector.status === "DEGRADED" && healthState === "DEGRADED");

  if (!isActiveOrHealthy) {
    return {
      eligible: false,
      reason: "INACTIVE_CONNECTOR",
      message: `Connector status is ${connector.status}`,
    };
  }

  return { eligible: true, message: "Connector eligible for ingestion" };
}

/** Validates connector existence and eligibility for ingestion. */
export function validateConnectorSignalIngestion(
  connector: EyeConnector | null,
  options: ConnectorIngestionOptions = {},
): ConnectorValidationOutcome {
  return validateConnectorForIngestion(connector, options);
}

export const connectorSignalValidator = {
  normalizeIngestionEventInput,
  validateConnectorForIngestion,
  validateConnectorSignalIngestion,
} as const;
