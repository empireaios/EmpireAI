/** T2-07 — Layout consistency checking. */

import type { LayoutModel } from "../layout-understanding-engine/types.js";
import type { DesignSystemModel } from "../design-system-intelligence-engine/types.js";
import type { LayoutEvaluationModel } from "../layout-evaluation-engine/types.js";
import { ConsistencyMetadataGenerator } from "./consistency-metadata-generator.js";
import type { ConsistencyFinding, ConsistencyStrength } from "./types.js";
import type { VisualConsistencyConfiguration } from "./configuration.js";

export class LayoutConsistencyChecker {
  private readonly metadata = new ConsistencyMetadataGenerator();

  check(
    layout: LayoutModel | null,
    designSystem: DesignSystemModel | null,
    layoutEvaluation: LayoutEvaluationModel | null,
    config: VisualConsistencyConfiguration,
  ): { findings: ConsistencyFinding[]; strengths: ConsistencyStrength[] } {
    if (!config.patternConsistencyRulesEnabled) {
      return { findings: [], strengths: [] };
    }

    const findings: ConsistencyFinding[] = [];
    const strengths: ConsistencyStrength[] = [];
    const now = new Date().toISOString();

    const layoutWeaknesses =
      layoutEvaluation?.layoutWeaknesses.filter((w) =>
        ["alignment", "visual_balance", "visual_hierarchy", "component_organization"].includes(
          w.category,
        ),
      ) ?? [];
    for (const weakness of layoutWeaknesses) {
      findings.push(
        this.metadata.enrichFinding({
          findingId: this.metadata.buildFindingId("layout_structure"),
          findingCategory: "layout_structure",
          findingDescription: weakness.description,
          severity: weakness.severity,
          affectedComponentId: null,
          affectedLayoutRegionId: null,
          affectedNavigationNodeId: null,
          expectedPattern: "consistent layout structure",
          observedPattern: weakness.evidenceRef,
          evidenceMetadata: { layoutFindingId: weakness.findingId, category: weakness.category },
          detectionConfidence: weakness.confidence,
          timestamp: now,
          metadataVersion: "1.0.0",
        }),
      );
    }

    if (layout && designSystem) {
      for (const standard of designSystem.layoutStandards) {
        const hasRegion = layout.regions.some((r) => r.regionType === standard.regionType);
        if (!hasRegion) {
          findings.push(
            this.metadata.enrichFinding({
              findingId: this.metadata.buildFindingId("layout_structure"),
              findingCategory: "layout_structure",
              findingDescription: `Expected layout region "${standard.name}" (${standard.regionType}) not detected`,
              severity: "info",
              affectedComponentId: null,
              affectedLayoutRegionId: null,
              affectedNavigationNodeId: null,
              expectedPattern: standard.regionType,
              observedPattern: "missing",
              evidenceMetadata: { standardId: standard.standardId },
              detectionConfidence: 0.5,
              timestamp: now,
              metadataVersion: "1.0.0",
            }),
          );
        }
      }

      if (layout.regions.length >= 2 && layoutWeaknesses.length === 0) {
        strengths.push({
          strengthId: this.metadata.buildStrengthId(),
          category: "layout_structure",
          description: `Layout structure consistent with ${layout.regions.length} regions`,
          affectedComponentIds: [],
          evidenceRef: layout.metadata.layoutId,
          confidence: 0.75,
        });
      }
    }

    const layoutStrengths = layoutEvaluation?.layoutStrengths ?? [];
    for (const strength of layoutStrengths.slice(0, 3)) {
      strengths.push({
        strengthId: this.metadata.buildStrengthId(),
        category: "layout_structure",
        description: strength.description,
        affectedComponentIds: [],
        evidenceRef: strength.evidenceRef,
        confidence: strength.confidence,
      });
    }

    return { findings, strengths };
  }
}
