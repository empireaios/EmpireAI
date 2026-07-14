/** T2-07 — Color consistency checking. */

import type { DesignSystemModel } from "../design-system-intelligence-engine/types.js";
import type { LayoutEvaluationModel } from "../layout-evaluation-engine/types.js";
import type { ExecutiveStyleModel } from "../executive-style-learning-engine/types.js";
import { ConsistencyMetadataGenerator } from "./consistency-metadata-generator.js";
import type { ConsistencyFinding, ConsistencyStrength } from "./types.js";
import type { VisualConsistencyConfiguration } from "./configuration.js";

export class ColorConsistencyChecker {
  private readonly metadata = new ConsistencyMetadataGenerator();

  check(
    designSystem: DesignSystemModel | null,
    layoutEvaluation: LayoutEvaluationModel | null,
    executiveStyle: ExecutiveStyleModel | null,
    config: VisualConsistencyConfiguration,
  ): { findings: ConsistencyFinding[]; strengths: ConsistencyStrength[] } {
    if (!config.colorConsistencyRulesEnabled) {
      return { findings: [], strengths: [] };
    }

    const findings: ConsistencyFinding[] = [];
    const strengths: ConsistencyStrength[] = [];
    const now = new Date().toISOString();

    const colorDeviations =
      layoutEvaluation?.designSystemDeviations.filter((d) =>
        d.category.toLowerCase().includes("color"),
      ) ?? [];
    for (const dev of colorDeviations) {
      findings.push(
        this.metadata.enrichFinding({
          findingId: this.metadata.buildFindingId("colors"),
          findingCategory: "colors",
          findingDescription: dev.description,
          severity: dev.severity,
          affectedComponentId: dev.componentId,
          affectedLayoutRegionId: null,
          affectedNavigationNodeId: null,
          expectedPattern: dev.expected,
          observedPattern: dev.observed,
          evidenceMetadata: { deviationId: dev.deviationId },
          detectionConfidence: 0.8,
          timestamp: now,
          metadataVersion: "1.0.0",
        }),
      );
    }

    const execColorDeviations =
      layoutEvaluation?.executivePreferenceDeviations.filter((d) =>
        d.category === "color" || d.description.toLowerCase().includes("color"),
      ) ?? [];
    for (const dev of execColorDeviations) {
      findings.push(
        this.metadata.enrichFinding({
          findingId: this.metadata.buildFindingId("colors"),
          findingCategory: "colors",
          findingDescription: dev.description,
          severity: dev.severity,
          affectedComponentId: null,
          affectedLayoutRegionId: null,
          affectedNavigationNodeId: null,
          expectedPattern: dev.expected,
          observedPattern: dev.observed,
          evidenceMetadata: { deviationId: dev.deviationId },
          detectionConfidence: 0.7,
          timestamp: now,
          metadataVersion: "1.0.0",
        }),
      );
    }

    if (designSystem) {
      const roles = new Set(designSystem.colorPalette.map((c) => c.role));
      const requiredRoles = ["background", "foreground", "accent"] as const;
      const missing = requiredRoles.filter((r) => !roles.has(r));
      for (const role of missing) {
        findings.push(
          this.metadata.enrichFinding({
            findingId: this.metadata.buildFindingId("colors"),
            findingCategory: "colors",
            findingDescription: `Design system missing ${role} color token`,
            severity: "warning",
            affectedComponentId: null,
            affectedLayoutRegionId: null,
            affectedNavigationNodeId: null,
            expectedPattern: `${role} token in palette`,
            observedPattern: "missing",
            evidenceMetadata: { role },
            detectionConfidence: 0.65,
            timestamp: now,
            metadataVersion: "1.0.0",
          }),
        );
      }

      if (designSystem.colorPalette.length >= 4 && colorDeviations.length === 0) {
        strengths.push({
          strengthId: this.metadata.buildStrengthId(),
          category: "colors",
          description: `Color palette defines ${designSystem.colorPalette.length} tokens with no deviations`,
          affectedComponentIds: [],
          evidenceRef: designSystem.designSystemId,
          confidence: 0.85,
        });
      }
    }

    if (executiveStyle && executiveStyle.preferredColorPreferences.length > 0) {
      strengths.push({
        strengthId: this.metadata.buildStrengthId(),
        category: "colors",
        description: "Executive color preferences available for consistency validation",
        affectedComponentIds: [],
        evidenceRef: executiveStyle.executiveStyleId,
        confidence: executiveStyle.confidenceScore / 100,
      });
    }

    return { findings, strengths };
  }
}
