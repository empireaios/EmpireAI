/** T2-07 — Icon consistency checking. */

import type { UiComponent } from "../component-recognition-engine/types.js";
import type { DesignSystemModel } from "../design-system-intelligence-engine/types.js";
import { ConsistencyMetadataGenerator } from "./consistency-metadata-generator.js";
import type { ConsistencyFinding, ConsistencyStrength } from "./types.js";
import type { VisualConsistencyConfiguration } from "./configuration.js";

const ICON_TYPES = new Set(["icon", "image"]);

export class IconConsistencyChecker {
  private readonly metadata = new ConsistencyMetadataGenerator();

  check(
    components: UiComponent[],
    designSystem: DesignSystemModel | null,
    config: VisualConsistencyConfiguration,
  ): { findings: ConsistencyFinding[]; strengths: ConsistencyStrength[] } {
    if (!config.iconConsistencyRulesEnabled) {
      return { findings: [], strengths: [] };
    }

    const findings: ConsistencyFinding[] = [];
    const strengths: ConsistencyStrength[] = [];
    const now = new Date().toISOString();
    const icons = components.filter(
      (c) => c.visibility === "visible" && ICON_TYPES.has(c.componentType),
    );
    if (icons.length === 0) return { findings, strengths };

    const standardSizes = designSystem?.iconLibrary.map((i) => i.sizePx) ?? [16, 20, 24];
    const sizes = icons.map((i) => Math.min(i.size.width, i.size.height));
    const uniqueSizes = new Set(sizes);

    if (uniqueSizes.size > 2) {
      findings.push(
        this.metadata.enrichFinding({
          findingId: this.metadata.buildFindingId("icons"),
          findingCategory: "icons",
          findingDescription: `Inconsistent icon sizes detected (${uniqueSizes.size} distinct sizes)`,
          severity: "warning",
          affectedComponentId: icons[0]!.componentId,
          affectedLayoutRegionId: icons[0]!.sourceRegionId,
          affectedNavigationNodeId: null,
          expectedPattern: `standard icon sizes: ${standardSizes.join(", ")}px`,
          observedPattern: [...uniqueSizes].join(", ") + "px",
          evidenceMetadata: { sizes: [...uniqueSizes], iconCount: icons.length },
          detectionConfidence: 0.75,
          timestamp: now,
          metadataVersion: "1.0.0",
        }),
      );
    } else {
      strengths.push({
        strengthId: this.metadata.buildStrengthId(),
        category: "icons",
        description: `Consistent icon sizing across ${icons.length} icon elements`,
        affectedComponentIds: icons.map((i) => i.componentId),
        evidenceRef: "icon-size-check",
        confidence: 0.8,
      });
    }

    return { findings, strengths };
  }
}
