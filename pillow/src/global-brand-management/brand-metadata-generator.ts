/** X4-11 — Brand Metadata Generator. */

import { GBM_METADATA_VERSION } from "./paths.js";
import type {
  BrandGovernanceRecord,
  BrandRecommendation,
  BrandValidationReport,
  GbmRunReport,
  GlobalBrandManagementEngineRecord,
} from "./types.js";

export class BrandMetadataGenerator {
  buildRunReport(input: {
    action: GbmRunReport["action"];
    engineRecord: GlobalBrandManagementEngineRecord;
    brandRecords?: BrandGovernanceRecord[];
    recommendations?: BrandRecommendation[];
    validation: BrandValidationReport;
    durationMs: number;
  }): GbmRunReport {
    return {
      brandRunReportId: `gbm-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      brandRecords: input.brandRecords ?? [],
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: GBM_METADATA_VERSION,
    };
  }
}
