/** R3-01 — Financial configuration management. */

import type { FinancialFrameworkConfiguration } from "./configuration.js";
import type { FinancialModuleDefinition } from "./types.js";

export class FinancialConfigurationManager {
  mergeDefaults(
    definition: FinancialModuleDefinition,
    config: FinancialFrameworkConfiguration,
  ): FinancialModuleDefinition {
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
