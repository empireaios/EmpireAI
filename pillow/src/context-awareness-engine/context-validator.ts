/** T1-07 — Workflow context validation. */

import { appendContextLog } from "./context-logging.js";
import type { WorkflowContextModel } from "./types.js";

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

export class ContextValidator {
  validate(model: WorkflowContextModel): ValidationResult {
    const errors: string[] = [];

    if (!model.contextId) errors.push("Missing contextId");
    if (!model.sessionId) errors.push("Missing sessionId");
    if (!model.timestamp) errors.push("Missing timestamp");
    if (!model.contextState) errors.push("Missing contextState");
    if (!model.currentInteractionMode) errors.push("Missing interaction mode");
    if (model.confidence < 0 || model.confidence > 1) errors.push("Confidence out of range");

    const valid = errors.length === 0;
    appendContextLog({
      event: "context_validation",
      level: valid ? "info" : "warn",
      details: valid
        ? `Context ${model.contextId} validated · ${model.contextState}`
        : errors.join("; "),
    });

    return { valid, errors };
  }
}
