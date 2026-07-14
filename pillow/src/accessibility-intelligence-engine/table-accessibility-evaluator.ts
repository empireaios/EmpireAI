/** T2-06 — Table accessibility evaluation. */

import type { UiComponent } from "../component-recognition-engine/types.js";
import { AccessibilityMetadataGenerator } from "./accessibility-metadata-generator.js";
import type { AccessibilityFinding, AccessibilityStrength } from "./types.js";

export class TableAccessibilityEvaluator {
  private readonly metadata = new AccessibilityMetadataGenerator();

  evaluate(components: UiComponent[]): {
    findings: AccessibilityFinding[];
    strengths: AccessibilityStrength[];
  } {
    const findings: AccessibilityFinding[] = [];
    const strengths: AccessibilityStrength[] = [];
    const now = new Date().toISOString();

    const tables = components.filter((c) => c.componentType === "table");
    if (tables.length === 0) return { findings, strengths };

    for (const table of tables) {
      if (!table.label?.trim()) {
        findings.push(
          this.metadata.enrichFinding({
            findingId: this.metadata.buildFindingId("tables"),
            findingCategory: "tables",
            findingDescription: "Table missing accessible caption or label",
            severity: "warning",
            affectedComponentId: table.componentId,
            affectedLayoutRegionId: table.sourceRegionId,
            affectedNavigationNodeId: null,
            evidenceMetadata: { componentType: "table" },
            detectionConfidence: 0.7,
            timestamp: now,
            metadataVersion: "1.0.0",
          }),
        );
      } else {
        strengths.push({
          strengthId: this.metadata.buildStrengthId(),
          category: "tables",
          description: "Table has accessible label",
          affectedComponentIds: [table.componentId],
          evidenceRef: table.componentId,
          confidence: 0.7,
        });
      }
    }

    return { findings, strengths };
  }
}
