/** X2-01 — Enterprise portfolio event router. */

import { randomUUID } from "node:crypto";
import { appendEpfLog } from "./epf-logging.js";
import type { PortfolioModuleRegistry } from "./portfolio-module-registry.js";
import type { PortfolioEventRateLimitManager } from "./portfolio-event-rate-limit-manager.js";
import type { PortfolioValidationEngine } from "./portfolio-validation-engine.js";
import type { EnterprisePortfolioFrameworkConfiguration } from "./configuration.js";
import type {
  NormalizedPortfolioEvent,
  PortfolioEventResult,
  RoutePortfolioEventInput,
} from "./types.js";

export class EnterpriseEventRouter {
  constructor(
    private readonly registry: PortfolioModuleRegistry,
    private readonly rateLimitManager: PortfolioEventRateLimitManager,
    private readonly validationEngine: PortfolioValidationEngine,
  ) {}

  routeEvent(
    input: RoutePortfolioEventInput,
    config: EnterprisePortfolioFrameworkConfiguration,
  ): {
    event: NormalizedPortfolioEvent;
    result: PortfolioEventResult;
    rateLimited: boolean;
  } {
    const record = this.registry.get(input.portfolioModuleIdentifier);
    const validation = this.validationEngine.validateEventRouting(
      record,
      input.topic,
      config,
    );

    if (validation.decision === "fail") {
      throw new Error(validation.errors.join("; ") || "Event routing validation failed");
    }

    if (
      input.companyReference &&
      record &&
      !record.registeredCompanies.includes(input.companyReference)
    ) {
      throw new Error(
        `Company ${input.companyReference} is not registered under ${input.portfolioModuleIdentifier}`,
      );
    }

    const eventId = `epf-evt-${randomUUID()}`;
    const event: NormalizedPortfolioEvent = {
      eventId,
      portfolioModuleIdentifier: input.portfolioModuleIdentifier,
      companyReference: input.companyReference ?? null,
      topic: input.topic,
      payloadRef: input.payloadRef ?? `structural://portfolio-event/${eventId}`,
      routed: false,
      timestamp: new Date().toISOString(),
    };

    appendEpfLog({
      event: "portfolio_event",
      level: "info",
      details: `${input.topic} → ${input.portfolioModuleIdentifier}`,
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
    appendEpfLog({
      event: "portfolio_event_routed",
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
        details: `Event routed to ${input.portfolioModuleIdentifier}`,
      },
      rateLimited: false,
    };
  }
}
