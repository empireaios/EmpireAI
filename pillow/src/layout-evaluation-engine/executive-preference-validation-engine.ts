/** T2-04 — Executive preference validation for layout evaluation. */

import type { ExecutiveStyleModel } from "../executive-style-learning-engine/types.js";
import type { LayoutModel } from "../layout-understanding-engine/types.js";
import { EVALUATION_METADATA_VERSION } from "./paths.js";
import { EvaluationMetadataGenerator } from "./evaluation-metadata-generator.js";
import type { ExecutivePreferenceDeviation } from "./types.js";
import { appendLayoutEvaluationLog } from "./layout-evaluation-logging.js";

export class ExecutivePreferenceValidationEngine {
  private readonly metadata = new EvaluationMetadataGenerator();

  validate(
    executiveStyle: ExecutiveStyleModel | null,
    layout: LayoutModel | null,
    enabled: boolean,
  ): ExecutivePreferenceDeviation[] {
    if (!enabled) return [];

    appendLayoutEvaluationLog({
      event: "executive_preference_validation",
      level: "info",
      details: "Validating layout against executive style preferences",
    });

    const deviations: ExecutivePreferenceDeviation[] = [];
    if (!executiveStyle) {
      deviations.push(this.deviation({
        category: "executive_style",
        severity: "info",
        description: "No executive style preferences learned yet — using defaults",
        expected: "Executive style model",
        observed: "none",
        evidence: { reason: "missing_executive_style" },
      }));
      return deviations;
    }

    if (!layout) return deviations;

    const regionTypes = layout.regions.map((r) => r.regionType);
    for (const preferred of executiveStyle.preferredLayoutStyles) {
      const slug = preferred.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const matched = regionTypes.some((t) => preferred.includes(t) || slug.includes(t));
      if (!matched && executiveStyle.confidenceScore >= 50) {
        deviations.push(this.deviation({
          category: "layout_preferences",
          severity: "info",
          description: `Preferred layout style '${preferred}' not detected in current layout`,
          expected: preferred,
          observed: regionTypes.join(", ") || "none",
          evidence: { preferredLayout: preferred, regionTypes },
        }));
      }
    }

    if (
      executiveStyle.preferredVisualDensity === "compact" &&
      layout.regions.length > 6
    ) {
      deviations.push(this.deviation({
        category: "visual_density",
        severity: "warning",
        description: "Executive prefers compact density but layout has many regions",
        expected: "compact visual density",
        observed: `${layout.regions.length} regions`,
        evidence: { regionCount: layout.regions.length },
      }));
    }

    for (const navPref of executiveStyle.preferredNavigationStyles) {
      const hasNav = layout.regions.some((r) => r.regionType === "top_navigation");
      if (!hasNav && navPref.includes("nav")) {
        deviations.push(this.deviation({
          category: "navigation_preferences",
          severity: "info",
          description: `Preferred navigation style '${navPref}' not reflected in layout`,
          expected: navPref,
          observed: "no navigation region",
          evidence: { navigationPreference: navPref },
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
  }): ExecutivePreferenceDeviation {
    return {
      deviationId: this.metadata.buildDeviationId(),
      category: input.category,
      severity: input.severity,
      description: input.description,
      expected: input.expected,
      observed: input.observed,
      evidenceMetadata: input.evidence,
      timestamp: new Date().toISOString(),
      metadataVersion: EVALUATION_METADATA_VERSION,
    };
  }
}
