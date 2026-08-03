/** X2-04 — Knowledge metadata generator. */

import { CBK_METADATA_VERSION } from "./paths.js";
import type {
  KnowledgeEngineRecord,
  KnowledgeRecommendation,
  KnowledgeRecord,
  KnowledgeRunReport,
  KnowledgeValidationReport,
} from "./types.js";

export function buildKnowledgeRunReportId(): string {
  return `cbk-run-${Date.now()}`;
}

export class KnowledgeMetadataGenerator {
  buildRunReport(input: {
    action: KnowledgeRunReport["action"];
    engineRecord: KnowledgeEngineRecord;
    knowledgeRecords: KnowledgeRecord[];
    recommendations?: KnowledgeRecommendation[];
    validation: KnowledgeValidationReport;
    durationMs: number;
  }): KnowledgeRunReport {
    return {
      knowledgeRunReportId: buildKnowledgeRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      knowledgeRecords: input.knowledgeRecords,
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: CBK_METADATA_VERSION,
    };
  }
}
