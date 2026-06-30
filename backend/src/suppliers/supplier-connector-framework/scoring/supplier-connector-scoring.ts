import { randomUUID } from "node:crypto";

import { resolveSupplierAdapterTemplate } from "../adapters/supplier-adapter-registry.js";
import type { SupplierAdapterTemplate } from "../adapters/supplier-adapter-registry.js";
import type { SupplierConnectorCapability } from "../models/supplier-capabilities.js";
import type { SupplierConnector } from "../models/supplier-connector.js";
import type { SupplierConnectorRecordCreateInput } from "../models/supplier-connector-record.js";
import type { SupplierHealth } from "../models/supplier-health.js";
import type { SupplierPlatform } from "../models/supplier-platform.js";
import type {
  SupplierConnectorSignal,
  SupplierConnectorSignalType,
} from "../models/supplier-connector-signal.js";
import type { SyncMetadata } from "../models/sync-metadata.js";
import { createDefaultSupplierHealth } from "../models/supplier-health.js";
import { createDefaultSyncMetadata } from "../models/sync-metadata.js";

export const SUPPLIER_CONNECTOR_SIGNAL_WEIGHTS: Record<SupplierConnectorSignalType, number> = {
  platform_readiness: 0.2,
  capability_coverage: 0.18,
  credential_readiness: 0.16,
  health_baseline: 0.14,
  sync_preparation: 0.14,
  ordering_safety: 0.12,
  connector_composite: 0.06,
};

export type PrepareSupplierConnectorInput = {
  platform: SupplierPlatform;
  credentialsConfigured?: boolean;
  integrationMode?: SupplierConnector["integrationMode"];
};

export type PrepareSupplierConnectorBreakdown = SupplierConnectorRecordCreateInput;

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function buildSignal(
  signalType: SupplierConnectorSignalType,
  score: number,
  detail: string,
): SupplierConnectorSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: SUPPLIER_CONNECTOR_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function materializeCapabilities(
  templateCapabilities: SupplierAdapterTemplate["capabilities"],
): SupplierConnectorCapability[] {
  return templateCapabilities.map((capability) => ({
    capabilityId: randomUUID(),
    kind: capability.kind,
    label: capability.label,
    enabled: capability.enabled,
    liveModeSupported: capability.liveModeSupported,
    description: capability.description,
  }));
}

function buildSupplierConnector(
  template: NonNullable<ReturnType<typeof resolveSupplierAdapterTemplate>>,
  integrationMode: SupplierConnector["integrationMode"],
  credentialsConfigured: boolean,
): SupplierConnector {
  return {
    connectorId: template.connectorId,
    platform: template.platform,
    displayName: template.displayName,
    status: credentialsConfigured ? "CONFIGURED" : "REGISTERED",
    integrationMode,
    apiBaseUrl: template.apiBaseUrl,
    credentialsRequired: [...template.credentialsRequired],
    documentationUrl: template.documentationUrl,
  };
}

function buildSupplierHealth(credentialsConfigured: boolean): SupplierHealth {
  if (credentialsConfigured) {
    return {
      healthState: "READY",
      message: "Credentials configured. Connector ready for sandbox sync preparation.",
      credentialsConfigured: true,
      apiReachable: false,
      consecutiveFailures: 0,
      lastCheckedAt: new Date().toISOString(),
    };
  }

  return createDefaultSupplierHealth();
}

function buildSyncMetadata(templateNotes: string): SyncMetadata {
  return createDefaultSyncMetadata(templateNotes);
}

function computeConfidence(
  supplierConnector: SupplierConnector,
  supplierHealth: SupplierHealth,
  supplierCapabilities: SupplierConnectorCapability[],
  syncMetadata: SyncMetadata,
  signals: SupplierConnectorSignal[],
): number {
  const enabledCapabilities = supplierCapabilities.filter((capability) => capability.enabled).length;
  const capabilityScore = clampScore((enabledCapabilities / supplierCapabilities.length) * 100);

  return clampScore(
    capabilityScore * 0.3 +
      (supplierHealth.credentialsConfigured ? 82 : 58) * 0.2 +
      (syncMetadata.syncMode === "STUB" ? 78 : 70) * 0.15 +
      (syncMetadata.orderingEnabled ? 20 : 95) * 0.15 +
      (supplierConnector.status === "CONFIGURED" ? 84 : 68) * 0.1 +
      average(signals.map((signal) => signal.score)) * 0.1,
  );
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function buildSignals(
  supplierConnector: SupplierConnector,
  supplierHealth: SupplierHealth,
  supplierCapabilities: SupplierConnectorCapability[],
  syncMetadata: SyncMetadata,
  confidence: number,
): SupplierConnectorSignal[] {
  const enabledCount = supplierCapabilities.filter((capability) => capability.enabled).length;
  const orderPlacement = supplierCapabilities.find(
    (capability) => capability.kind === "ORDER_PLACEMENT",
  );

  return [
    buildSignal(
      "platform_readiness",
      88,
      `Platform ${supplierConnector.platform} adapter template loaded`,
    ),
    buildSignal(
      "capability_coverage",
      clampScore((enabledCount / supplierCapabilities.length) * 100),
      `${enabledCount}/${supplierCapabilities.length} capabilities enabled`,
    ),
    buildSignal(
      "credential_readiness",
      supplierHealth.credentialsConfigured ? 86 : 52,
      `${supplierConnector.credentialsRequired.length} credentials required`,
    ),
    buildSignal(
      "health_baseline",
      supplierHealth.healthState === "READY" ? 84 : 62,
      `Health state ${supplierHealth.healthState}`,
    ),
    buildSignal(
      "sync_preparation",
      syncMetadata.syncMode === "STUB" ? 80 : 72,
      `Sync mode ${syncMetadata.syncMode}`,
    ),
    buildSignal(
      "ordering_safety",
      orderPlacement?.enabled ? 20 : 98,
      orderPlacement?.enabled
        ? "Live ordering capability enabled"
        : "Live ordering capability disabled",
    ),
    buildSignal("connector_composite", confidence, `Connector preparation confidence ${confidence}`),
  ];
}

/** Prepares a supplier connector profile for future live integration. */
export function prepareSupplierConnector(
  input: PrepareSupplierConnectorInput,
): PrepareSupplierConnectorBreakdown {
  const template = resolveSupplierAdapterTemplate(input.platform);
  if (!template) {
    throw new Error(`Unsupported supplier platform: ${input.platform}`);
  }

  const credentialsConfigured = input.credentialsConfigured ?? false;
  const integrationMode =
    input.platform === "CJ_DROPSHIPPING"
      ? (input.integrationMode ?? "SANDBOX")
      : (input.integrationMode ?? "STUB");
  const supplierConnector = buildSupplierConnector(
    template,
    integrationMode,
    credentialsConfigured,
  );
  const supplierHealth = buildSupplierHealth(credentialsConfigured);
  const supplierCapabilities = materializeCapabilities(template.capabilities);
  const syncMetadata = buildSyncMetadata(template.syncNotes);

  const provisionalSignals = buildSignals(
    supplierConnector,
    supplierHealth,
    supplierCapabilities,
    syncMetadata,
    0,
  );
  const confidence = computeConfidence(
    supplierConnector,
    supplierHealth,
    supplierCapabilities,
    syncMetadata,
    provisionalSignals,
  );
  const signals = buildSignals(
    supplierConnector,
    supplierHealth,
    supplierCapabilities,
    syncMetadata,
    confidence,
  );

  return {
    supplierConnector,
    supplierHealth,
    supplierCapabilities,
    syncMetadata,
    confidence,
    signals,
  };
}

/** Prepares all supported supplier connector profiles. */
export function prepareAllSupplierConnectors(
  options: { credentialsConfigured?: boolean } = {},
): PrepareSupplierConnectorBreakdown[] {
  return (
    [
      "CJ_DROPSHIPPING",
      "ALIEXPRESS",
      "ZENDROP",
      "AUTODS",
    ] as const
  ).map((platform) =>
    prepareSupplierConnector({
      platform,
      credentialsConfigured: options.credentialsConfigured,
    }),
  );
}

export const supplierConnectorScoring = {
  prepareSupplierConnector,
  prepareAllSupplierConnectors,
  weights: SUPPLIER_CONNECTOR_SIGNAL_WEIGHTS,
};
