/** X4-13 — Workforce Capability Engine. */

import type { GlobalTalentIntelligenceConfiguration } from "./configuration.js";
import {
  buildWorkforceRecord,
  computeStructuralWorkforceSignals,
} from "./structural-signals.js";
import type { WorkforceAnalysisInput, WorkforceIntelligenceRecord } from "./types.js";

export class WorkforceCapabilityEngine {
  monitorWorkforceCapabilities(
    input: WorkforceAnalysisInput,
    config: GlobalTalentIntelligenceConfiguration,
  ): WorkforceIntelligenceRecord {
    const signals = computeStructuralWorkforceSignals(
      { ...input, workforceCategory: "workforce_capability" },
      config,
    );
    return buildWorkforceRecord(
      {
        ...signals,
        recommendationSummary: `Monitor workforce capabilities in ${signals.region} (score=${signals.capabilityScore})`,
      },
      signals.capabilityScore < config.capabilityThreshold ? "partial" : "passed",
    );
  }

  monitorWorkforcePerformance(
    input: WorkforceAnalysisInput,
    config: GlobalTalentIntelligenceConfiguration,
  ): WorkforceIntelligenceRecord {
    const signals = computeStructuralWorkforceSignals(
      { ...input, workforceCategory: "workforce_performance" },
      config,
    );
    return buildWorkforceRecord({
      ...signals,
      recommendationSummary: `Monitor workforce performance in ${signals.region}`,
    });
  }
}
