/** T2-07 — Form consistency checking. */

import type { UiComponent } from "../component-recognition-engine/types.js";
import { ConsistencyMetadataGenerator } from "./consistency-metadata-generator.js";
import type { ConsistencyFinding, ConsistencyStrength } from "./types.js";
import type { VisualConsistencyConfiguration } from "./configuration.js";

const FORM_TYPES = new Set([
  "text_field",
  "text_area",
  "dropdown",
  "checkbox",
  "radio_button",
  "toggle",
  "input",
]);

export class FormConsistencyChecker {
  private readonly metadata = new ConsistencyMetadataGenerator();

  check(
    components: UiComponent[],
    config: VisualConsistencyConfiguration,
  ): { findings: ConsistencyFinding[]; strengths: ConsistencyStrength[] } {
    if (!config.componentConsistencyRulesEnabled) {
      return { findings: [], strengths: [] };
    }

    const findings: ConsistencyFinding[] = [];
    const strengths: ConsistencyStrength[] = [];
    const now = new Date().toISOString();
    const formFields = components.filter(
      (c) => c.visibility === "visible" && FORM_TYPES.has(c.componentType),
    );
    if (formFields.length === 0) return { findings, strengths };

    const heights = formFields.map((f) => f.size.height);
    const heightSpread = Math.max(...heights) - Math.min(...heights);
    if (heightSpread > config.sizingTolerancePx * 2) {
      findings.push(
        this.metadata.enrichFinding({
          findingId: this.metadata.buildFindingId("forms"),
          findingCategory: "forms",
          findingDescription: `Inconsistent form field heights (spread ${heightSpread}px)`,
          severity: "warning",
          affectedComponentId: formFields[0]!.componentId,
          affectedLayoutRegionId: formFields[0]!.sourceRegionId,
          affectedNavigationNodeId: null,
          expectedPattern: "uniform form field height",
          observedPattern: `height spread ${heightSpread}px`,
          evidenceMetadata: { fieldCount: formFields.length, heightSpread },
          detectionConfidence: 0.7,
          timestamp: now,
          metadataVersion: "1.0.0",
        }),
      );
    } else {
      strengths.push({
        strengthId: this.metadata.buildStrengthId(),
        category: "forms",
        description: `Consistent form field sizing across ${formFields.length} fields`,
        affectedComponentIds: formFields.map((f) => f.componentId),
        evidenceRef: "form-sizing-check",
        confidence: 0.75,
      });
    }

    const unlabeled = formFields.filter((f) => !f.label?.trim());
    if (unlabeled.length > 0) {
      findings.push(
        this.metadata.enrichFinding({
          findingId: this.metadata.buildFindingId("forms"),
          findingCategory: "forms",
          findingDescription: `${unlabeled.length} form fields missing labels — affects visual form pattern consistency`,
          severity: "info",
          affectedComponentId: unlabeled[0]!.componentId,
          affectedLayoutRegionId: unlabeled[0]!.sourceRegionId,
          affectedNavigationNodeId: null,
          expectedPattern: "labeled form fields",
          observedPattern: `${unlabeled.length} unlabeled`,
          evidenceMetadata: { unlabeledCount: unlabeled.length },
          detectionConfidence: 0.6,
          timestamp: now,
          metadataVersion: "1.0.0",
        }),
      );
    }

    return { findings, strengths };
  }
}
