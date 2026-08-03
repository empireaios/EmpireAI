/** X4-01 — Scaling event router. */

import { randomUUID } from "node:crypto";
import { appendGefLog } from "./gef-logging.js";
import type { GlobalModuleRegistry } from "./global-module-registry.js";
import type { GlobalEventRateLimitManager } from "./global-event-rate-limit-manager.js";
import type { GlobalValidationEngine } from "./global-validation-engine.js";
import type { GlobalExpansionFrameworkConfiguration } from "./configuration.js";
import type {
  NormalizedExpansionEvent,
  ExpansionEventResult,
  RouteExpansionEventInput,
} from "./types.js";

export class GlobalEventRouter {
  constructor(
    private readonly registry: GlobalModuleRegistry,
    private readonly rateLimitManager: GlobalEventRateLimitManager,
    private readonly validationEngine: GlobalValidationEngine,
  ) {}

  routeEvent(
    input: RouteExpansionEventInput,
    config: GlobalExpansionFrameworkConfiguration,
  ): {
    event: NormalizedExpansionEvent;
    result: ExpansionEventResult;
    rateLimited: boolean;
  } {
    const record = this.registry.get(input.expansionModuleIdentifier);
    const validation = this.validationEngine.validateEventRouting(
      record,
      input.topic,
      config,
    );

    if (validation.decision === "fail") {
      throw new Error(validation.errors.join("; ") || "Event routing validation failed");
    }

    const eventId = `gef-evt-${randomUUID()}`;
    const event: NormalizedExpansionEvent = {
      eventId,
      expansionModuleIdentifier: input.expansionModuleIdentifier,
      topic: input.topic,
      payloadRef: input.payloadRef ?? `structural://expansion-event/${eventId}`,
      routed: false,
      timestamp: new Date().toISOString(),
    };

    appendGefLog({
      event: "expansion_event",
      level: "info",
      details: `${input.topic} → ${input.expansionModuleIdentifier}`,
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
    appendGefLog({
      event: "expansion_event_routed",
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
        details: `Event routed to ${input.expansionModuleIdentifier}`,
      },
      rateLimited: false,
    };
  }
}
