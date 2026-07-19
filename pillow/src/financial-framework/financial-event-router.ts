/** R3-01 — Financial event router. */

import { randomUUID } from "node:crypto";
import { appendFrameworkLog } from "./ff-logging.js";
import type { FinancialModuleRegistry } from "./financial-module-registry.js";
import type { FinancialRateLimitManager } from "./financial-rate-limit-manager.js";
import type { FinancialValidationEngine } from "./financial-validation-engine.js";
import type { FinancialFrameworkConfiguration } from "./configuration.js";
import type {
  NormalizedFinancialEvent,
  RouteFinancialEventInput,
  FinancialEventResult,
} from "./types.js";

export class FinancialEventRouter {
  constructor(
    private readonly registry: FinancialModuleRegistry,
    private readonly rateLimitManager: FinancialRateLimitManager,
    private readonly validationEngine: FinancialValidationEngine,
  ) {}

  routeEvent(
    input: RouteFinancialEventInput,
    config: FinancialFrameworkConfiguration,
  ): { event: NormalizedFinancialEvent; result: FinancialEventResult; rateLimited: boolean } {
    const record = this.registry.get(input.financialModuleIdentifier);
    const validation = this.validationEngine.validateEventRouting(
      record,
      input.topic,
      config,
    );

    if (validation.decision === "fail") {
      throw new Error(validation.errors.join("; ") || "Event routing validation failed");
    }

    const eventId = `ff-evt-${randomUUID()}`;
    const event: NormalizedFinancialEvent = {
      eventId,
      financialModuleIdentifier: input.financialModuleIdentifier,
      topic: input.topic,
      payloadRef: input.payloadRef,
      routed: false,
      timestamp: new Date().toISOString(),
    };

    appendFrameworkLog({
      event: "financial_event",
      level: "info",
      details: `${input.topic} → ${input.financialModuleIdentifier}`,
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
      event: "financial_event_routed",
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
        details: `Event routed to ${input.financialModuleIdentifier}`,
      },
      rateLimited: false,
    };
  }
}
