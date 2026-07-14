/** T2-02 — Component library analysis from T1 recognition data. */

import type { ComponentRecognitionResult } from "../component-recognition-engine/types.js";
import type { DesignSystemIntelligenceConfiguration } from "./configuration.js";
import { resolveComponentCategory, resolveComponentFamily } from "./component-family-map.js";
import { ComponentVariantManager } from "./component-variant-manager.js";
import { DesignSystemMetadataGenerator } from "./design-system-metadata-generator.js";
import type { DesignSystemComponent } from "./types.js";

export class ComponentLibraryAnalyzer {
  private readonly variantManager = new ComponentVariantManager();
  private readonly metadataGenerator = new DesignSystemMetadataGenerator();
  private readonly usageCounts = new Map<string, number>();

  analyze(
    recognition: ComponentRecognitionResult | null,
    config: DesignSystemIntelligenceConfiguration,
  ): DesignSystemComponent[] {
    if (!recognition) return [];

    const components: DesignSystemComponent[] = [];
    for (const component of recognition.components) {
      if (component.detectionConfidence < config.minComponentConfidence) continue;

      const usageCount = (this.usageCounts.get(component.componentId) ?? 0) + 1;
      this.usageCounts.set(component.componentId, usageCount);

      const { variantName, sizeVariant } = this.variantManager.detectVariant(component);
      const family = resolveComponentFamily(component.componentType);
      const states: string[] = [];
      if (component.active) states.push("active");
      if (component.selected) states.push("selected");
      if (!component.enabled) states.push("disabled");
      if (component.visibility === "hidden") states.push("hidden");
      if (states.length === 0) states.push("default");

      const model: DesignSystemComponent = {
        componentId: component.componentId,
        componentName: this.metadataGenerator.buildComponentName(
          component.componentType,
          component.label,
        ),
        componentFamily: family,
        componentVariant: variantName,
        componentCategory: resolveComponentCategory(component.componentType),
        supportedStates: states,
        sizeVariants: [sizeVariant],
        colorVariants: component.componentType === "button" ? ["primary", "secondary"] : ["default"],
        typographyRules: family === "interactive" || family === "forms" ? ["body", "label"] : ["body"],
        spacingRules: ["padding-sm", "margin-md"],
        layoutRules: [`region-${component.sourceRegionId}`],
        interactionRules:
          family === "interactive" ? ["click", "focus"] : family === "forms" ? ["input", "focus"] : [],
        usageCount,
        status: "active",
        version: "1.0.0",
        metadataVersion: "1.0.0",
      };
      components.push(this.metadataGenerator.enrichComponent(model));
    }

    return components;
  }

  resetUsageCounts(): void {
    this.usageCounts.clear();
  }
}
