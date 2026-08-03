/** X4-06 — Compliance Assessment Engine. */

import type { RegionalComplianceEngineConfiguration } from "./configuration.js";
import {
  buildComplianceRecord,
  computeStructuralComplianceSignals,
} from "./structural-signals.js";
import type {
  ComplianceAnalysisInput,
  ComplianceRecord,
  RegulationCategory,
} from "./types.js";

export class ComplianceAssessmentEngine {
  assess(
    input: ComplianceAnalysisInput,
    config: RegionalComplianceEngineConfiguration,
    category: RegulationCategory,
  ): ComplianceRecord {
    const signals = computeStructuralComplianceSignals(
      { ...input, regulationCategory: category },
      config,
    );
    return buildComplianceRecord({
      ...signals,
      requiredActions: [
        ...signals.requiredActions,
        `Assess ${category} compliance for ${signals.country} (no false certification)`,
      ],
    });
  }
}
