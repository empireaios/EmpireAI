/** T2-07 — Sizing consistency checking. */

import type { UiComponent } from "../component-recognition-engine/types.js";
import type { DesignSystemModel } from "../design-system-intelligence-engine/types.js";
import { ConsistencyMetadataGenerator } from "./consistency-metadata-generator.js";
import { inferSizeVariant, groupByType } from "./consistency-helpers.js";
import type { ConsistencyFinding, ConsistencyStrength } from "./types.js";
import type { VisualConsistencyConfiguration } from "./configuration.js";

export class SizingConsistencyChecker {
  private readonly metadata = new ConsistencyMetadataGenerator();

  check(
    components: UiComponent[],
    designSystem: DesignSystemModel | null,
    config: VisualConsistencyConfiguration,
  ): { findings: ConsistencyFinding[]; strengths: ConsistencyStrength[] } {
    if (!config.sizingConsistencyRulesEnabled) {
      return { findings: [], strengths: [] };
    }

    const findings: ConsistencyFinding[] = [];
    const strengths: ConsistencyStrength[] = [];
    const now = new Date().toISOString();
    const visible = components.filter((c) => c.visibility === "visible");
    const sizingScale = designSystem?.sizingScale ?? [];

    for (const [type, group] of groupByType(visible)) {
      if (group.length < 2) continue;
      const widths = group.map((c) => c.size.width);
      const heights = group.map((c) => c.size.height);
      const widthSpread = Math.max(...widths) - Math.min(...widths);
      const heightSpread = Math.max(...heights) - Math.min(...heights);

      if (widthSpread > config.sizingTolerancePx * 3 || heightSpread > config.sizingTolerancePx * 3) {
        findings.push(
          this.metadata.enrichFinding({
            findingId: this.metadata.buildFindingId("sizing"),
            findingCategory: "sizing",
            findingDescription: `Inconsistent dimensions for ${type} (width spread ${widthSpread}px, height spread ${heightSpread}px)`,
            severity: "warning",
            affectedComponentId: group[0]!.componentId,
            affectedLayoutRegionId: group[0]!.sourceRegionId,
            affectedNavigationNodeId: null,
            expectedPattern: "uniform sizing within component type",
            observedPattern: `w±${widthSpread}px h±${heightSpread}px`,
            evidenceMetadata: { componentType: type, widthSpread, heightSpread },
            detectionConfidence: 0.7,
            timestamp: now,
            metadataVersion: "1.0.0",
          }),
        );
      }
    }

    for (const component of visible) {
      const variant = inferSizeVariant(component);
      const token = sizingScale.find((t) => t.variant === variant);
      if (!token) continue;
      const widthOk =
        component.size.width >= token.minWidthPx - config.sizingTolerancePx &&
        component.size.width <= token.maxWidthPx + config.sizingTolerancePx;
      const heightOk =
        component.size.height >= token.minHeightPx - config.sizingTolerancePx &&
        component.size.height <= token.maxHeightPx + config.sizingTolerancePx;
      if (!widthOk || !heightOk) {
        findings.push(
          this.metadata.enrichFinding({
            findingId: this.metadata.buildFindingId("sizing"),
            findingCategory: "sizing",
            findingDescription: `Component size outside ${variant} sizing token range`,
            severity: "info",
            affectedComponentId: component.componentId,
            affectedLayoutRegionId: component.sourceRegionId,
            affectedNavigationNodeId: null,
            expectedPattern: `${variant}: ${token.minWidthPx}-${token.maxWidthPx}×${token.minHeightPx}-${token.maxHeightPx}px`,
            observedPattern: `${component.size.width}×${component.size.height}px`,
            evidenceMetadata: { variant, tokenId: token.tokenId },
            detectionConfidence: 0.55,
            timestamp: now,
            metadataVersion: "1.0.0",
          }),
        );
      }
    }

    if (visible.length > 0 && findings.length === 0) {
      strengths.push({
        strengthId: this.metadata.buildStrengthId(),
        category: "sizing",
        description: `Component sizing consistent across ${visible.length} visible elements`,
        affectedComponentIds: visible.map((c) => c.componentId),
        evidenceRef: "sizing-check",
        confidence: 0.65,
      });
    }

    return { findings, strengths };
  }
}
