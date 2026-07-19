/** R2-01 — Supplier event router. */

import { randomUUID } from "node:crypto";
import { appendFrameworkLog } from "./sf-logging.js";
import type { SupplierConnectorRegistry } from "./supplier-connector-registry.js";
import type { SupplierRateLimitManager } from "./supplier-rate-limit-manager.js";
import type { SupplierValidationEngine } from "./supplier-validation-engine.js";
import type { SupplierFrameworkConfiguration } from "./configuration.js";
import type {
  NormalizedSupplierEvent,
  RouteSupplierEventInput,
  SupplierEventResult,
} from "./types.js";

export class SupplierEventRouter {
  constructor(
    private readonly registry: SupplierConnectorRegistry,
    private readonly rateLimitManager: SupplierRateLimitManager,
    private readonly validationEngine: SupplierValidationEngine,
  ) {}

  routeEvent(
    input: RouteSupplierEventInput,
    config: SupplierFrameworkConfiguration,
  ): { event: NormalizedSupplierEvent; result: SupplierEventResult; rateLimited: boolean } {
    const record = this.registry.get(input.supplierIdentifier);
    const validation = this.validationEngine.validateEventRouting(
      record,
      input.topic,
      config,
    );

    if (validation.decision === "fail") {
      throw new Error(validation.errors.join("; ") || "Event routing validation failed");
    }

    const eventId = `sf-evt-${randomUUID()}`;
    const event: NormalizedSupplierEvent = {
      eventId,
      supplierIdentifier: input.supplierIdentifier,
      topic: input.topic,
      payloadRef: input.payloadRef,
      routed: false,
      timestamp: new Date().toISOString(),
    };

    appendFrameworkLog({
      event: "supplier_event",
      level: "info",
      details: `${input.topic} → ${input.supplierIdentifier}`,
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
      event: "supplier_event_routed",
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
        details: `Event routed to ${input.supplierIdentifier}`,
      },
      rateLimited: false,
    };
  }
}
