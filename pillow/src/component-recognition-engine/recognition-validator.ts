/** T1-03 — Recognition result validation. */

import { appendRecognitionLog } from "./recognition-logging.js";
import type { ComponentRecognitionResult } from "./types.js";

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

export class RecognitionValidator {
  validate(result: ComponentRecognitionResult): ValidationResult {
    const errors: string[] = [];

    if (!result.metadata.recognitionId) errors.push("Missing recognitionId");
    if (!result.metadata.sourceStateId) errors.push("Missing sourceStateId");
    if (!result.metadata.sessionId) errors.push("Missing sessionId");

    for (const component of result.components) {
      if (!component.componentId) errors.push("Component missing componentId");
      if (!component.componentType) errors.push(`Component ${component.componentId} missing type`);
      if (component.detectionConfidence < 0 || component.detectionConfidence > 1) {
        errors.push(`Component ${component.componentId} has invalid confidence`);
      }
      if (component.bounds.width < 0 || component.bounds.height < 0) {
        errors.push(`Component ${component.componentId} has invalid bounds`);
      }
    }

    const valid = errors.length === 0;
    appendRecognitionLog({
      event: "validation_result",
      level: valid ? "info" : "warn",
      details: valid
        ? `Recognition ${result.metadata.recognitionId} validated · ${result.components.length} components`
        : errors.join("; "),
    });

    return { valid, errors };
  }
}
