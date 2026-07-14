/** T1-06 — Interaction event validation. */

import { appendInteractionLog } from "./interaction-logging.js";
import type { InteractionEvent } from "./types.js";

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

export class InteractionValidator {
  validate(event: InteractionEvent): ValidationResult {
    const errors: string[] = [];

    if (!event.eventId) errors.push("Missing eventId");
    if (!event.sessionId) errors.push("Missing sessionId");
    if (!event.timestamp) errors.push("Missing timestamp");
    if (!event.interactionType) errors.push("Missing interactionType");
    if (event.confidence < 0 || event.confidence > 1) {
      errors.push("Confidence out of range");
    }

    if (event.previousValue?.includes("[REDACTED]") || event.newValue?.includes("[REDACTED]")) {
      if (event.inputChange && !event.inputChange.masked) {
        errors.push("Sensitive value not marked as masked");
      }
    }

    const valid = errors.length === 0;
    appendInteractionLog({
      event: "interaction_validation",
      level: valid ? "info" : "warn",
      details: valid
        ? `Event ${event.eventId} validated · ${event.interactionType}`
        : errors.join("; "),
    });

    return { valid, errors };
  }
}
