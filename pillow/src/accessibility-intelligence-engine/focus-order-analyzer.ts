/** T2-06 — Focus order analysis. */

import type { InteractionEvent } from "../interaction-tracking-engine/types.js";
import type { UiComponent } from "../component-recognition-engine/types.js";
import { AccessibilityMetadataGenerator } from "./accessibility-metadata-generator.js";
import type { AccessibilityFinding } from "./types.js";
import type { AccessibilityIntelligenceConfiguration } from "./configuration.js";

export class FocusOrderAnalyzer {
  private readonly metadata = new AccessibilityMetadataGenerator();

  analyze(
    events: InteractionEvent[],
    components: UiComponent[],
    config: AccessibilityIntelligenceConfiguration,
  ): AccessibilityFinding[] {
    if (!config.focusOrderRulesEnabled) return [];

    const findings: AccessibilityFinding[] = [];
    const now = new Date().toISOString();
    const focusEvents = events.filter(
      (e) => e.interactionType === "focus" || e.interactionType === "blur",
    );

    if (focusEvents.length === 0 && components.some((c) => c.componentType === "text_field")) {
      findings.push(
        this.metadata.enrichFinding({
          findingId: this.metadata.buildFindingId("focus_order"),
          findingCategory: "focus_order",
          findingDescription: "Form fields present without recorded focus events",
          severity: "info",
          affectedComponentId: null,
          affectedLayoutRegionId: null,
          affectedNavigationNodeId: null,
          evidenceMetadata: { reason: "no_focus_events" },
          detectionConfidence: 0.5,
          timestamp: now,
          metadataVersion: "1.0.0",
        }),
      );
      return findings;
    }

    const focusSequence = events
      .filter((e) => e.interactionType === "focus" && e.sourceComponentId)
      .map((e) => e.sourceComponentId!);

    if (focusSequence.length >= 3) {
      const componentPositions = new Map(
        components.map((c) => [c.componentId, c.position.y]),
      );
      let outOfOrder = 0;
      for (let i = 1; i < focusSequence.length; i++) {
        const prevY = componentPositions.get(focusSequence[i - 1]!) ?? 0;
        const currY = componentPositions.get(focusSequence[i]!) ?? 0;
        if (currY < prevY - 50) outOfOrder += 1;
      }
      if (outOfOrder >= 2) {
        findings.push(
          this.metadata.enrichFinding({
            findingId: this.metadata.buildFindingId("focus_order"),
            findingCategory: "focus_order",
            findingDescription: "Focus order may not follow visual layout (backward jumps detected)",
            severity: "warning",
            affectedComponentId: focusSequence[0] ?? null,
            affectedLayoutRegionId: null,
            affectedNavigationNodeId: null,
            evidenceMetadata: { outOfOrderCount: outOfOrder, focusSteps: focusSequence.length },
            detectionConfidence: 0.6,
            timestamp: now,
            metadataVersion: "1.0.0",
          }),
        );
      }
    }

    return findings;
  }
}
