/** T5-01 — Observation record validation. */

import { randomUUID } from "node:crypto";
import { OBSERVATION_METADATA_VERSION } from "./paths.js";
import type { ContinuousScreenObservationConfiguration } from "./configuration.js";
import type { ObservationRecord, ObservationValidationReport } from "./types.js";

export class ObservationValidator {
  validate(
    observation: ObservationRecord,
    config: ContinuousScreenObservationConfiguration,
  ): ObservationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!observation.observationId) errors.push("Missing observation ID");
    if (!observation.sessionId) errors.push("Missing session ID");
    if (observation.observeOnly !== true) {
      errors.push("Observation must remain observe-only");
    }
    if (observation.confidenceScore < config.confidenceThreshold) {
      warnings.push(
        `Confidence ${observation.confidenceScore.toFixed(2)} below threshold ${config.confidenceThreshold}`,
      );
    }
    if (
      !observation.currentScreenId &&
      !observation.currentRouteOrViewId &&
      !observation.sourceUiStateId
    ) {
      warnings.push("Limited UI identifiers available for this observation");
    }

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: randomUUID(),
      validationTimestamp: new Date().toISOString(),
      decision,
      observationsValidated: 1,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: OBSERVATION_METADATA_VERSION,
    };
  }
}
