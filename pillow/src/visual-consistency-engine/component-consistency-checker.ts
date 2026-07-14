/** T2-07 — Component consistency checking. */

import type { UiComponent } from "../component-recognition-engine/types.js";
import type { DesignSystemModel } from "../design-system-intelligence-engine/types.js";
import { ConsistencyMetadataGenerator } from "./consistency-metadata-generator.js";
import { inferSizeVariant } from "./consistency-helpers.js";
import type { ConsistencyFinding, ConsistencyStrength } from "./types.js";
import type { VisualConsistencyConfiguration } from "./configuration.js";

export class ComponentConsistencyChecker {
  private readonly metadata = new ConsistencyMetadataGenerator();

  check(
    components: UiComponent[],
    designSystem: DesignSystemModel | null,
    config: VisualConsistencyConfiguration,
  ): { findings: ConsistencyFinding[]; strengths: ConsistencyStrength[] } {
    if (!config.componentConsistencyRulesEnabled) {
      return { findings: [], strengths: [] };
    }

    const findings: ConsistencyFinding[] = [];
    const strengths: ConsistencyStrength[] = [];
    const now = new Date().toISOString();
    const visible = components.filter((c) => c.visibility === "visible");
    const knownFamilies = new Set(
      designSystem?.componentLibrary.map((c) => c.componentFamily) ?? [],
    );
    const knownTypes = new Set(
      designSystem?.componentVariants.map((v) => v.baseComponentType) ?? [],
    );

    for (const component of visible) {
      if (designSystem && !knownTypes.has(component.componentType)) {
        const familyMatch = [...knownFamilies].find((f) =>
          component.componentType.includes(f) || f.includes(component.componentType),
        );
        if (!familyMatch) {
          findings.push(
            this.metadata.enrichFinding({
              findingId: this.metadata.buildFindingId("components"),
              findingCategory: "components",
              findingDescription: `Component type "${component.componentType}" not in design system library`,
              severity: "warning",
              affectedComponentId: component.componentId,
              affectedLayoutRegionId: component.sourceRegionId,
              affectedNavigationNodeId: null,
              expectedPattern: "registered design system component",
              observedPattern: component.componentType,
              evidenceMetadata: { componentType: component.componentType },
              detectionConfidence: 0.7,
              timestamp: now,
              metadataVersion: "1.0.0",
            }),
          );
        }
      }
    }

    const byType = new Map<string, UiComponent[]>();
    for (const c of visible) {
      const list = byType.get(c.componentType) ?? [];
      list.push(c);
      byType.set(c.componentType, list);
    }

    for (const [type, group] of byType) {
      if (group.length < 2) continue;
      const variants = group.map((c) => inferSizeVariant(c));
      const unique = new Set(variants);
      if (unique.size > 2) {
        findings.push(
          this.metadata.enrichFinding({
            findingId: this.metadata.buildFindingId("component_variants"),
            findingCategory: "component_variants",
            findingDescription: `Inconsistent size variants for ${type} components (${unique.size} variants detected)`,
            severity: "warning",
            affectedComponentId: group[0]!.componentId,
            affectedLayoutRegionId: group[0]!.sourceRegionId,
            affectedNavigationNodeId: null,
            expectedPattern: "consistent size variant within component family",
            observedPattern: [...unique].join(", "),
            evidenceMetadata: { componentType: type, variants: [...unique] },
            detectionConfidence: 0.65,
            timestamp: now,
            metadataVersion: "1.0.0",
          }),
        );
      } else if (group.length >= 2) {
        strengths.push({
          strengthId: this.metadata.buildStrengthId(),
          category: "components",
          description: `Consistent ${type} component sizing across ${group.length} instances`,
          affectedComponentIds: group.map((c) => c.componentId),
          evidenceRef: `component-family:${type}`,
          confidence: 0.7,
        });
      }
    }

    return { findings, strengths };
  }
}
