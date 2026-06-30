import { z } from "zod";

export const SUPPLIER_CONNECTOR_SIGNAL_TYPES = [
  "platform_readiness",
  "capability_coverage",
  "credential_readiness",
  "health_baseline",
  "sync_preparation",
  "ordering_safety",
  "connector_composite",
] as const;

export type SupplierConnectorSignalType = (typeof SUPPLIER_CONNECTOR_SIGNAL_TYPES)[number];

/** Individual factor contributing to supplier connector preparation scoring. */
export type SupplierConnectorSignal = {
  signalType: SupplierConnectorSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const supplierConnectorSignalSchema = z.object({
  signalType: z.enum(SUPPLIER_CONNECTOR_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a SupplierConnectorSignal record shape. */
export function validateSupplierConnectorSignal(value: unknown): SupplierConnectorSignal {
  return supplierConnectorSignalSchema.parse(value);
}
