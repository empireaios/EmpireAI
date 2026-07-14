/** T2-06 — Navigation accessibility evaluation. */

import type { NavigationGraph } from "../navigation-mapping-engine/types.js";
import { AccessibilityMetadataGenerator } from "./accessibility-metadata-generator.js";
import type { AccessibilityFinding, AccessibilityStrength } from "./types.js";
import type { AccessibilityIntelligenceConfiguration } from "./configuration.js";

export class NavigationAccessibilityEvaluator {
  private readonly metadata = new AccessibilityMetadataGenerator();

  evaluate(
    navigation: NavigationGraph | null,
    config: AccessibilityIntelligenceConfiguration,
  ): { findings: AccessibilityFinding[]; strengths: AccessibilityStrength[] } {
    if (!config.navigationAccessibilityRulesEnabled) {
      return { findings: [], strengths: [] };
    }

    const findings: AccessibilityFinding[] = [];
    const strengths: AccessibilityStrength[] = [];
    const now = new Date().toISOString();

    if (!navigation) return { findings, strengths };

    const unlabeled = navigation.nodes.filter((n) => !n.label?.trim() && n.visibility === "visible");
    if (unlabeled.length > 0) {
      findings.push(
        this.metadata.enrichFinding({
          findingId: this.metadata.buildFindingId("navigation_clarity"),
          findingCategory: "navigation_clarity",
          findingDescription: `${unlabeled.length} navigation node(s) lack accessible labels`,
          severity: "warning",
          affectedComponentId: null,
          affectedLayoutRegionId: null,
          affectedNavigationNodeId: unlabeled[0]?.nodeId ?? null,
          evidenceMetadata: { unlabeledCount: unlabeled.length },
          detectionConfidence: 0.7,
          timestamp: now,
          metadataVersion: "1.0.0",
        }),
      );
    }

    const labeled = navigation.nodes.filter((n) => n.label?.trim());
    if (labeled.length >= 2) {
      strengths.push({
        strengthId: this.metadata.buildStrengthId(),
        category: "navigation_clarity",
        description: `${labeled.length} navigation nodes have accessible labels`,
        affectedComponentIds: [],
        evidenceRef: navigation.metadata.graphId,
        confidence: 0.7,
      });
    }

    const hiddenActive = navigation.nodes.filter((n) => n.active && n.visibility === "hidden");
    if (hiddenActive.length > 0) {
      findings.push(
        this.metadata.enrichFinding({
          findingId: this.metadata.buildFindingId("status_communication"),
          findingCategory: "status_communication",
          findingDescription: "Active navigation item is hidden from view",
          severity: "warning",
          affectedComponentId: null,
          affectedLayoutRegionId: null,
          affectedNavigationNodeId: hiddenActive[0]!.nodeId,
          evidenceMetadata: { nodeId: hiddenActive[0]!.nodeId },
          detectionConfidence: 0.65,
          timestamp: now,
          metadataVersion: "1.0.0",
        }),
      );
    }

    return { findings, strengths };
  }
}
