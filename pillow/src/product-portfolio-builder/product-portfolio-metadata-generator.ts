/** X1-08 — Product Portfolio Metadata Generator. */

import {
  PPB_CAPABILITIES,
  PPB_METADATA_VERSION,
  PRODUCT_PORTFOLIO_BUILDER_ID,
} from "./paths.js";
import type {
  HealthStatus,
  OperationalState,
  ProductPortfolioEngineRecord,
  ProductPortfolioRecord,
  ProductPortfolioRunReport,
  ProductPortfolioValidationReport,
  ValidationStatus,
} from "./types.js";

export class ProductPortfolioMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    dependencyPresence: ProductPortfolioEngineRecord["dependencyPresence"];
    healthStatus?: HealthStatus;
  }): ProductPortfolioEngineRecord {
    return {
      engineRecordId: `ppb-eng-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      engineId: PRODUCT_PORTFOLIO_BUILDER_ID,
      engineVersion: "PILLOW-PPB-001",
      currentOperationalState: input.operationalState,
      healthStatus:
        input.healthStatus ??
        (input.operationalState === "failed"
          ? "failed"
          : input.operationalState === "suspended"
            ? "degraded"
            : "healthy"),
      validationStatus: input.validationStatus,
      supportedCapabilities: [...PPB_CAPABILITIES],
      frameworkModuleId: input.frameworkModuleId,
      dependencyPresence: input.dependencyPresence,
      metadataVersion: PPB_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: ProductPortfolioRunReport["action"];
    engineRecord: ProductPortfolioEngineRecord;
    portfolioRecords: ProductPortfolioRecord[];
    validation: ProductPortfolioValidationReport;
    durationMs: number;
  }): ProductPortfolioRunReport {
    return {
      portfolioRunReportId: `ppb-run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      portfolioRecords: input.portfolioRecords,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: PPB_METADATA_VERSION,
    };
  }
}
