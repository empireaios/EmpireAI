import { REALITY_PROVIDER_CATALOG } from "../../../orchestration/reality-integration/models/provider-catalog.js";
import { moduleRoutes } from "../../../agents/routes/module-routes.js";
import type { RegisteredAdapter, RuntimeRegistrySnapshot } from "../models/adapter-registry.js";
import { COMMERCE_RUNTIME_EXECUTION_BLOCKED } from "../contract/commerce-runtime-module.js";

const CATEGORY_KIND: Record<string, RegisteredAdapter["kind"]> = {
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

const LOGISTICS_ADAPTERS: RegisteredAdapter[] = [
  {
    adapterId: "cj-fulfillment",
    displayName: "CJ Fulfillment Bridge",
    kind: "logistics",
    sourceModule: "live-cj-fulfillment",
    capabilities: ["submit_order", "tracking"],
    lifecycle: "REGISTERED",
    executionBlocked: true,
  },
];

const CUSTOMER_SERVICE_ADAPTERS: RegisteredAdapter[] = [
  {
    adapterId: "marketplace-messaging",
    displayName: "Marketplace Messaging (planned)",
    kind: "customer_service",
    sourceModule: "commerce-runtime",
    capabilities: ["message_routing"],
    lifecycle: "REGISTERED",
    executionBlocked: true,
  },
];

function seedFromRealityCatalog(): RegisteredAdapter[] {
  return REALITY_PROVIDER_CATALOG.map((provider) => ({
    adapterId: provider.providerId,
    displayName: provider.displayName,
    kind: CATEGORY_KIND[provider.category] ?? "marketplace",
    sourceModule: "reality-integration",
    capabilities: [...provider.capabilities],
    lifecycle: "REGISTERED" as const,
    executionBlocked: COMMERCE_RUNTIME_EXECUTION_BLOCKED,
  }));
}

export function buildRuntimeRegistry(): RuntimeRegistrySnapshot {
  const adapters = [
    ...seedFromRealityCatalog(),
    ...LOGISTICS_ADAPTERS,
    ...CUSTOMER_SERVICE_ADAPTERS,
  ];

  const byKind: Record<string, number> = {};
  for (const adapter of adapters) {
    byKind[adapter.kind] = (byKind[adapter.kind] ?? 0) + 1;
  }

  const agentModules = new Set(
    moduleRoutes
      .filter((route) => route.toolName && !route.toolName.startsWith("commerce_runtime"))
      .map((route) => route.module),
  );

  const agents = [...agentModules].slice(0, 12).map((moduleId) => ({
    agentId: `agent-${moduleId}`,
    module: moduleId,
    authorityLevel: "L1",
  }));

  return {
    totalAdapters: adapters.length,
    byKind,
    adapters,
    agents,
  };
}

export function listRegisteredAdapters(): RegisteredAdapter[] {
  return buildRuntimeRegistry().adapters;
}
