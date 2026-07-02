import type { SupplierConnectorCapabilityInput } from "../models/supplier-capabilities.js";
import type { SupplierPlatform } from "../models/supplier-platform.js";

export type SupplierAdapterTemplate = {
  connectorId: string;
  platform: SupplierPlatform;
  displayName: string;
  apiBaseUrl: string;
  documentationUrl: string;
  credentialsRequired: string[];
  capabilities: SupplierConnectorCapabilityInput[];
  syncNotes: string;
};

function baseCapabilities(
  extras: SupplierConnectorCapabilityInput[] = [],
): SupplierConnectorCapabilityInput[] {
  return [
    {
      kind: "CATALOG_SYNC",
      label: "Catalog sync",
      enabled: true,
      liveModeSupported: true,
      description: "Synchronize supplier product catalog metadata",
    },
    {
      kind: "INVENTORY_SYNC",
      label: "Inventory sync",
      enabled: true,
      liveModeSupported: true,
      description: "Synchronize stock availability signals",
    },
    {
      kind: "PRICING_SYNC",
      label: "Pricing sync",
      enabled: true,
      liveModeSupported: true,
      description: "Synchronize supplier pricing updates",
    },
    {
      kind: "SHIPPING_QUOTES",
      label: "Shipping quotes",
      enabled: true,
      liveModeSupported: true,
      description: "Estimate shipping lanes and delivery windows",
    },
    {
      kind: "ORDER_TRACKING",
      label: "Order tracking",
      enabled: true,
      liveModeSupported: true,
      description: "Track fulfillment status after orders are placed",
    },
    {
      kind: "ORDER_PLACEMENT",
      label: "Order placement",
      enabled: false,
      liveModeSupported: false,
      description: "Live order placement disabled until integration is approved",
    },
    ...extras,
  ];
}

export const CJ_DROPSHIPPING_ADAPTER: SupplierAdapterTemplate = {
  connectorId: "cj-dropshipping",
  platform: "CJ_DROPSHIPPING",
  displayName: "CJ Dropshipping",
  apiBaseUrl: "https://developers.cjdropshipping.com/api2.0/v1",
  documentationUrl: "https://developers.cjdropshipping.com/",
  credentialsRequired: ["CJ_API_KEY"],
  capabilities: baseCapabilities(),
  syncNotes: "CJ Dropshipping connector supports SANDBOX and LIVE catalog sync. No live ordering enabled.",
};

export const ALIEXPRESS_ADAPTER: SupplierAdapterTemplate = {
  connectorId: "aliexpress",
  platform: "ALIEXPRESS",
  displayName: "AliExpress",
  apiBaseUrl: "https://api-sg.aliexpress.com/sync",
  documentationUrl: "https://openservice.aliexpress.com/",
  credentialsRequired: ["ALIEXPRESS_APP_KEY", "ALIEXPRESS_APP_SECRET", "ALIEXPRESS_ACCESS_TOKEN"],
  capabilities: baseCapabilities(),
  syncNotes: "AliExpress connector prepared in stub mode. No live ordering enabled.",
};

export const ZENDROP_ADAPTER: SupplierAdapterTemplate = {
  connectorId: "zendrop",
  platform: "ZENDROP",
  displayName: "Zendrop",
  apiBaseUrl: "https://api.zendrop.com/v1",
  documentationUrl: "https://zendrop.com/developers",
  credentialsRequired: ["ZENDROP_API_KEY"],
  capabilities: baseCapabilities(),
  syncNotes: "Zendrop connector prepared in stub mode. No live ordering enabled.",
};

export const AUTODS_ADAPTER: SupplierAdapterTemplate = {
  connectorId: "autods",
  platform: "AUTODS",
  displayName: "AutoDS",
  apiBaseUrl: "https://api.autods.com/v1",
  documentationUrl: "https://www.autods.com/developers/",
  credentialsRequired: ["AUTODS_API_TOKEN", "AUTODS_STORE_ID"],
  capabilities: baseCapabilities(),
  syncNotes: "AutoDS connector prepared in stub mode. No live ordering enabled.",
};

export const SUPPLIER_ADAPTER_TEMPLATES: readonly SupplierAdapterTemplate[] = [
  CJ_DROPSHIPPING_ADAPTER,
  ALIEXPRESS_ADAPTER,
  ZENDROP_ADAPTER,
  AUTODS_ADAPTER,
] as const;

/** Resolves a supplier adapter template by platform. */
export function resolveSupplierAdapterTemplate(
  platform: SupplierPlatform,
): SupplierAdapterTemplate | null {
  return SUPPLIER_ADAPTER_TEMPLATES.find((template) => template.platform === platform) ?? null;
}

/** Resolves a supplier adapter template by connector id slug. */
export function resolveSupplierAdapterByConnectorId(
  connectorId: string,
): SupplierAdapterTemplate | null {
  const normalized = connectorId.trim().toLowerCase();
  return (
    SUPPLIER_ADAPTER_TEMPLATES.find((template) => template.connectorId === normalized) ?? null
  );
}
