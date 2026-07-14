/** T2-04 — Design system validation for layout evaluation. */

import type { DesignSystemModel } from "../design-system-intelligence-engine/types.js";
import type { LayoutModel } from "../layout-understanding-engine/types.js";
import type { ComponentRecognitionResult } from "../component-recognition-engine/types.js";
import { EVALUATION_METADATA_VERSION } from "./paths.js";
import { EvaluationMetadataGenerator } from "./evaluation-metadata-generator.js";
import type { DesignSystemDeviation } from "../design-system-intelligence-engine/types.js";
import { appendLayoutEvaluationLog } from "./layout-evaluation-logging.js";

export class DesignSystemValidationEngine {
  private readonly metadata = new EvaluationMetadataGenerator();

  validate(
    designSystem: DesignSystemModel | null,
    layout: LayoutModel | null,
    recognition: ComponentRecognitionResult | null,
    enabled: boolean,
  ): DesignSystemDeviation[] {
    if (!enabled) return [];

    appendLayoutEvaluationLog({
      event: "design_system_validation",
      level: "info",
      details: "Validating layout against design system standards",
    });

    const deviations: DesignSystemDeviation[] = [];
    if (!designSystem) {
      deviations.push(this.deviation({
        category: "design_system",
        severity: "warning",
        description: "No design system model available for layout validation",
        expected: "Design system model",
        observed: "none",
        evidence: { reason: "missing_design_system" },
      }));
      return deviations;
    }

    if (!layout) {
      deviations.push(this.deviation({
        category: "layout",
        severity: "warning",
        description: "No layout model for design system comparison",
        expected: "Layout model",
        observed: "none",
        evidence: { reason: "missing_layout" },
      }));
      return deviations;
    }

    for (const standard of designSystem.layoutStandards) {
      const matchingRegions = layout.regions.filter(
        (r) => r.regionType === standard.regionType || standard.regionType === "any",
      );
      if (matchingRegions.length < standard.minRegions) {
        deviations.push(this.deviation({
          category: "layout_standards",
          severity: "warning",
          description: `Layout standard '${standard.name}' expects at least ${standard.minRegions} ${standard.regionType} region(s)`,
          expected: `${standard.minRegions} ${standard.regionType} regions`,
          observed: `${matchingRegions.length}`,
          evidence: { standardId: standard.standardId, regionType: standard.regionType },
        }));
      }
    }

    if (recognition) {
      const libraryIds = new Set(designSystem.componentLibrary.map((c) => c.componentId));
      const unknownComponents = recognition.components.filter(
        (c) => !libraryIds.has(c.componentId) && c.detectionConfidence >= 0.5,
      );
      if (unknownComponents.length > 3) {
        deviations.push(this.deviation({
          category: "components",
          severity: "info",
          description: `${unknownComponents.length} components not in design system library`,
          expected: "Known design system components",
          observed: `${unknownComponents.length} unregistered`,
          evidence: { count: unknownComponents.length },
        }));
      }
    }

    return deviations;
  }

  private deviation(input: {
    category: string;
    severity: "info" | "warning" | "error";
    description: string;
    expected: string;
    observed: string;
    evidence: Record<string, unknown>;
  }): DesignSystemDeviation {
    return {
      deviationId: this.metadata.buildDeviationId(),
      category: input.category,
      severity: input.severity,
      componentId: null,
      description: input.description,
      expected: input.expected,
      observed: input.observed,
      evidenceMetadata: input.evidence,
      timestamp: new Date().toISOString(),
      metadataVersion: EVALUATION_METADATA_VERSION,
    };
  }
}
