/** R2-01 — Supplier configuration management. */

import type { SupplierFrameworkConfiguration } from "./configuration.js";
import type { SupplierConnectorDefinition } from "./types.js";

export class SupplierConfigurationManager {
  mergeDefaults(
    definition: SupplierConnectorDefinition,
    config: SupplierFrameworkConfiguration,
  ): SupplierConnectorDefinition {
    return {
      ...definition,
      apiEndpointConfig: {
        ...definition.apiEndpointConfig,
        timeoutMs: definition.apiEndpointConfig.timeoutMs || config.apiTimeoutMs,
      },
      eventRoutingConfig: {
        ...definition.eventRoutingConfig,
        maxEventsPerMinute:
          definition.eventRoutingConfig.maxEventsPerMinute || config.defaultEventsPerMinute,
        windowMs: definition.eventRoutingConfig.windowMs || config.rateLimitWindowMs,
      },
      rateLimitConfig: {
        enabled: definition.rateLimitConfig.enabled ?? config.rateLimitEnabled,
        requestsPerMinute:
          definition.rateLimitConfig.requestsPerMinute || config.defaultEventsPerMinute,
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
    };
  }
}
