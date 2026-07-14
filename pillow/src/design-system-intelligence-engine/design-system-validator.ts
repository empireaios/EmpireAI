/** T2-02 — Design system deviation detection. */

import { DESIGN_SYSTEM_METADATA_VERSION } from "./paths.js";
import type {
  DesignSystemDeviation,
  DesignSystemModel,
  DesignSystemValidationReport,
  ValidationDecision,
} from "./types.js";

export class DesignSystemValidator {
  validate(
    model: DesignSystemModel,
    options: { validationEnabled: boolean },
  ): DesignSystemValidationReport {
    const started = Date.now();
    const deviations: DesignSystemDeviation[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!options.validationEnabled) {
      return this.buildReport(deviations, errors, warnings, started, model, "pass");
    }

    if (model.componentLibrary.length === 0) {
      warnings.push("No components discovered — partial design system model");
      deviations.push(this.deviation({
        category: "components",
        severity: "warning",
        description: "No reusable components identified",
        expected: "At least one component in library",
        observed: "0 components",
        evidence: { componentCount: 0 },
      }));
    }

    for (const component of model.componentLibrary) {
      if (!component.componentName) {
        deviations.push(
          this.deviation({
            category: "naming",
            severity: "warning",
            componentId: component.componentId,
            description: `Component ${component.componentId} missing display name`,
            expected: "Named component",
            observed: "Unnamed",
            evidence: { componentId: component.componentId },
          }),
        );
      }
      if (component.componentFamily === "unknown") {
        deviations.push(
          this.deviation({
            category: "family",
            severity: "info",
            componentId: component.componentId,
            description: `Component ${component.componentId} has unknown family`,
            expected: "Known component family",
            observed: "unknown",
            evidence: { componentId: component.componentId },
          }),
        );
      }
      if (
        (component.componentFamily === "interactive" || component.componentFamily === "forms") &&
        !component.interactionRules.includes("focus")
      ) {
        deviations.push(
          this.deviation({
            category: "interaction",
            severity: "warning",
            componentId: component.componentId,
            description: `Interactive component missing focus interaction rule`,
            expected: "focus interaction defined",
            observed: component.interactionRules.join(", ") || "none",
            evidence: { interactionRules: component.interactionRules },
          }),
        );
      }
    }

    if (model.colorPalette.length < 3) {
      deviations.push(
        this.deviation({
          category: "colors",
          severity: "warning",
          description: "Incomplete color palette learned",
          expected: "At least 3 color tokens",
          observed: `${model.colorPalette.length} tokens`,
          evidence: { tokenCount: model.colorPalette.length },
        }),
      );
    }

    if (model.typographyStandards.length < 2) {
      deviations.push(
        this.deviation({
          category: "typography",
          severity: "info",
          description: "Limited typography standards detected",
          expected: "Body and display typography",
          observed: `${model.typographyStandards.length} standards`,
          evidence: { standardCount: model.typographyStandards.length },
        }),
      );
    }

    const hasError = deviations.some((d) => d.severity === "error");
    const hasWarning = deviations.some((d) => d.severity === "warning");
    let decision: ValidationDecision = "pass";
    if (hasError) decision = "fail";
    else if (hasWarning || deviations.length > 0) decision = "partial";

    return this.buildReport(deviations, errors, warnings, started, model, decision);
  }

  private deviation(input: {
    category: string;
    severity: DesignSystemDeviation["severity"];
    componentId?: string | null;
    description: string;
    expected: string;
    observed: string;
    evidence: Record<string, unknown>;
  }): DesignSystemDeviation {
    return {
      deviationId: `dsi-dev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      category: input.category,
      severity: input.severity,
      componentId: input.componentId ?? null,
      description: input.description,
      expected: input.expected,
      observed: input.observed,
      evidenceMetadata: input.evidence,
      timestamp: new Date().toISOString(),
      metadataVersion: DESIGN_SYSTEM_METADATA_VERSION,
    };
  }

  private buildReport(
    deviations: DesignSystemDeviation[],
    errors: string[],
    warnings: string[],
    started: number,
    model: DesignSystemModel,
    decision: ValidationDecision,
  ): DesignSystemValidationReport {
    return {
      validationReportId: `dsi-validation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      deviations,
      componentsValidated: model.componentLibrary.length,
      familiesValidated: model.componentFamilies.length,
      standardsChecked:
        model.typographyStandards.length +
        model.colorPalette.length +
        model.spacingScale.length +
        model.sizingScale.length +
        model.layoutStandards.length,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: DESIGN_SYSTEM_METADATA_VERSION,
    };
  }
}
