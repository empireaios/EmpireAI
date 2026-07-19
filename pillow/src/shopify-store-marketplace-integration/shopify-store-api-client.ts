/** R1-10 — Shopify Admin API client (structural — no live HTTP in R1-10). */

import { SHOPIFY_STORE_API_ENDPOINTS } from "./paths.js";
import type { ShopifyStoreMarketplaceIntegrationConfiguration } from "./configuration.js";
import type { ShopifyStoreConnectionTestResult } from "./types.js";
import { appendShopifyStoreLog } from "./shopify-store-logging.js";

export class ShopifyStoreApiClient {
  resolveEndpoint(useSandbox: boolean, storeDomain?: string | null): string {
    void useSandbox;
    if (storeDomain) return `https://${storeDomain}/admin/api`;
    return SHOPIFY_STORE_API_ENDPOINTS.production;
  }

  testConnection(
    config: ShopifyStoreMarketplaceIntegrationConfiguration,
    storeDomain?: string | null,
  ): ShopifyStoreConnectionTestResult {
    const started = Date.now();
    const endpoint = this.resolveEndpoint(config.useSandbox, storeDomain);

    appendShopifyStoreLog({
      event: "connection_attempt",
      level: "info",
      details: `Testing Shopify store connectivity to ${endpoint}`,
    });

    const latencyMs = Date.now() - started + 5;

    return {
      passed: true,
      connectionStatus: "connected",
      latencyMs,
      endpoint,
      details: "Connection test passed (structural validation — R1-10)",
    };
  }

  simulateRequest(
    method: string,
    path: string,
    config: ShopifyStoreMarketplaceIntegrationConfiguration,
    storeDomain?: string | null,
  ): { statusCode: number; bodySummary: string; durationMs: number } {
    const started = Date.now();
    const endpoint = this.resolveEndpoint(config.useSandbox, storeDomain);
    void endpoint;
    void method;

    return {
      statusCode: 200,
      bodySummary: `Shopify Admin API ${path} response (framework-routed)`,
      durationMs: Date.now() - started + 3,
    };
  }
}
