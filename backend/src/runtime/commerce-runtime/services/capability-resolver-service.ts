import { REALITY_PROVIDER_CATALOG } from "../../../orchestration/reality-integration/models/provider-catalog.js";
import type { CapabilityResolution } from "../models/capability-resolution.js";
import type { RuntimeOperation } from "../models/execution-request.js";
import { COMMERCE_RUNTIME_EXECUTION_BLOCKED } from "../contract/commerce-runtime-module.js";

const MARKETPLACE_PUBLISH_ADAPTERS = [
  "shopify",
  "amazon-seller",
  "ebay",
  "tiktok-shop",
  "walmart",
  "google-merchant",
  "facebook-shop",
];

const OPERATION_ADAPTER_RULES: Record<
  RuntimeOperation,
  { kernel: string; match: (providerId: string, capabilities: string[]) => "supported" | "partial" | "unsupported" }
> = {
  publish_product: {
    kernel: "marketplace",
    match: (providerId, capabilities) => {
      if (!MARKETPLACE_PUBLISH_ADAPTERS.includes(providerId)) return "unsupported";
      if (capabilities.includes("listing_readiness") || capabilities.includes("catalog_sync")) return "partial";
      return "unsupported";
    },
  },
  sync_inventory: {
    kernel: "supplier",
    match: (_providerId, capabilities) =>
      capabilities.includes("inventory") ? "partial" : "unsupported",
  },
  submit_supplier_order: {
    kernel: "supplier",
    match: (_providerId, capabilities) =>
      capabilities.includes("catalog") && capabilities.includes("shipping") ? "partial" : "unsupported",
  },
  capture_payment: {
    kernel: "payment",
    match: (_providerId, capabilities) =>
      capabilities.includes("webhook_registration") ? "partial" : "unsupported",
  },
  launch_campaign: {
    kernel: "advertising",
    match: (_providerId, capabilities) =>
      capabilities.includes("campaign_validation") ? "partial" : "unsupported",
  },
  create_shipment: {
    kernel: "logistics",
    match: () => "unsupported",
  },
  handle_customer_message: {
    kernel: "customer_service",
    match: () => "unsupported",
  },
  record_analytics_event: {
    kernel: "analytics",
    match: (_providerId, capabilities) =>
      capabilities.includes("available_metrics") ? "partial" : "unsupported",
  },
  dispatch_agent_task: {
    kernel: "agent",
    match: () => "partial",
  },
};

const CATEGORY_KERNEL: Record<string, string> = {
  commerce: "marketplace",
  suppliers: "supplier",
  payments: "payment",
  advertising: "advertising",
  analytics: "analytics",
  creative_ai: "agent",
  search_intelligence: "analytics",
  seo_intelligence: "analytics",
  product_intelligence: "analytics",
  buyer_intelligence: "analytics",
  trend_intelligence: "analytics",
};

export function resolveCapabilities(operation: RuntimeOperation): CapabilityResolution {
  const rule = OPERATION_ADAPTER_RULES[operation];
  const entries = REALITY_PROVIDER_CATALOG.map((provider) => {
    const kernel = CATEGORY_KERNEL[provider.category] ?? "marketplace";
    if (kernel !== rule.kernel && operation !== "dispatch_agent_task") {
      return null;
    }
    const rawLevel = rule.match(provider.providerId, provider.capabilities);
    const supportLevel: CapabilityResolution["entries"][number]["supportLevel"] =
      COMMERCE_RUNTIME_EXECUTION_BLOCKED && rawLevel !== "unsupported"
        ? "blocked"
        : rawLevel;
    return {
      adapterId: provider.providerId,
      displayName: provider.displayName,
      kernel,
      supportLevel,
      reason:
        supportLevel === "blocked"
          ? "CRT-001 execution blocked — adapter registered for planning only"
          : supportLevel === "partial"
            ? "Partial capability — live execution not enabled"
            : supportLevel === "supported"
              ? "Capability declared in catalog"
              : "Operation not supported by adapter",
    };
  }).filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  if (operation === "dispatch_agent_task") {
    entries.push({
      adapterId: "brain-agent-kernel",
      displayName: "Brain Agent Kernel",
      kernel: "agent",
      supportLevel: "blocked",
      reason: "CRT-001 execution blocked — agent dispatch planning only",
    });
  }

  const summary = {
    supported: entries.filter((e) => e.supportLevel === "supported").length,
    partial: entries.filter((e) => e.supportLevel === "partial").length,
    unsupported: entries.filter((e) => e.supportLevel === "unsupported").length,
    blocked: entries.filter((e) => e.supportLevel === "blocked").length,
  };

  return {
    operation,
    resolvedAt: new Date().toISOString(),
    entries,
    summary,
  };
}

export function resolveAllOperationCoverage(): Array<{
  operation: RuntimeOperation;
  supported: number;
  partial: number;
  blocked: number;
}> {
  const operations = Object.keys(OPERATION_ADAPTER_RULES) as RuntimeOperation[];
  return operations.map((operation) => {
    const resolution = resolveCapabilities(operation);
    return {
      operation,
      supported: resolution.summary.supported,
      partial: resolution.summary.partial,
      blocked: resolution.summary.blocked,
    };
  });
}

export function listUnsupportedRequests(): Array<{ operation: string; adapterId: string; reason: string }> {
  const operations = Object.keys(OPERATION_ADAPTER_RULES) as RuntimeOperation[];
  const unsupported: Array<{ operation: string; adapterId: string; reason: string }> = [];
  for (const operation of operations) {
    const resolution = resolveCapabilities(operation);
    for (const entry of resolution.entries) {
      if (entry.supportLevel === "unsupported") {
        unsupported.push({
          operation,
          adapterId: entry.adapterId,
          reason: entry.reason,
        });
      }
    }
  }
  return unsupported.slice(0, 20);
}
