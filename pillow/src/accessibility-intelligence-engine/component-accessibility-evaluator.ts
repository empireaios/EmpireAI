/** T2-06 — Component accessibility evaluation. */

import type { UiComponent } from "../component-recognition-engine/types.js";
import { AccessibilityMetadataGenerator } from "./accessibility-metadata-generator.js";
import type { AccessibilityFinding, AccessibilityStrength } from "./types.js";
import type { AccessibilityIntelligenceConfiguration } from "./configuration.js";

const INTERACTIVE_TYPES = new Set([
  "button",
  "link",
  "input",
  "text_field",
  "text_area",
  "dropdown",
  "checkbox",
  "radio_button",
  "toggle",
  "tab",
  "menu",
  "navigation_item",
]);

export class ComponentAccessibilityEvaluator {
  private readonly metadata = new AccessibilityMetadataGenerator();

  evaluate(
    components: UiComponent[],
    config: AccessibilityIntelligenceConfiguration,
  ): { findings: AccessibilityFinding[]; strengths: AccessibilityStrength[] } {
    if (!config.componentAccessibilityRulesEnabled) {
      return { findings: [], strengths: [] };
    }

    const findings: AccessibilityFinding[] = [];
    const strengths: AccessibilityStrength[] = [];
    const now = new Date().toISOString();

    for (const component of components) {
      if (component.visibility !== "visible") continue;

      const interactive = INTERACTIVE_TYPES.has(component.componentType);
      if (interactive && !component.label?.trim()) {
        findings.push(
          this.metadata.enrichFinding({
            findingId: this.metadata.buildFindingId("labels"),
            findingCategory: "labels",
            findingDescription: `Interactive ${component.componentType} missing accessible label`,
            severity: "warning",
            affectedComponentId: component.componentId,
            affectedLayoutRegionId: component.sourceRegionId,
            affectedNavigationNodeId: null,
            evidenceMetadata: { componentType: component.componentType },
            detectionConfidence: 0.75,
            timestamp: now,
            metadataVersion: "1.0.0",
          }),
        );
      }

      if (interactive) {
        const minDim = Math.min(component.size.width, component.size.height);
        if (minDim < config.minTouchTargetPx) {
          findings.push(
            this.metadata.enrichFinding({
              findingId: this.metadata.buildFindingId("touch_target_size"),
              findingCategory: "touch_target_size",
              findingDescription: `Touch target ${minDim}px below minimum ${config.minTouchTargetPx}px`,
              severity: "warning",
              affectedComponentId: component.componentId,
              affectedLayoutRegionId: component.sourceRegionId,
              affectedNavigationNodeId: null,
              evidenceMetadata: { width: component.size.width, height: component.size.height },
              detectionConfidence: 0.8,
              timestamp: now,
              metadataVersion: "1.0.0",
            }),
          );
        }
      }

      if (component.label?.trim() && interactive) {
        strengths.push({
          strengthId: this.metadata.buildStrengthId(),
          category: "labels",
          description: `${component.componentType} has accessible label`,
          affectedComponentIds: [component.componentId],
          evidenceRef: component.componentId,
          confidence: 0.7,
        });
      }
    }

    const labeled = components.filter((c) => c.label?.trim()).length;
    if (labeled >= 2) {
      strengths.push({
        strengthId: this.metadata.buildStrengthId(),
        category: "labels",
        description: `${labeled} components have accessible labels`,
        affectedComponentIds: components.filter((c) => c.label?.trim()).map((c) => c.componentId),
        evidenceRef: "component-set",
        confidence: 0.65,
      });
    }

    return { findings, strengths };
  }
}
