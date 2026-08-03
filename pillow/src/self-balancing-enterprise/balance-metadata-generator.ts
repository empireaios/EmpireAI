/** X3-19 — Balance Metadata Generator. */

import { SBE_METADATA_VERSION } from "./paths.js";
import type {
  SelfBalancingRecommendation,
  SelfBalancingEnterpriseRecord,
  SelfBalancingRecord,
  BalanceValidationReport,
  SbeRunReport,
} from "./types.js";

export function buildSelfBalancingEnterpriseRunReportId(): string {
  return `sbe-run-${Date.now()}`;
}

export class BalanceMetadataGenerator {
  buildRunReport(input: {
    action: SbeRunReport["action"];
    engineRecord: SelfBalancingEnterpriseRecord;
    balancingRecords?: SelfBalancingRecord[];
    recommendations?: SelfBalancingRecommendation[];
    validation: BalanceValidationReport;
    durationMs: number;
  }): SbeRunReport {
    return {
      selfBalancingEnterpriseRunReportId: buildSelfBalancingEnterpriseRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      balancingRecords: input.balancingRecords ?? [],
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: SBE_METADATA_VERSION,
    };
  }
}
