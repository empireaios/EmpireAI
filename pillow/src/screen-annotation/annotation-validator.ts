/** T4-03 — Annotation output validation. */

import type { ScreenAnnotationConfiguration } from "./configuration.js";
import type {
  AnnotationDecision,
  AnnotationRunValidationReport,
  PointAndEditIntent,
  ScreenAnnotationRecord,
} from "./types.js";
import { AnnotationMetadataGenerator } from "./annotation-metadata-generator.js";
import { appendAnnotationLog } from "./annotation-logging.js";
import { ANNOTATION_METADATA_VERSION } from "./paths.js";

export class AnnotationValidator {
  private readonly metadata = new AnnotationMetadataGenerator();

  validate(
    annotation: ScreenAnnotationRecord | null,
    intent: PointAndEditIntent | null,
    config: ScreenAnnotationConfiguration,
    extras?: { appliedChanges?: boolean; approvedChanges?: boolean },
  ): AnnotationRunValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.outputValidationEnabled || !config.validationRulesEnabled) {
      return this.buildReport("pass", annotation, intent, errors, warnings, started);
    }

    if (!annotation) {
      errors.push("No annotation record produced");
      return this.buildReport("fail", annotation, intent, errors, warnings, started);
    }

    if (!annotation.annotationType) errors.push("Missing annotation type");
    if (annotation.confidenceScore < 0 || annotation.confidenceScore > 1) {
      errors.push("Confidence score out of range");
    }
    if (
      !annotation.pointerCoordinates &&
      !annotation.screenRegionBounds &&
      annotation.referencedComponentIds.length === 0
    ) {
      warnings.push("Annotation lacks pointer, bounds, and component references");
    }
    if (!intent) warnings.push("No point-and-edit intent generated");
    if (extras?.appliedChanges) {
      errors.push("Screen annotations must not apply UX changes automatically");
    }
    if (extras?.approvedChanges) {
      errors.push("Screen annotations must not approve changes automatically");
    }

    let decision: AnnotationDecision = "pass";
    if (errors.length > 0) decision = "fail";
    else if (
      warnings.length > 0 ||
      annotation.processingStatus === "awaiting_clarification" ||
      (intent?.clarificationRequirement ?? null) !== null
    ) {
      decision = "partial";
    }

    appendAnnotationLog({
      event: "validation_results",
      level: decision === "pass" ? "info" : "warn",
      details: `Validation ${decision.toUpperCase()}`,
    });

    return this.buildReport(decision, annotation, intent, errors, warnings, started);
  }

  private buildReport(
    decision: AnnotationDecision,
    annotation: ScreenAnnotationRecord | null,
    intent: PointAndEditIntent | null,
    errors: string[],
    warnings: string[],
    started: number,
  ): AnnotationRunValidationReport {
    return {
      validationReportId: this.metadata.buildValidationId(),
      validationTimestamp: new Date().toISOString(),
      decision,
      annotationsProcessed: annotation ? 1 : 0,
      intentsGenerated: intent ? 1 : 0,
      clarificationsRequested: intent?.clarificationRequirement ? 1 : 0,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: ANNOTATION_METADATA_VERSION,
    };
  }
}
