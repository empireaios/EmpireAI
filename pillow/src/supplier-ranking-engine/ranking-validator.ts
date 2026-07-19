/** R2-08 — Ranking Validator. */

import type {
  PerformanceFinding,
  SupplierRankingRecord,
  SupplierRankingValidationReport,
} from "./types.js";
import type { SupplierRankingEngineConfiguration } from "./configuration.js";
import { SRE_METADATA_VERSION } from "./paths.js";
import { RankingValidationEngine } from "./ranking-validation-engine.js";

export class RankingValidator {
  private readonly validationEngine = new RankingValidationEngine();

  validateRankingResult(input: {
    rankings: SupplierRankingRecord[];
    findings: PerformanceFinding[];
    config: SupplierRankingEngineConfiguration;
    startedAt: number;
  }): SupplierRankingValidationReport {
    const { errors, warnings } = this.validationEngine.validateRankings(
      input.rankings,
      input.config,
    );

    const declining = input.findings.filter((f) => f.findingType === "declining");
    if (declining.length) {
      warnings.push(`${declining.length} declining supplier(s) detected`);
    }

    let decision: SupplierRankingValidationReport["decision"] = "pass";
    if (errors.length) {
      decision = warnings.length ? "partial" : "fail";
    } else if (warnings.length) {
      decision = "partial";
    }

    const validatedRankings = input.rankings.map((r) => ({
      ...r,
      validationStatus:
        decision === "pass"
          ? ("passed" as const)
          : decision === "partial"
            ? ("partial" as const)
            : ("failed" as const),
    }));

    input.rankings.splice(0, input.rankings.length, ...validatedRankings);

    return {
      validationReportId: `sre-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - input.startedAt,
      metadataVersion: SRE_METADATA_VERSION,
    };
  }
}
