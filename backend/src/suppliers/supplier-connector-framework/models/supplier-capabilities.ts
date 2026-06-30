import { z } from "zod";

export const SUPPLIER_CONNECTOR_CAPABILITY_KINDS = [
  "CATALOG_SYNC",
  "INVENTORY_SYNC",
  "PRICING_SYNC",
  "SHIPPING_QUOTES",
  "ORDER_TRACKING",
  "ORDER_PLACEMENT",
] as const;

export type SupplierConnectorCapabilityKind =
  (typeof SUPPLIER_CONNECTOR_CAPABILITY_KINDS)[number];

/** Declared capability for a live supplier connector integration. */
export type SupplierConnectorCapability = {
  capabilityId: string;
  kind: SupplierConnectorCapabilityKind;
  label: string;
  enabled: boolean;
  liveModeSupported: boolean;
  description?: string;
};

export type SupplierConnectorCapabilityInput = Omit<
  SupplierConnectorCapability,
  "capabilityId"
> & {
  capabilityId?: string;
};

export const supplierConnectorCapabilitySchema = z.object({
  capabilityId: z.string().min(1),
  kind: z.enum(SUPPLIER_CONNECTOR_CAPABILITY_KINDS),
  label: z.string().min(1),
  enabled: z.boolean(),
  liveModeSupported: z.boolean(),
  description: z.string().optional(),
});

/** Validates a SupplierConnectorCapability record shape. */
export function validateSupplierConnectorCapability(
  value: unknown,
): SupplierConnectorCapability {
  return supplierConnectorCapabilitySchema.parse(value);
}
