/** X3-03 — Decision Metadata Generator. */

import { SDE_METADATA_VERSION } from "./paths.js";
import type {
  DecisionValidationReport,
  ScalingDecisionEngineRecord,
  ScalingDecisionRecord,
  ScalingRecommendation,
  SdeRunReport,
} from "./types.js";

export function buildScalingDecisionRunReportId(): string {
  return `sde-run-${Date.now()}`;
}

export class DecisionMetadataGenerator {
  buildRunReport(input: {
    action: SdeRunReport["action"];
    engineRecord: ScalingDecisionEngineRecord;
    decisionRecords?: ScalingDecisionRecord[];
    recommendations?: ScalingRecommendation[];
    validation: DecisionValidationReport;
    durationMs: number;
  }): SdeRunReport {
    return {
      scalingDecisionRunReportId: buildScalingDecisionRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      decisionRecords: input.decisionRecords ?? [],
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: SDE_METADATA_VERSION,
    };
  }
}
