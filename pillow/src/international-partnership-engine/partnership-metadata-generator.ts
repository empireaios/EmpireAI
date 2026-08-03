/** X4-12 — Partnership Metadata Generator. */

import { IPE_METADATA_VERSION } from "./paths.js";
import type {
  InternationalPartnershipEngineRecord,
  PartnershipRecommendation,
  PartnershipRecord,
  PartnershipValidationReport,
  IpeRunReport,
} from "./types.js";

export class PartnershipMetadataGenerator {
  buildRunReport(input: {
    action: IpeRunReport["action"];
    engineRecord: InternationalPartnershipEngineRecord;
    partnershipRecords?: PartnershipRecord[];
    recommendations?: PartnershipRecommendation[];
    validation: PartnershipValidationReport;
    durationMs: number;
  }): IpeRunReport {
    return {
      partnershipRunReportId: `ipe-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      partnershipRecords: input.partnershipRecords ?? [],
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: IPE_METADATA_VERSION,
    };
  }
}
