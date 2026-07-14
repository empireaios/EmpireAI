/** T2-07 — Spacing consistency checking. */

import type { LayoutModel } from "../layout-understanding-engine/types.js";
import type { DesignSystemModel } from "../design-system-intelligence-engine/types.js";
import type { LayoutEvaluationModel } from "../layout-evaluation-engine/types.js";
import { ConsistencyMetadataGenerator } from "./consistency-metadata-generator.js";
import { nearestSpacingToken } from "./consistency-helpers.js";
import type { ConsistencyFinding, ConsistencyStrength } from "./types.js";
import type { VisualConsistencyConfiguration } from "./configuration.js";

export class SpacingConsistencyChecker {
  private readonly metadata = new ConsistencyMetadataGenerator();

  check(
    layout: LayoutModel | null,
    designSystem: DesignSystemModel | null,
    layoutEvaluation: LayoutEvaluationModel | null,
    config: VisualConsistencyConfiguration,
  ): { findings: ConsistencyFinding[]; strengths: ConsistencyStrength[] } {
    if (!config.spacingConsistencyRulesEnabled) {
      return { findings: [], strengths: [] };
    }

    const findings: ConsistencyFinding[] = [];
    const strengths: ConsistencyStrength[] = [];
    const now = new Date().toISOString();
    const tokens = designSystem?.spacingScale ?? [];

    const spacingWeaknesses =
      layoutEvaluation?.layoutWeaknesses.filter((w) => w.category === "spacing") ?? [];
    for (const weakness of spacingWeaknesses) {
      findings.push(
        this.metadata.enrichFinding({
          findingId: this.metadata.buildFindingId("spacing"),
          findingCategory: "spacing",
          findingDescription: weakness.description,
          severity: weakness.severity,
          affectedComponentId: null,
          affectedLayoutRegionId: null,
          affectedNavigationNodeId: null,
          expectedPattern: "design system spacing scale",
          observedPattern: weakness.evidenceRef,
          evidenceMetadata: { layoutFindingId: weakness.findingId },
          detectionConfidence: weakness.confidence,
          timestamp: now,
          metadataVersion: "1.0.0",
        }),
      );
    }

    if (layout && tokens.length > 0) {
      let offScale = 0;
      for (const rel of layout.spatialRelationships) {
        if (rel.relation !== "below" && rel.relation !== "right_of" && rel.relation !== "left_of") {
          continue;
        }
        const nearest = nearestSpacingToken(rel.distance, tokens);
        if (nearest && nearest.delta > config.spacingTolerancePx) {
          offScale += 1;
        }
      }
      if (offScale >= 3) {
        findings.push(
          this.metadata.enrichFinding({
            findingId: this.metadata.buildFindingId("spacing"),
            findingCategory: "spacing",
            findingDescription: `${offScale} spatial relationships off design system spacing scale`,
            severity: "warning",
            affectedComponentId: null,
            affectedLayoutRegionId: null,
            affectedNavigationNodeId: null,
            expectedPattern: `spacing tokens within ${config.spacingTolerancePx}px`,
            observedPattern: `${offScale} off-scale distances`,
            evidenceMetadata: { offScaleCount: offScale },
            detectionConfidence: 0.6,
            timestamp: now,
            metadataVersion: "1.0.0",
          }),
        );
      } else if (layout.spatialRelationships.length > 0) {
        strengths.push({
          strengthId: this.metadata.buildStrengthId(),
          category: "spacing",
          description: "Spatial relationships align with design system spacing scale",
          affectedComponentIds: [],
          evidenceRef: layout.metadata.layoutId,
          confidence: 0.7,
        });
      }
    }

    return { findings, strengths };
  }
}
