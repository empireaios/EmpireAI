import { z } from "zod";

export const CONNECTOR_CAPABILITY_KINDS = [
  "PRODUCT_OBSERVATION",
  "TREND_OBSERVATION",
  "SUPPLIER_OBSERVATION",
  "SOCIAL_LISTENING",
  "SEARCH_ANALYTICS",
  "WEBHOOK_INGEST",
  "VIDEO_ANALYTICS",
] as const;

export type ConnectorCapabilityKind = (typeof CONNECTOR_CAPABILITY_KINDS)[number];

/** Declared capability for an external intelligence connector. */
export type ConnectorCapability = {
  capabilityId: string;
  kind: ConnectorCapabilityKind;
  label: string;
  enabled: boolean;
  description?: string;
};

export type ConnectorCapabilityInput = Omit<ConnectorCapability, "capabilityId"> & {
  capabilityId?: string;
};

export const connectorCapabilitySchema = z.object({
  capabilityId: z.string().min(1),
  kind: z.enum(CONNECTOR_CAPABILITY_KINDS),
  label: z.string().min(1),
  enabled: z.boolean(),
  description: z.string().optional(),
});

/** Validates a ConnectorCapability record shape. */
export function validateConnectorCapability(value: unknown): ConnectorCapability {
  return connectorCapabilitySchema.parse(value);
}
