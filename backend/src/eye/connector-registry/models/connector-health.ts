import { z } from "zod";

export const CONNECTOR_HEALTH_STATES = ["HEALTHY", "DEGRADED", "UNHEALTHY", "UNKNOWN"] as const;
export type ConnectorHealthState = (typeof CONNECTOR_HEALTH_STATES)[number];

/** Runtime health snapshot for a registered Eye connector. */
export type ConnectorHealth = {
  healthState: ConnectorHealthState;
  message: string;
  latencyMs?: number;
  consecutiveFailures: number;
  lastCheckedAt: string;
  lastSuccessAt?: string;
  lastFailureAt?: string;
};

export type ConnectorHealthInput = Omit<ConnectorHealth, "lastCheckedAt"> & {
  lastCheckedAt?: string;
};

const isoTimestamp = z.string().datetime({ offset: true });

export const connectorHealthSchema = z.object({
  healthState: z.enum(CONNECTOR_HEALTH_STATES),
  message: z.string().min(1),
  latencyMs: z.number().min(0).optional(),
  consecutiveFailures: z.number().int().min(0),
  lastCheckedAt: isoTimestamp,
  lastSuccessAt: isoTimestamp.optional(),
  lastFailureAt: isoTimestamp.optional(),
});

/** Validates a ConnectorHealth record shape. */
export function validateConnectorHealth(value: unknown): ConnectorHealth {
  return connectorHealthSchema.parse(value);
}

/** Default health for newly registered connectors. */
export function createDefaultConnectorHealth(message = "Awaiting first sync"): ConnectorHealth {
  return {
    healthState: "UNKNOWN",
    message,
    consecutiveFailures: 0,
    lastCheckedAt: new Date().toISOString(),
  };
}
