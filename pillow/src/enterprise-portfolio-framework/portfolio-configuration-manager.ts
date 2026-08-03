/** X2-01 — Portfolio configuration management. */

import type { EnterprisePortfolioFrameworkConfiguration } from "./configuration.js";
import type { PortfolioModuleDefinition } from "./types.js";

export class PortfolioConfigurationManager {
  mergeDefaults(
    definition: PortfolioModuleDefinition,
    config: EnterprisePortfolioFrameworkConfiguration,
  ): PortfolioModuleDefinition {
    return {
      ...definition,
      eventRoutingConfig: {
        ...definition.eventRoutingConfig,
        maxEventsPerMinute:
          definition.eventRoutingConfig.maxEventsPerMinute || config.defaultEventsPerMinute,
        windowMs: definition.eventRoutingConfig.windowMs || 60000,
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
