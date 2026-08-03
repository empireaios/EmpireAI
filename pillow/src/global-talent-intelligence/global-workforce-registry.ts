/** X4-13 — Global Workforce Registry. */

import type { GlobalTalentIntelligenceConfiguration } from "./configuration.js";
import {
  buildWorkforceRecord,
  computeStructuralWorkforceSignals,
} from "./structural-signals.js";
import type { WorkforceAnalysisInput, WorkforceIntelligenceRecord } from "./types.js";

export class GlobalWorkforceRegistry {
  monitorGlobalWorkforceAvailability(
    input: WorkforceAnalysisInput,
    config: GlobalTalentIntelligenceConfiguration,
  ): WorkforceIntelligenceRecord {
    if (!config.workforceEvaluationRulesEnabled) {
      throw new Error("Workforce evaluation rules disabled");
    }
    const signals = computeStructuralWorkforceSignals(
      { ...input, workforceCategory: "global_workforce_availability" },
      config,
    );
    return buildWorkforceRecord({
      ...signals,
      recommendationSummary: `Monitor global workforce availability in ${signals.region}`,
    });
  }
}
