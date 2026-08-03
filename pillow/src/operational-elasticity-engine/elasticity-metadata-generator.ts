/** X3-11 — Elasticity Metadata Generator. */

import { OEE_METADATA_VERSION } from "./paths.js";
import type {
  ElasticityRecommendation,
  OperationalElasticityEngineRecord,
  ElasticityRecord,
  ElasticityValidationReport,
  OeeRunReport,
} from "./types.js";

export function buildOperationalElasticityEngineRunReportId(): string {
  return `oee-run-${Date.now()}`;
}

export class ElasticityMetadataGenerator {
  buildRunReport(input: {
    action: OeeRunReport["action"];
    engineRecord: OperationalElasticityEngineRecord;
    elasticityRecords?: ElasticityRecord[];
    recommendations?: ElasticityRecommendation[];
    validation: ElasticityValidationReport;
    durationMs: number;
  }): OeeRunReport {
    return {
      operationalElasticityEngineRunReportId: buildOperationalElasticityEngineRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      elasticityRecords: input.elasticityRecords ?? [],
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: OEE_METADATA_VERSION,
    };
  }
}
