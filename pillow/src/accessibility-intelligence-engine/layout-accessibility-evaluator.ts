/** T2-06 — Layout accessibility evaluation. */

import type { LayoutModel } from "../layout-understanding-engine/types.js";
import type { UiStateModel } from "../ui-state-mapper/types.js";
import { AccessibilityMetadataGenerator } from "./accessibility-metadata-generator.js";
import type { AccessibilityFinding, AccessibilityStrength } from "./types.js";
import type { AccessibilityIntelligenceConfiguration } from "./configuration.js";

export class LayoutAccessibilityEvaluator {
  private readonly metadata = new AccessibilityMetadataGenerator();

  evaluate(
    layout: LayoutModel | null,
    uiState: UiStateModel | null,
    config: AccessibilityIntelligenceConfiguration,
  ): { findings: AccessibilityFinding[]; strengths: AccessibilityStrength[] } {
    if (!config.layoutAccessibilityRulesEnabled) {
      return { findings: [], strengths: [] };
    }

    const findings: AccessibilityFinding[] = [];
    const strengths: AccessibilityStrength[] = [];
    const now = new Date().toISOString();

    if (!layout && !uiState) {
      findings.push(
        this.metadata.enrichFinding({
          findingId: this.metadata.buildFindingId("semantic_structure"),
          findingCategory: "semantic_structure",
          findingDescription: "No layout or UI state available for accessibility review",
          severity: "info",
          affectedComponentId: null,
          affectedLayoutRegionId: null,
          affectedNavigationNodeId: null,
          evidenceMetadata: { reason: "missing_layout_data" },
          detectionConfidence: 1,
          timestamp: now,
          metadataVersion: "1.0.0",
        }),
      );
      return { findings, strengths };
    }

    const regions = layout?.regions ?? [];
    const hierarchy = layout?.regionHierarchy ?? uiState?.screen.hierarchy ?? [];

    if (hierarchy.length === 0 && regions.length > 1) {
      findings.push(
        this.metadata.enrichFinding({
          findingId: this.metadata.buildFindingId("semantic_structure"),
          findingCategory: "semantic_structure",
          findingDescription: "Multiple regions without defined semantic hierarchy",
          severity: "warning",
          affectedComponentId: null,
          affectedLayoutRegionId: regions[0]?.regionId ?? null,
          affectedNavigationNodeId: null,
          evidenceMetadata: { regionCount: regions.length },
          detectionConfidence: 0.65,
          timestamp: now,
          metadataVersion: "1.0.0",
        }),
      );
    } else if (hierarchy.length > 0) {
      strengths.push({
        strengthId: this.metadata.buildStrengthId(),
        category: "semantic_structure",
        description: `Layout defines ${hierarchy.length} hierarchy nodes for semantic structure`,
        affectedComponentIds: [],
        evidenceRef: layout?.metadata.layoutId ?? uiState?.metadata.stateId ?? "layout",
        confidence: 0.7,
      });
    }

    const emptyState = regions.find((r) => r.regionType === "empty_state");
    if (emptyState) {
      findings.push(
        this.metadata.enrichFinding({
          findingId: this.metadata.buildFindingId("empty_states"),
          findingCategory: "empty_states",
          findingDescription: "Empty state region detected — verify accessible messaging",
          severity: "info",
          affectedComponentId: null,
          affectedLayoutRegionId: emptyState.regionId,
          affectedNavigationNodeId: null,
          evidenceMetadata: { regionType: emptyState.regionType },
          detectionConfidence: 0.6,
          timestamp: now,
          metadataVersion: "1.0.0",
        }),
      );
    }

    const loadingState = regions.find((r) => r.regionType === "loading_state");
    if (loadingState) {
      findings.push(
        this.metadata.enrichFinding({
          findingId: this.metadata.buildFindingId("loading_states"),
          findingCategory: "loading_states",
          findingDescription: "Loading state detected — verify accessible status communication",
          severity: "info",
          affectedComponentId: null,
          affectedLayoutRegionId: loadingState.regionId,
          affectedNavigationNodeId: null,
          evidenceMetadata: { regionType: loadingState.regionType },
          detectionConfidence: 0.6,
          timestamp: now,
          metadataVersion: "1.0.0",
        }),
      );
    }

    return { findings, strengths };
  }
}
