/** T2-06 — Keyboard navigation analysis. */

import type { InteractionEvent } from "../interaction-tracking-engine/types.js";
import type { NavigationGraph } from "../navigation-mapping-engine/types.js";
import { AccessibilityMetadataGenerator } from "./accessibility-metadata-generator.js";
import type { AccessibilityFinding, AccessibilityStrength } from "./types.js";
import type { AccessibilityIntelligenceConfiguration } from "./configuration.js";

export class KeyboardNavigationAnalyzer {
  private readonly metadata = new AccessibilityMetadataGenerator();

  analyze(
    events: InteractionEvent[],
    navigation: NavigationGraph | null,
    config: AccessibilityIntelligenceConfiguration,
  ): { findings: AccessibilityFinding[]; strengths: AccessibilityStrength[] } {
    if (!config.keyboardNavigationRulesEnabled) {
      return { findings: [], strengths: [] };
    }

    const findings: AccessibilityFinding[] = [];
    const strengths: AccessibilityStrength[] = [];
    const now = new Date().toISOString();

    const keyboardEvents = events.filter(
      (e) =>
        e.interactionType === "keyboard_input" ||
        e.interactionType === "keyboard_shortcut",
    );
    const clickOnly = events.filter((e) => e.interactionType === "click").length;
    const navTriggers = events.filter((e) => e.interactionType === "navigation_trigger").length;

    if (clickOnly > 5 && keyboardEvents.length === 0 && navTriggers > 0) {
      findings.push(
        this.metadata.enrichFinding({
          findingId: this.metadata.buildFindingId("keyboard_navigation"),
          findingCategory: "keyboard_navigation",
          findingDescription: "Navigation-heavy workflow with no keyboard interaction detected",
          severity: "warning",
          affectedComponentId: null,
          affectedLayoutRegionId: null,
          affectedNavigationNodeId: navigation?.metadata.currentScreenId ?? null,
          evidenceMetadata: { clickCount: clickOnly, keyboardCount: 0 },
          detectionConfidence: 0.55,
          timestamp: now,
          metadataVersion: "1.0.0",
        }),
      );
    }

    if (keyboardEvents.length > 0) {
      strengths.push({
        strengthId: this.metadata.buildStrengthId(),
        category: "keyboard_navigation",
        description: `${keyboardEvents.length} keyboard interactions recorded`,
        affectedComponentIds: keyboardEvents
          .map((e) => e.sourceComponentId)
          .filter((c): c is string => !!c),
        evidenceRef: "keyboard-events",
        confidence: 0.7,
      });
    }

    return { findings, strengths };
  }
}
