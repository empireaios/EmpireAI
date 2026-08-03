/** X4-01 — Scaling configuration management. */

import type { GlobalExpansionFrameworkConfiguration } from "./configuration.js";
import type { ExpansionModuleDefinition } from "./types.js";

export class GlobalConfigurationManager {
  mergeDefaults(
    definition: ExpansionModuleDefinition,
    config: GlobalExpansionFrameworkConfiguration,
  ): ExpansionModuleDefinition {
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
