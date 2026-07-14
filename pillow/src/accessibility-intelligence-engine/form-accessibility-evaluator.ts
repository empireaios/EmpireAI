/** T2-06 — Form accessibility evaluation. */

import type { UiComponent } from "../component-recognition-engine/types.js";
import type { InteractionEvent } from "../interaction-tracking-engine/types.js";
import type { WorkflowContextModel } from "../context-awareness-engine/types.js";
import { AccessibilityMetadataGenerator } from "./accessibility-metadata-generator.js";
import type { AccessibilityFinding, AccessibilityStrength } from "./types.js";
import type { AccessibilityIntelligenceConfiguration } from "./configuration.js";

const FORM_TYPES = new Set([
  "form",
  "text_field",
  "text_area",
  "dropdown",
  "checkbox",
  "radio_button",
]);

export class FormAccessibilityEvaluator {
  private readonly metadata = new AccessibilityMetadataGenerator();

  evaluate(
    components: UiComponent[],
    events: InteractionEvent[],
    context: WorkflowContextModel | null,
    config: AccessibilityIntelligenceConfiguration,
  ): { findings: AccessibilityFinding[]; strengths: AccessibilityStrength[] } {
    if (!config.formAccessibilityRulesEnabled) {
      return { findings: [], strengths: [] };
    }

    const findings: AccessibilityFinding[] = [];
    const strengths: AccessibilityStrength[] = [];
    const now = new Date().toISOString();

    const formComponents = components.filter((c) => FORM_TYPES.has(c.componentType));
    if (formComponents.length === 0 && (context?.activeFormIds.length ?? 0) === 0) {
      return { findings, strengths };
    }

    const unlabeledFields = formComponents.filter((c) => !c.label?.trim());
    if (unlabeledFields.length > 0) {
      findings.push(
        this.metadata.enrichFinding({
          findingId: this.metadata.buildFindingId("form_accessibility"),
          findingCategory: "form_accessibility",
          findingDescription: `${unlabeledFields.length} form field(s) missing labels`,
          severity: "warning",
          affectedComponentId: unlabeledFields[0]!.componentId,
          affectedLayoutRegionId: unlabeledFields[0]!.sourceRegionId,
          affectedNavigationNodeId: null,
          evidenceMetadata: { unlabeledCount: unlabeledFields.length },
          detectionConfidence: 0.75,
          timestamp: now,
          metadataVersion: "1.0.0",
        }),
      );
    }

    if (context?.contextState === "error_handling" && formComponents.length > 0) {
      findings.push(
        this.metadata.enrichFinding({
          findingId: this.metadata.buildFindingId("error_messages"),
          findingCategory: "error_messages",
          findingDescription: "Form workflow in error state — verify accessible error messaging",
          severity: "error",
          affectedComponentId: formComponents[0]?.componentId ?? null,
          affectedLayoutRegionId: formComponents[0]?.sourceRegionId ?? null,
          affectedNavigationNodeId: null,
          evidenceMetadata: { contextState: context.contextState },
          detectionConfidence: 0.8,
          timestamp: now,
          metadataVersion: "1.0.0",
        }),
      );
    }

    const formChanges = events.filter((e) => e.interactionType === "form_change");
    if (formComponents.length > 0 && formChanges.length === 0) {
      findings.push(
        this.metadata.enrichFinding({
          findingId: this.metadata.buildFindingId("feedback_states"),
          findingCategory: "feedback_states",
          findingDescription: "Form fields present without recorded change feedback",
          severity: "info",
          affectedComponentId: formComponents[0]?.componentId ?? null,
          affectedLayoutRegionId: null,
          affectedNavigationNodeId: null,
          evidenceMetadata: { formFieldCount: formComponents.length },
          detectionConfidence: 0.5,
          timestamp: now,
          metadataVersion: "1.0.0",
        }),
      );
    }

    const labeledFields = formComponents.filter((c) => c.label?.trim());
    if (labeledFields.length >= 2) {
      strengths.push({
        strengthId: this.metadata.buildStrengthId(),
        category: "form_accessibility",
        description: `${labeledFields.length} form fields have accessible labels`,
        affectedComponentIds: labeledFields.map((c) => c.componentId),
        evidenceRef: "form-components",
        confidence: 0.7,
      });
    }

    return { findings, strengths };
  }
}
