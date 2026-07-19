/** R2-08 — Ranking Metadata Generator. */

import type { SupplierRankingReport } from "./types.js";
import { SRE_METADATA_VERSION } from "./paths.js";

export function buildRankingReportId(): string {
  return `sre-run-${Date.now()}`;
}

export class RankingMetadataGenerator {
  generateRankingReport(input: {
    action: SupplierRankingReport["action"];
    rankings: SupplierRankingReport["rankings"];
    findings: SupplierRankingReport["findings"];
    invalidRecords: SupplierRankingReport["invalidRecords"];
    validation: SupplierRankingReport["validation"];
    durationMs: number;
  }): SupplierRankingReport {
    return {
      rankingReportId: buildRankingReportId(),
      rankingTimestamp: new Date().toISOString(),
      action: input.action,
      rankings: input.rankings,
      findings: input.findings,
      invalidRecords: input.invalidRecords,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: SRE_METADATA_VERSION,
    };
  }
}
