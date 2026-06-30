import type { ProviderCapabilityMatrix, ProviderCapabilityMatrixEntry } from "../models/provider-capability-matrix.js";
import { REALITY_PROVIDER_CATALOG, getRealityProvider } from "../models/provider-catalog.js";
import type { RealityProviderDefinition } from "../models/reality-integration.js";

const CATEGORY_PERMISSIONS: Record<string, string[]> = {
  commerce: ["catalog.read", "catalog.write", "orders.read", "inventory.read"],
  suppliers: ["catalog.read", "inventory.read", "orders.create", "tracking.read"],
  payments: ["payments.read", "payments.capture", "refunds.create", "webhooks.manage"],
  advertising: ["ads.read", "ads.create", "audiences.read", "billing.read"],
  creative_ai: ["images.generate", "copy.generate", "assets.read"],
  analytics: ["metrics.read", "properties.read", "events.read"],
  search_intelligence: ["search.read", "keywords.read"],
  seo_intelligence: ["search.read", "rankings.read"],
  product_intelligence: ["trends.read", "pricing.read"],
  buyer_intelligence: ["audiences.read", "segments.read"],
  trend_intelligence: ["trends.read", "alerts.read"],
};

const CATEGORY_OAUTH_SCOPES: Record<string, string[]> = {
  commerce: ["read_products", "write_products", "read_orders", "read_inventory"],
  suppliers: ["read_catalog", "read_inventory", "create_orders"],
  payments: ["read_charges", "write_charges", "read_refunds"],
  advertising: ["ads_read", "ads_management", "business_management"],
  analytics: ["analytics.readonly", "webmasters.readonly"],
  creative_ai: ["api.access"],
};

function buildMatrixEntry(definition: RealityProviderDefinition): ProviderCapabilityMatrixEntry {
  const isOAuth = definition.authentication === "oauth2" || definition.authentication === "oauth2_refresh";
  const isApiKey = definition.authentication === "api_key" || definition.authentication === "webhook_secret";
  const hasWebhooks = definition.capabilities.some((c) => c.includes("webhook"));

  return {
    providerId: definition.providerId,
    displayName: definition.displayName,
    category: definition.category,
    authenticationMethod: definition.authentication,
    supportsOAuth: isOAuth,
    supportsApiKey: isApiKey || definition.authentication === "oauth2",
    supportsWebhook: hasWebhooks || definition.category === "payments" || definition.category === "commerce",
    oauthScopes: isOAuth ? (CATEGORY_OAUTH_SCOPES[definition.category] ?? ["read", "write"]) : [],
    rateLimitsPerMinute: definition.rateLimitPerMinute,
    requiredPermissions: CATEGORY_PERMISSIONS[definition.category] ?? ["read"],
    requiredBusinessVerification: definition.requiredHumanActions,
    sandboxAvailable: definition.category !== "creative_ai" || definition.providerId === "stripe",
    productionRequirements: [
      ...definition.requiredHumanActions,
      ...(definition.monthlyCostCents > 0 ? [`Subscription: $${(definition.monthlyCostCents / 100).toFixed(0)}/mo`] : []),
      ...(isOAuth ? ["OAuth app registration with provider developer portal"] : []),
      ...(isApiKey ? ["API key with production permissions enabled"] : []),
    ],
    documentationUrl: definition.documentationUrl,
  };
}

/** REAL-001 — Provider Capability Matrix. */
export function buildProviderCapabilityMatrix(): ProviderCapabilityMatrix {
  return {
    providers: REALITY_PROVIDER_CATALOG.map(buildMatrixEntry),
    totalProviders: REALITY_PROVIDER_CATALOG.length,
    computedAt: new Date().toISOString(),
  };
}

export function getProviderCapabilityMatrixEntry(providerId: string): ProviderCapabilityMatrixEntry | undefined {
  const definition = getRealityProvider(providerId);
  if (!definition) return undefined;
  return buildMatrixEntry(definition);
}

export function listProvidersByAuthMethod(
  method: ProviderCapabilityMatrixEntry["authenticationMethod"],
): ProviderCapabilityMatrixEntry[] {
  return buildProviderCapabilityMatrix().providers.filter((p) => p.authenticationMethod === method);
}
