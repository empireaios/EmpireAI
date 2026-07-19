/** R5-01 — Marketing event router. */

import { randomUUID } from "node:crypto";
import { appendFrameworkLog } from "./mfw-logging.js";
import type { MarketingModuleRegistry } from "./marketing-module-registry.js";
import type { MarketingRateLimitManager } from "./marketing-rate-limit-manager.js";
import type { MarketingValidationEngine } from "./marketing-validation-engine.js";
import type { MarketingFrameworkConfiguration } from "./configuration.js";
import type {
  NormalizedMarketingEvent,
  RouteMarketingEventInput,
  MarketingEventResult,
} from "./types.js";

export class MarketingEventRouter {
  constructor(
    private readonly registry: MarketingModuleRegistry,
    private readonly rateLimitManager: MarketingRateLimitManager,
    private readonly validationEngine: MarketingValidationEngine,
  ) {}

  routeEvent(
    input: RouteMarketingEventInput,
    config: MarketingFrameworkConfiguration,
  ): { event: NormalizedMarketingEvent; result: MarketingEventResult; rateLimited: boolean } {
    const record = this.registry.get(input.marketingModuleIdentifier);
    const validation = this.validationEngine.validateEventRouting(
      record,
      input.topic,
      config,
    );

    if (validation.decision === "fail") {
      throw new Error(validation.errors.join("; ") || "Event routing validation failed");
    }

    const eventId = `mfw-evt-${randomUUID()}`;
    const event: NormalizedMarketingEvent = {
      eventId,
      marketingModuleIdentifier: input.marketingModuleIdentifier,
      topic: input.topic,
      payloadRef: input.payloadRef,
      routed: false,
      timestamp: new Date().toISOString(),
    };

    appendFrameworkLog({
      event: "marketing_event",
      level: "info",
      details: `${input.topic} → ${input.marketingModuleIdentifier}`,
    });

    const rateCheck = this.rateLimitManager.check(record!);
    if (!rateCheck.allowed) {
      return {
        event,
        result: {
          eventId,
          accepted: false,
          routed: false,
          normalized: true,
          details: "Event rate limited",
        },
        rateLimited: true,
      };
    }

    event.routed = true;
    appendFrameworkLog({
      event: "marketing_event_routed",
      level: "info",
      details: `Routed ${eventId} · topic=${input.topic}`,
    });

    return {
      event,
      result: {
        eventId,
        accepted: true,
        routed: true,
        normalized: true,
        details: `Event routed to ${input.marketingModuleIdentifier}`,
      },
      rateLimited: false,
    };
  }
}
