/** X3-01 — Scaling configuration management. */

import type { AutonomousScalingFrameworkConfiguration } from "./configuration.js";
import type { ScalingModuleDefinition } from "./types.js";

export class ScalingConfigurationManager {
  mergeDefaults(
    definition: ScalingModuleDefinition,
    config: AutonomousScalingFrameworkConfiguration,
  ): ScalingModuleDefinition {
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
