/** X4-06 — Compliance Rules Engine. */

import type { RegionalComplianceEngineConfiguration } from "./configuration.js";
import {
  buildComplianceRecord,
  computeStructuralComplianceSignals,
} from "./structural-signals.js";
import type { ComplianceAnalysisInput, ComplianceRecord } from "./types.js";

export class ComplianceRulesEngine {
  manageBusinessRules(
    input: ComplianceAnalysisInput,
    config: RegionalComplianceEngineConfiguration,
  ): ComplianceRecord {
    const signals = computeStructuralComplianceSignals(
      { ...input, regulationCategory: "business_rules" },
      config,
    );
    return buildComplianceRecord({
      ...signals,
      requiredActions: [
        ...signals.requiredActions,
        `Apply regional business rules for ${signals.country}`,
      ],
    });
  }
}
