/** X3-01 — Scaling event router. */

import { randomUUID } from "node:crypto";
import { appendAsfLog } from "./asf-logging.js";
import type { ScalingModuleRegistry } from "./scaling-module-registry.js";
import type { ScalingEventRateLimitManager } from "./scaling-event-rate-limit-manager.js";
import type { ScalingValidationEngine } from "./scaling-validation-engine.js";
import type { AutonomousScalingFrameworkConfiguration } from "./configuration.js";
import type {
  NormalizedScalingEvent,
  ScalingEventResult,
  RouteScalingEventInput,
} from "./types.js";

export class ScalingEventRouter {
  constructor(
    private readonly registry: ScalingModuleRegistry,
    private readonly rateLimitManager: ScalingEventRateLimitManager,
    private readonly validationEngine: ScalingValidationEngine,
  ) {}

  routeEvent(
    input: RouteScalingEventInput,
    config: AutonomousScalingFrameworkConfiguration,
  ): {
    event: NormalizedScalingEvent;
    result: ScalingEventResult;
    rateLimited: boolean;
  } {
    const record = this.registry.get(input.scalingModuleIdentifier);
    const validation = this.validationEngine.validateEventRouting(
      record,
      input.topic,
      config,
    );

    if (validation.decision === "fail") {
      throw new Error(validation.errors.join("; ") || "Event routing validation failed");
    }

    const eventId = `asf-evt-${randomUUID()}`;
    const event: NormalizedScalingEvent = {
      eventId,
      scalingModuleIdentifier: input.scalingModuleIdentifier,
      topic: input.topic,
      payloadRef: input.payloadRef ?? `structural://scaling-event/${eventId}`,
      routed: false,
      timestamp: new Date().toISOString(),
    };

    appendAsfLog({
      event: "scaling_event",
      level: "info",
      details: `${input.topic} → ${input.scalingModuleIdentifier}`,
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
    appendAsfLog({
      event: "scaling_event_routed",
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
        details: `Event routed to ${input.scalingModuleIdentifier}`,
      },
      rateLimited: false,
    };
  }
}
