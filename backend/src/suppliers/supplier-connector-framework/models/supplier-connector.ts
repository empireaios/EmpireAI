import { z } from "zod";

import { supplierPlatformSchema, type SupplierPlatform } from "./supplier-platform.js";

export const SUPPLIER_CONNECTOR_STATUSES = [
  "REGISTERED",
  "CONFIGURED",
  "READY",
  "PAUSED",
] as const;

export type SupplierConnectorStatus = (typeof SUPPLIER_CONNECTOR_STATUSES)[number];

export const SUPPLIER_INTEGRATION_MODES = ["STUB", "SANDBOX", "LIVE"] as const;

export type SupplierIntegrationMode = (typeof SUPPLIER_INTEGRATION_MODES)[number];

/** Supplier connector registration prepared for future live integration. */
export type SupplierConnector = {
  connectorId: string;
  platform: SupplierPlatform;
  displayName: string;
  status: SupplierConnectorStatus;
  integrationMode: SupplierIntegrationMode;
  apiBaseUrl: string;
  credentialsRequired: string[];
  documentationUrl: string;
};

export const supplierConnectorSchema = z.object({
  connectorId: z.string().min(1),
  platform: supplierPlatformSchema,
  displayName: z.string().min(1),
  status: z.enum(SUPPLIER_CONNECTOR_STATUSES),
  integrationMode: z.enum(SUPPLIER_INTEGRATION_MODES),
  apiBaseUrl: z.string().url(),
  credentialsRequired: z.array(z.string()).min(1),
  documentationUrl: z.string().url(),
});

/** Validates a SupplierConnector record shape. */
export function validateSupplierConnector(value: unknown): SupplierConnector {
  return supplierConnectorSchema.parse(value);
}
