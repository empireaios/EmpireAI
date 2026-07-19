/** X1-01 — Marketing event router. */

import { randomUUID } from "node:crypto";
import { appendFrameworkLog } from "./cff-logging.js";
import type { CompanyModuleRegistry } from "./company-module-registry.js";
import type { CompanyRateLimitManager } from "./company-rate-limit-manager.js";
import type { CompanyValidationEngine } from "./company-validation-engine.js";
import type { CompanyFactoryFrameworkConfiguration } from "./configuration.js";
import type {
  NormalizedCompanyEvent,
  RouteCompanyEventInput,
  CompanyEventResult,
} from "./types.js";

export class CompanyEventRouter {
  constructor(
    private readonly registry: CompanyModuleRegistry,
    private readonly rateLimitManager: CompanyRateLimitManager,
    private readonly validationEngine: CompanyValidationEngine,
  ) {}

  routeEvent(
    input: RouteCompanyEventInput,
    config: CompanyFactoryFrameworkConfiguration,
  ): { event: NormalizedCompanyEvent; result: CompanyEventResult; rateLimited: boolean } {
    const record = this.registry.get(input.companyModuleIdentifier);
    const validation = this.validationEngine.validateEventRouting(
      record,
      input.topic,
      config,
    );

    if (validation.decision === "fail") {
      throw new Error(validation.errors.join("; ") || "Event routing validation failed");
    }

    const eventId = `cff-evt-${randomUUID()}`;
    const event: NormalizedCompanyEvent = {
      eventId,
      companyModuleIdentifier: input.companyModuleIdentifier,
      topic: input.topic,
      payloadRef: input.payloadRef,
      routed: false,
      timestamp: new Date().toISOString(),
    };

    appendFrameworkLog({
      event: "framework_event",
      level: "info",
      details: `${input.topic} → ${input.companyModuleIdentifier}`,
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
      event: "framework_event_routed",
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
        details: `Event routed to ${input.companyModuleIdentifier}`,
      },
      rateLimited: false,
    };
  }
}
