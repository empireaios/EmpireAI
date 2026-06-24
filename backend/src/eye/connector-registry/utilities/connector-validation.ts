import { randomUUID } from "node:crypto";

import type { ConnectorCapability, ConnectorCapabilityInput } from "../models/connector-capability.js";
import type { ConnectorHealth, ConnectorHealthInput } from "../models/connector-health.js";
import {
  CONNECTOR_STATUSES,
  type ConnectorStatus,
  type EyeConnectorCreateInput,
} from "../models/eye-connector.js";

const ALLOWED_STATUS_TRANSITIONS: Record<ConnectorStatus, readonly ConnectorStatus[]> = {
  REGISTERED: ["ACTIVE", "DISABLED"],
  ACTIVE: ["DEGRADED", "PAUSED", "DISABLED"],
  DEGRADED: ["ACTIVE", "PAUSED", "DISABLED"],
  PAUSED: ["ACTIVE", "DISABLED"],
  DISABLED: ["REGISTERED"],
};

/** Normalizes connector ids to lowercase kebab-case. */
export function normalizeConnectorId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/** Validates connector registration input before persistence. */
export function validateConnectorRegistration(input: EyeConnectorCreateInput): EyeConnectorCreateInput {
  const connectorId = normalizeConnectorId(input.connectorId);
  if (!connectorId) {
    throw new Error("Connector id is required");
  }

  const connectorName = input.connectorName.trim();
  if (!connectorName) {
    throw new Error("Connector name is required");
  }

  if (!CONNECTOR_STATUSES.includes(input.status ?? "REGISTERED")) {
    throw new Error(`Invalid connector status: ${input.status}`);
  }

  const capabilities = (input.capabilities ?? []).map((capability) =>
    normalizeConnectorCapability(capability),
  );

  const capabilityIds = new Set<string>();
  for (const capability of capabilities) {
    if (capabilityIds.has(capability.capabilityId)) {
      throw new Error(`Duplicate capability id: ${capability.capabilityId}`);
    }
    capabilityIds.add(capability.capabilityId);
  }

  return {
    ...input,
    connectorId,
    connectorName,
    status: input.status ?? "REGISTERED",
    capabilities,
  };
}

/** Validates whether a connector status transition is allowed. */
export function validateStatusTransition(
  currentStatus: ConnectorStatus,
  nextStatus: ConnectorStatus,
): void {
  if (currentStatus === nextStatus) {
    return;
  }

  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus];
  if (!allowed.includes(nextStatus)) {
    throw new Error(`Invalid connector status transition: ${currentStatus} -> ${nextStatus}`);
  }
}

/** Validates and normalizes a health update payload. */
export function validateHealthUpdate(input: ConnectorHealthInput): ConnectorHealth {
  const message = input.message.trim();
  if (!message) {
    throw new Error("Health message is required");
  }

  if (input.consecutiveFailures < 0) {
    throw new Error("consecutiveFailures must be non-negative");
  }

  if (input.latencyMs !== undefined && input.latencyMs < 0) {
    throw new Error("latencyMs must be non-negative");
  }

  return {
    healthState: input.healthState,
    message,
    latencyMs: input.latencyMs,
    consecutiveFailures: input.consecutiveFailures,
    lastCheckedAt: input.lastCheckedAt ?? new Date().toISOString(),
    lastSuccessAt: input.lastSuccessAt,
    lastFailureAt: input.lastFailureAt,
  };
}

/** Normalizes capability input and assigns an id when missing. */
export function normalizeConnectorCapability(input: ConnectorCapabilityInput): ConnectorCapability {
  const label = input.label.trim();
  if (!label) {
    throw new Error("Capability label is required");
  }

  return {
    capabilityId: input.capabilityId ?? randomUUID(),
    kind: input.kind,
    label,
    enabled: input.enabled,
    description: input.description?.trim() || undefined,
  };
}

export const connectorValidation = {
  normalizeConnectorId,
  validateConnectorRegistration,
  validateStatusTransition,
  validateHealthUpdate,
  normalizeConnectorCapability,
} as const;
