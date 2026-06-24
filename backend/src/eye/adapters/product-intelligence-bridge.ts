import { randomUUID } from "node:crypto";
import type { ProductIntelligenceConnector } from "../../intelligence/connectors/types.js";
import type { EyeConnector } from "../contract/eye-connector.js";
import type { EyeConnectorContext, EyeConnectorHealth, EyeObserveRequest } from "../types.js";

/** Wraps M012 ProductIntelligenceConnector as EyeConnector — no changes to source module. */
export function wrapProductIntelligenceConnector(
  legacy: ProductIntelligenceConnector,
): EyeConnector {
  return {
    definition: {
      providerId: legacy.providerId,
      providerName: legacy.providerName,
      supportedDomains: ["product", "supplier", "trend"],
      observationMode: "poll",
      defaultPollIntervalSec: 3600,
      rateLimitPerMinute: 30,
    },

    async connect(_context: EyeConnectorContext, _credentialsRef: string): Promise<void> {
      /* no-op for legacy mock connectors */
    },

    async disconnect(_context: EyeConnectorContext): Promise<void> {
      /* no-op */
    },

    async healthCheck(_context: EyeConnectorContext): Promise<EyeConnectorHealth> {
      return {
        status: "active",
        healthState: "healthy",
        message: "Legacy ProductIntelligenceConnector adapter",
        checkedAt: new Date().toISOString(),
      };
    },

    async observe(context: EyeConnectorContext, request: EyeObserveRequest) {
      if (request.domain !== "product") return [];

      const query = request.query as {
        productTitle?: string;
        category?: string;
        sku?: string;
      };
      const signal = await legacy.fetchProductSignals(context, {
        productTitle: String(query.productTitle ?? "Unknown"),
        category: String(query.category ?? "General"),
        sku: query.sku,
      });

      return [
        {
          observationId: randomUUID(),
          providerId: legacy.providerId,
          domain: "product",
          payload: signal as unknown as Record<string, unknown>,
          fetchedAt: signal.fetchedAt,
          mock: signal.mock,
          sourceRef: `legacy://${legacy.providerId}/fetchProductSignals`,
        },
      ];
    },
  };
}
