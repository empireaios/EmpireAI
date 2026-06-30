import { z } from "zod";

export const SUPPLIER_HEALTH_STATES = [
  "READY",
  "DEGRADED",
  "FAILED",
  "UNAVAILABLE",
  "UNKNOWN",
] as const;

export type SupplierHealthState = (typeof SUPPLIER_HEALTH_STATES)[number];

/** Health snapshot for a supplier connector integration. */
export type SupplierHealth = {
  healthState: SupplierHealthState;
  message: string;
  credentialsConfigured: boolean;
  apiReachable: boolean;
  consecutiveFailures: number;
  lastCheckedAt: string;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  lastSuccessfulSync?: string | null;
  lastFailureReason?: string | null;
};

export type SupplierHealthInput = Omit<SupplierHealth, "lastCheckedAt"> & {
  lastCheckedAt?: string;
};

const isoTimestamp = z.string().datetime({ offset: true });

export const supplierHealthSchema = z.object({
  healthState: z.enum(SUPPLIER_HEALTH_STATES),
  message: z.string().min(1),
  credentialsConfigured: z.boolean(),
  apiReachable: z.boolean(),
  consecutiveFailures: z.number().int().min(0),
  lastCheckedAt: isoTimestamp,
  lastSuccessAt: isoTimestamp.optional(),
  lastFailureAt: isoTimestamp.optional(),
  lastSuccessfulSync: isoTimestamp.nullable().optional(),
  lastFailureReason: z.string().nullable().optional(),
});

/** Validates a SupplierHealth record shape. */
export function validateSupplierHealth(value: unknown): SupplierHealth {
  return supplierHealthSchema.parse(value);
}

/** Default health for newly prepared supplier connectors. */
export function createDefaultSupplierHealth(
  message = "Awaiting credential configuration",
): SupplierHealth {
  return {
    healthState: "UNKNOWN",
    message,
    credentialsConfigured: false,
    apiReachable: false,
    consecutiveFailures: 0,
    lastCheckedAt: new Date().toISOString(),
  };
}
