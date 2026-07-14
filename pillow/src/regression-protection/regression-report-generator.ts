/** T3-07 — Regression report generation. */

import type { BaselineUiState, ProposedUiState, RegressionProtectionReport, UiRegression } from "./types.js";
import type { ProtectionDecision } from "./types.js";
import { RegressionMetadataGenerator } from "./regression-metadata-generator.js";
import { appendRegressionLog } from "./regression-logging.js";
import { REGRESSION_METADATA_VERSION } from "./paths.js";

function maxSeverity(regressions: UiRegression[]): RegressionProtectionReport["severity"] {
  const order = ["critical", "high", "medium", "low", "info"] as const;
  for (const level of order) {
    if (regressions.some((r) => r.severity === level)) return level;
  }
  return "info";
}

export class RegressionReportGenerator {
  private readonly metadata = new RegressionMetadataGenerator();

  buildReport(input: {
    baseline: BaselineUiState;
    proposed: ProposedUiState;
    regressions: UiRegression[];
    sourceValidationReportId: string;
    sourcePreviewBuildId: string | null;
    sourceFrontendBuildRecordIds: string[];
    sourceUxScoreId: string | null;
    sourceRecommendationId: string | null;
    protectedNavigationNodes: string[];
    finalDecision: ProtectionDecision;
  }): RegressionProtectionReport {
    appendRegressionLog({
      event: "regression_report_generation",
      level: input.regressions.length > 0 ? "warn" : "info",
      details: `Report for ${input.proposed.proposedUiStateId} · ${input.regressions.length} regressions`,
    });

    const regressionStatus =
      input.regressions.length === 0
        ? "protected"
        : input.finalDecision === "blocked"
          ? "blocked"
          : "regressions_found";

    const confidenceScore =
      input.regressions.length === 0
        ? 100
        : Math.max(
            0,
            100 -
              input.regressions.reduce((sum, r) => sum + (100 - r.detectionConfidence), 0) /
                Math.max(1, input.regressions.length),
          );

    return this.metadata.enrichReport({
      regressionReportId: this.metadata.buildReportId(),
      timestamp: new Date().toISOString(),
      sourceValidationReportId: input.sourceValidationReportId,
      sourcePreviewBuildId: input.sourcePreviewBuildId,
      sourceFrontendBuildRecordIds: input.sourceFrontendBuildRecordIds,
      sourceUxScoreId: input.sourceUxScoreId,
      sourceRecommendationId: input.sourceRecommendationId,
      baselineUiStateId: input.baseline.baselineUiStateId,
      proposedUiStateId: input.proposed.proposedUiStateId,
      regressionStatus,
      detectedRegressions: input.regressions,
      protectedScreens: [
        ...new Set(
          input.regressions
            .map((r) => r.affectedScreenId)
            .filter((id): id is string => Boolean(id)),
        ),
      ],
      protectedComponents: [
        ...new Set(
          input.regressions
            .map((r) => r.affectedComponentId)
            .filter((id): id is string => Boolean(id)),
        ),
      ],
      protectedLayouts: [
        ...new Set(
          input.regressions
            .map((r) => r.affectedLayoutRegionId)
            .filter((id): id is string => Boolean(id)),
        ),
      ],
      protectedNavigationNodes: input.protectedNavigationNodes,
      evidenceReferences: input.regressions.map((r) => r.regressionId),
      severity: maxSeverity(input.regressions),
      confidenceScore: Math.round(confidenceScore),
      finalProtectionDecision: input.finalDecision,
      metadataVersion: REGRESSION_METADATA_VERSION,
    });
  }
}
