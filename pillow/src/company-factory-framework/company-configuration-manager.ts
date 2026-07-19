/** X1-01 — Marketing configuration management. */

import type { CompanyFactoryFrameworkConfiguration } from "./configuration.js";
import type { CompanyModuleDefinition } from "./types.js";

export class CompanyConfigurationManager {
  mergeDefaults(
    definition: CompanyModuleDefinition,
    config: CompanyFactoryFrameworkConfiguration,
  ): CompanyModuleDefinition {
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
