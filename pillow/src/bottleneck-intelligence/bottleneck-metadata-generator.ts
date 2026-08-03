/** X3-10 — Bottleneck Metadata Generator. */

import { BNI_METADATA_VERSION } from "./paths.js";
import type {
  BottleneckRecommendation,
  BottleneckIntelligenceEngineRecord,
  BottleneckRecord,
  BottleneckValidationReport,
  BniRunReport,
} from "./types.js";

export function buildBottleneckIntelligenceRunReportId(): string {
  return `bni-run-${Date.now()}`;
}

export class BottleneckMetadataGenerator {
  buildRunReport(input: {
    action: BniRunReport["action"];
    engineRecord: BottleneckIntelligenceEngineRecord;
    bottleneckRecords?: BottleneckRecord[];
    recommendations?: BottleneckRecommendation[];
    validation: BottleneckValidationReport;
    durationMs: number;
  }): BniRunReport {
    return {
      bottleneckIntelligenceRunReportId: buildBottleneckIntelligenceRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      bottleneckRecords: input.bottleneckRecords ?? [],
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: BNI_METADATA_VERSION,
    };
  }
}
