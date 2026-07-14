/** R1-01 — Connector configuration management. */

import type { MarketplaceConnectorFrameworkConfiguration } from "./configuration.js";
import type { MarketplaceConnectorDefinition } from "./types.js";

export class ConnectorConfigurationManager {
  mergeDefaults(
    definition: MarketplaceConnectorDefinition,
    config: MarketplaceConnectorFrameworkConfiguration,
  ): MarketplaceConnectorDefinition {
    return {
      ...definition,
      apiEndpointConfig: {
        ...definition.apiEndpointConfig,
        timeoutMs: definition.apiEndpointConfig.timeoutMs || config.apiTimeoutMs,
      },
      rateLimitConfig: {
        enabled: definition.rateLimitConfig.enabled ?? config.rateLimitEnabled,
        requestsPerMinute:
          definition.rateLimitConfig.requestsPerMinute || config.defaultRequestsPerMinute,
        burstLimit: definition.rateLimitConfig.burstLimit || config.defaultBurstLimit,
        windowMs: definition.rateLimitConfig.windowMs || config.rateLimitWindowMs,
      },
      retryConfig: {
        enabled: definition.retryConfig.enabled ?? true,
        maxAttempts: definition.retryConfig.maxAttempts || config.maxRetryAttempts,
        delayMs: definition.retryConfig.delayMs || config.retryDelayMs,
        backoffMultiplier:
          definition.retryConfig.backoffMultiplier || config.retryBackoffMultiplier,
      },
      webhookConfig: {
        ...definition.webhookConfig,
        verifySignatures:
          definition.webhookConfig.verifySignatures ??
          config.webhookSignatureVerificationEnabled,
      },
    };
  }
}
