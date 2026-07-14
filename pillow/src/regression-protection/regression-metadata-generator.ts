/** T3-07 — Regression metadata and ID generation. */

import type { RegressionProtectionReport, UiRegression } from "./types.js";
import { REGRESSION_METADATA_VERSION } from "./paths.js";

export class RegressionMetadataGenerator {
  buildReportId(): string {
    return `rp-report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildRunReportId(): string {
    return `rp-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildRegressionId(): string {
    return `rp-regression-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildValidationId(): string {
    return `rp-validation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildBaselineId(): string {
    return `rp-baseline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildProposedId(): string {
    return `rp-proposed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  enrichRegression(regression: UiRegression): UiRegression {
    return { ...regression, metadataVersion: REGRESSION_METADATA_VERSION };
  }

  enrichReport(report: RegressionProtectionReport): RegressionProtectionReport {
    return { ...report, metadataVersion: REGRESSION_METADATA_VERSION };
  }
}
