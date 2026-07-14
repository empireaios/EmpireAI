/** T1-09 — Session continuity validation. */

import { appendContinuityLog } from "./continuity-logging.js";
import type { SessionContinuityModel } from "./types.js";

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

export class SessionValidator {
  validate(model: SessionContinuityModel): ValidationResult {
    const errors: string[] = [];

    if (!model.sessionContinuityId) errors.push("Missing sessionContinuityId");
    if (!model.sessionId) errors.push("Missing sessionId");
    if (!model.timestamp) errors.push("Missing timestamp");
    if (!model.currentUiStateId) errors.push("Missing currentUiStateId");
    if (model.continuityConfidence < 0 || model.continuityConfidence > 1) {
      errors.push("Continuity confidence out of range");
    }

    const valid = errors.length === 0;
    appendContinuityLog({
      event: "continuity_validation",
      level: valid ? "info" : "warn",
      details: valid
        ? `Continuity ${model.sessionContinuityId} validated`
        : errors.join("; "),
    });

    return { valid, errors };
  }
}
