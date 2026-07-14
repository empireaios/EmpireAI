/** T2-07 — Typography consistency checking. */

import type { DesignSystemModel } from "../design-system-intelligence-engine/types.js";
import type { LayoutEvaluationModel } from "../layout-evaluation-engine/types.js";
import type { ExecutiveStyleModel } from "../executive-style-learning-engine/types.js";
import { ConsistencyMetadataGenerator } from "./consistency-metadata-generator.js";
import type { ConsistencyFinding, ConsistencyStrength } from "./types.js";
import type { VisualConsistencyConfiguration } from "./configuration.js";

export class TypographyConsistencyChecker {
  private readonly metadata = new ConsistencyMetadataGenerator();

  check(
    designSystem: DesignSystemModel | null,
    layoutEvaluation: LayoutEvaluationModel | null,
    executiveStyle: ExecutiveStyleModel | null,
    config: VisualConsistencyConfiguration,
  ): { findings: ConsistencyFinding[]; strengths: ConsistencyStrength[] } {
    if (!config.typographyConsistencyRulesEnabled) {
      return { findings: [], strengths: [] };
    }

    const findings: ConsistencyFinding[] = [];
    const strengths: ConsistencyStrength[] = [];
    const now = new Date().toISOString();

    if (designSystem && designSystem.typographyStandards.length === 0) {
      findings.push(
        this.metadata.enrichFinding({
          findingId: this.metadata.buildFindingId("typography"),
          findingCategory: "typography",
          findingDescription: "No typography standards defined in design system",
          severity: "info",
          affectedComponentId: null,
          affectedLayoutRegionId: null,
          affectedNavigationNodeId: null,
          expectedPattern: "typography token scale",
          observedPattern: "none",
          evidenceMetadata: {},
          detectionConfidence: 0.6,
          timestamp: now,
          metadataVersion: "1.0.0",
        }),
      );
    }

    const typographyWeaknesses =
      layoutEvaluation?.layoutWeaknesses.filter(
        (w) => w.category === "visual_hierarchy" || w.description.toLowerCase().includes("typography"),
      ) ?? [];
    for (const weakness of typographyWeaknesses) {
      findings.push(
        this.metadata.enrichFinding({
          findingId: this.metadata.buildFindingId("typography"),
          findingCategory: "typography",
          findingDescription: weakness.description,
          severity: weakness.severity,
          affectedComponentId: null,
          affectedLayoutRegionId: null,
          affectedNavigationNodeId: null,
          expectedPattern: "consistent typography hierarchy",
          observedPattern: weakness.evidenceRef,
          evidenceMetadata: { layoutFindingId: weakness.findingId },
          detectionConfidence: weakness.confidence,
          timestamp: now,
          metadataVersion: "1.0.0",
        }),
      );
    }

    const typographyDeviations =
      layoutEvaluation?.designSystemDeviations.filter((d) =>
        d.category.toLowerCase().includes("typography"),
      ) ?? [];
    for (const dev of typographyDeviations) {
      findings.push(
        this.metadata.enrichFinding({
          findingId: this.metadata.buildFindingId("typography"),
          findingCategory: "typography",
          findingDescription: dev.description,
          severity: dev.severity,
          affectedComponentId: dev.componentId,
          affectedLayoutRegionId: null,
          affectedNavigationNodeId: null,
          expectedPattern: dev.expected,
          observedPattern: dev.observed,
          evidenceMetadata: { deviationId: dev.deviationId },
          detectionConfidence: 0.75,
          timestamp: now,
          metadataVersion: "1.0.0",
        }),
      );
    }

    if (executiveStyle && executiveStyle.preferredTypography.length > 0 && designSystem) {
      strengths.push({
        strengthId: this.metadata.buildStrengthId(),
        category: "typography",
        description: `Typography aligned with ${executiveStyle.preferredTypography.length} executive preferences`,
        affectedComponentIds: [],
        evidenceRef: executiveStyle.executiveStyleId,
        confidence: executiveStyle.confidenceScore / 100,
      });
    }

    if (designSystem && designSystem.typographyStandards.length >= 3 && typographyWeaknesses.length === 0) {
      strengths.push({
        strengthId: this.metadata.buildStrengthId(),
        category: "typography",
        description: `Design system defines ${designSystem.typographyStandards.length} typography standards`,
        affectedComponentIds: [],
        evidenceRef: designSystem.designSystemId,
        confidence: 0.8,
      });
    }

    return { findings, strengths };
  }
}
