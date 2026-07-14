/** T4-03 — Generates point-and-edit intents from annotations. */

import type { AutonomousBuilderCertificationEngine } from "../autonomous-builder-certification-engine/engine.js";
import type { ScreenAnnotationConfiguration } from "./configuration.js";
import type {
  AnnotationType,
  PointAndEditIntent,
  ScreenAnnotationRecord,
} from "./types.js";
import { AnnotationMetadataGenerator } from "./annotation-metadata-generator.js";
import { appendAnnotationLog } from "./annotation-logging.js";
import { ANNOTATION_METADATA_VERSION } from "./paths.js";

const BUILDER_CAPABILITY_MAP: Record<string, string[]> = {
  edit_instruction: ["frontend_builder", "component_generator"],
  component_selection: ["component_generator", "frontend_builder"],
  layout_region_selection: ["layout_refactoring", "frontend_builder"],
  navigation_area_selection: ["layout_refactoring", "frontend_builder"],
  ux_complaint_note: ["validation_engine", "frontend_builder"],
  design_preference_note: ["theme_builder", "component_generator"],
  validation_request: ["validation_engine"],
  preview_request: ["preview_generator"],
  review_request: ["validation_engine", "frontend_builder"],
  rectangle: ["layout_refactoring", "frontend_builder"],
  region_selection: ["layout_refactoring"],
  point: ["frontend_builder"],
  highlight: ["frontend_builder"],
  text_note: ["frontend_builder"],
};

export class PointAndEditIntentGenerator {
  private readonly metadata = new AnnotationMetadataGenerator();

  generate(input: {
    annotation: ScreenAnnotationRecord;
    config: ScreenAnnotationConfiguration;
    autonomousBuilderCertification: AutonomousBuilderCertificationEngine | null;
  }): PointAndEditIntent {
    appendAnnotationLog({
      event: "point_and_edit_intent_generation",
      level: "info",
      details: `Generating intent for ${input.annotation.annotationId}`,
    });

    const type = input.annotation.annotationType;
    const caps = input.config.builderCapabilityLinkageRulesEnabled
      ? [...(BUILDER_CAPABILITY_MAP[type] ?? ["frontend_builder"])]
      : [];

    if (input.autonomousBuilderCertification) {
      try {
        void input.autonomousBuilderCertification.getState();
      } catch {
        appendAnnotationLog({
          event: "point_and_edit_intent_generation",
          level: "warn",
          details: "Builder certification status unavailable",
        });
      }
    }

    const clarification = this.evaluateClarification(input.annotation, input.config);

    return this.metadata.enrichIntent({
      pointAndEditIntentId: this.metadata.buildIntentId(),
      timestamp: new Date().toISOString(),
      sourceAnnotationId: input.annotation.annotationId,
      sourceConversationIntentId: input.annotation.linkedConversationIntentId,
      sourceVoiceCommandId: input.annotation.linkedVoiceCommandId,
      targetScreenId: input.annotation.currentScreenId,
      targetRouteOrViewId: input.annotation.currentRouteOrViewId,
      targetComponentIds: input.annotation.referencedComponentIds,
      targetLayoutRegionIds: input.annotation.referencedLayoutRegionIds,
      targetNavigationNodeIds: input.annotation.referencedNavigationNodeIds,
      requestedEditSummary: this.buildEditSummary(type, input.annotation),
      uxConcernSummary: this.buildUxConcern(type, input.annotation),
      designPreferenceSummary: this.buildDesignPreference(type, input.annotation),
      linkedUxFindings: input.annotation.linkedUxFindingIds,
      linkedBuilderCapabilities: caps,
      clarificationRequirement: clarification,
      confidenceScore: input.annotation.confidenceScore,
      metadataVersion: ANNOTATION_METADATA_VERSION,
    });
  }

  private evaluateClarification(
    annotation: ScreenAnnotationRecord,
    config: ScreenAnnotationConfiguration,
  ): string | null {
    if (!config.clarificationRulesEnabled) return null;
    if (annotation.confidenceScore < config.clarificationConfidenceThreshold) {
      return "Annotation confidence below clarification threshold";
    }
    if (
      annotation.referencedComponentIds.length === 0 &&
      annotation.referencedLayoutRegionIds.length === 0 &&
      annotation.referencedNavigationNodeIds.length === 0 &&
      !annotation.pointerCoordinates
    ) {
      return "Ambiguous screen selection — no component, region, or navigation target resolved";
    }
    return null;
  }

  private buildEditSummary(type: AnnotationType, annotation: ScreenAnnotationRecord): string {
    if (annotation.annotationText) return annotation.annotationText.slice(0, 200);
    return annotation.userInstructionSummary;
  }

  private buildUxConcern(type: AnnotationType, annotation: ScreenAnnotationRecord): string | null {
    if (type === "ux_complaint_note") {
      return annotation.annotationText ?? "UX concern noted at annotated screen area";
    }
    if (type === "review_request" || type === "validation_request") {
      return "User requested review of annotated screen area";
    }
    return null;
  }

  private buildDesignPreference(type: AnnotationType, annotation: ScreenAnnotationRecord): string | null {
    if (type === "design_preference_note") {
      return annotation.annotationText ?? "Design preference noted at annotated screen area";
    }
    return null;
  }
}
