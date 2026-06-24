import { z } from "zod";

import {
  connectorCapabilitySchema,
  type ConnectorCapability,
  type ConnectorCapabilityInput,
} from "./connector-capability.js";
import {
  connectorHealthSchema,
  createDefaultConnectorHealth,
  type ConnectorHealth,
} from "./connector-health.js";

export const CONNECTOR_TYPES = [
  "MARKETPLACE",
  "SEARCH_TRENDS",
  "SOCIAL",
  "SUPPLIER",
  "ECOMMERCE",
  "VIDEO",
] as const;

export type ConnectorType = (typeof CONNECTOR_TYPES)[number];

export const CONNECTOR_STATUSES = [
  "REGISTERED",
  "ACTIVE",
  "DEGRADED",
  "PAUSED",
  "DISABLED",
] as const;

export type ConnectorStatus = (typeof CONNECTOR_STATUSES)[number];

/** Registry record for an external Eye intelligence connector. */
export type EyeConnector = {
  connectorId: string;
  connectorName: string;
  connectorType: ConnectorType;
  status: ConnectorStatus;
  health: ConnectorHealth;
  lastSync: string | null;
  capabilities: ConnectorCapability[];
  createdAt: string;
  updatedAt: string;
};

export type EyeConnectorCreateInput = {
  connectorId: string;
  connectorName: string;
  connectorType: ConnectorType;
  status?: ConnectorStatus;
  health?: ConnectorHealth;
  lastSync?: string | null;
  capabilities?: ConnectorCapabilityInput[];
};

export type EyeConnectorUpdateInput = Partial<
  Omit<EyeConnectorCreateInput, "connectorId">
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const eyeConnectorSchema = z.object({
  connectorId: z.string().min(1),
  connectorName: z.string().min(1),
  connectorType: z.enum(CONNECTOR_TYPES),
  status: z.enum(CONNECTOR_STATUSES),
  health: connectorHealthSchema,
  lastSync: isoTimestamp.nullable(),
  capabilities: z.array(connectorCapabilitySchema),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates an EyeConnector registry record shape. */
export function validateEyeConnector(value: unknown): EyeConnector {
  return eyeConnectorSchema.parse(value);
}

/** Canonical connector templates for known external intelligence sources. */
export const KNOWN_CONNECTOR_TEMPLATES: readonly EyeConnectorCreateInput[] = [
  {
    connectorId: "amazon",
    connectorName: "Amazon",
    connectorType: "MARKETPLACE",
    capabilities: [
      { kind: "PRODUCT_OBSERVATION", label: "Product rankings", enabled: true },
      { kind: "TREND_OBSERVATION", label: "Category momentum", enabled: true },
    ],
  },
  {
    connectorId: "google-trends",
    connectorName: "Google Trends",
    connectorType: "SEARCH_TRENDS",
    capabilities: [
      { kind: "SEARCH_ANALYTICS", label: "Search interest", enabled: true },
      { kind: "TREND_OBSERVATION", label: "Query momentum", enabled: true },
    ],
  },
  {
    connectorId: "tiktok",
    connectorName: "TikTok",
    connectorType: "SOCIAL",
    capabilities: [
      { kind: "SOCIAL_LISTENING", label: "Viral product signals", enabled: true },
      { kind: "VIDEO_ANALYTICS", label: "Engagement trends", enabled: true },
    ],
  },
  {
    connectorId: "pinterest",
    connectorName: "Pinterest",
    connectorType: "SOCIAL",
    capabilities: [
      { kind: "SOCIAL_LISTENING", label: "Pin discovery", enabled: true },
      { kind: "TREND_OBSERVATION", label: "Visual trend signals", enabled: true },
    ],
  },
  {
    connectorId: "reddit",
    connectorName: "Reddit",
    connectorType: "SOCIAL",
    capabilities: [
      { kind: "SOCIAL_LISTENING", label: "Community discussion", enabled: true },
      { kind: "PRODUCT_OBSERVATION", label: "Product mentions", enabled: true },
    ],
  },
  {
    connectorId: "cj-dropshipping",
    connectorName: "CJ Dropshipping",
    connectorType: "SUPPLIER",
    capabilities: [
      { kind: "SUPPLIER_OBSERVATION", label: "Catalog availability", enabled: true },
      { kind: "PRODUCT_OBSERVATION", label: "Supplier product data", enabled: true },
    ],
  },
  {
    connectorId: "shopify",
    connectorName: "Shopify",
    connectorType: "ECOMMERCE",
    capabilities: [
      { kind: "PRODUCT_OBSERVATION", label: "Store catalog sync", enabled: true },
      { kind: "WEBHOOK_INGEST", label: "Order and inventory webhooks", enabled: true },
    ],
  },
  {
    connectorId: "youtube",
    connectorName: "YouTube",
    connectorType: "VIDEO",
    capabilities: [
      { kind: "VIDEO_ANALYTICS", label: "Review and unboxing signals", enabled: true },
      { kind: "TREND_OBSERVATION", label: "Creator momentum", enabled: true },
    ],
  },
] as const;

/** Builds a create input with default health and status for a known connector id. */
export function resolveKnownConnectorTemplate(connectorId: string): EyeConnectorCreateInput | null {
  const template = KNOWN_CONNECTOR_TEMPLATES.find((entry) => entry.connectorId === connectorId);
  if (!template) {
    return null;
  }
  return {
    ...template,
    status: template.status ?? "REGISTERED",
    health: template.health ?? createDefaultConnectorHealth(),
    lastSync: template.lastSync ?? null,
    capabilities: template.capabilities?.map((capability) => ({ ...capability })) ?? [],
  };
}
