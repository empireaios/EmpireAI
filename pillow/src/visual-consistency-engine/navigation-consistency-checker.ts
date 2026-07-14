/** T2-07 — Navigation consistency checking. */

import type { NavigationGraph } from "../navigation-mapping-engine/types.js";
import type { DesignSystemModel } from "../design-system-intelligence-engine/types.js";
import type { ExecutiveStyleModel } from "../executive-style-learning-engine/types.js";
import { ConsistencyMetadataGenerator } from "./consistency-metadata-generator.js";
import type { ConsistencyFinding, ConsistencyStrength } from "./types.js";
import type { VisualConsistencyConfiguration } from "./configuration.js";

export class NavigationConsistencyChecker {
  private readonly metadata = new ConsistencyMetadataGenerator();

  check(
    navigation: NavigationGraph | null,
    designSystem: DesignSystemModel | null,
    executiveStyle: ExecutiveStyleModel | null,
    config: VisualConsistencyConfiguration,
  ): { findings: ConsistencyFinding[]; strengths: ConsistencyStrength[] } {
    if (!config.patternConsistencyRulesEnabled) {
      return { findings: [], strengths: [] };
    }

    const findings: ConsistencyFinding[] = [];
    const strengths: ConsistencyStrength[] = [];
    const now = new Date().toISOString();

    if (!navigation) return { findings, strengths };

    const navNodes = navigation.nodes.filter((n) => n.visibility !== "hidden");
    const unlabeled = navNodes.filter((n) => !n.label?.trim());
    for (const node of unlabeled) {
      findings.push(
        this.metadata.enrichFinding({
          findingId: this.metadata.buildFindingId("navigation"),
          findingCategory: "navigation",
          findingDescription: `Navigation node "${node.nodeId}" missing label for visual consistency`,
          severity: "warning",
          affectedComponentId: node.relatedComponentIds[0] ?? null,
          affectedLayoutRegionId: null,
          affectedNavigationNodeId: node.nodeId,
          expectedPattern: "labeled navigation item",
          observedPattern: "unlabeled",
          evidenceMetadata: { nodeKind: node.kind },
          detectionConfidence: 0.7,
          timestamp: now,
          metadataVersion: "1.0.0",
        }),
      );
    }

    const kinds = navNodes.map((n) => n.kind);
    const uniqueKinds = new Set(kinds);
    if (uniqueKinds.size > 4) {
      findings.push(
        this.metadata.enrichFinding({
          findingId: this.metadata.buildFindingId("navigation"),
          findingCategory: "navigation",
          findingDescription: `High navigation node kind diversity (${uniqueKinds.size} kinds) may indicate inconsistent patterns`,
          severity: "info",
          affectedComponentId: null,
          affectedLayoutRegionId: null,
          affectedNavigationNodeId: null,
          expectedPattern: "consistent navigation node types",
          observedPattern: [...uniqueKinds].join(", "),
          evidenceMetadata: { kinds: [...uniqueKinds] },
          detectionConfidence: 0.5,
          timestamp: now,
          metadataVersion: "1.0.0",
        }),
      );
    }

    if (executiveStyle && executiveStyle.preferredNavigationStyles.length > 0 && unlabeled.length === 0) {
      strengths.push({
        strengthId: this.metadata.buildStrengthId(),
        category: "navigation",
        description: "Navigation labels consistent with executive navigation preferences",
        affectedComponentIds: [],
        evidenceRef: executiveStyle.executiveStyleId,
        confidence: executiveStyle.confidenceScore / 100,
      });
    }

    if (designSystem && navNodes.length > 0 && unlabeled.length === 0) {
      strengths.push({
        strengthId: this.metadata.buildStrengthId(),
        category: "navigation",
        description: `All ${navNodes.length} navigation nodes have consistent labeling`,
        affectedComponentIds: navNodes
          .flatMap((n) => n.relatedComponentIds)
          .filter((id): id is string => !!id),
        evidenceRef: navigation.metadata.graphId,
        confidence: 0.8,
      });
    }

    return { findings, strengths };
  }
}
