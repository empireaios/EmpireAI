/** X4-06 — Regulatory Intelligence Engine. */

import type { RegionalComplianceEngineConfiguration } from "./configuration.js";
import {
  buildComplianceRecord,
  computeStructuralComplianceSignals,
} from "./structural-signals.js";
import type { ComplianceAnalysisInput, ComplianceRecord } from "./types.js";

export class RegulatoryIntelligenceEngine {
  manageCountryRequirements(
    input: ComplianceAnalysisInput,
    config: RegionalComplianceEngineConfiguration,
  ): ComplianceRecord {
    const signals = computeStructuralComplianceSignals(
      { ...input, regulationCategory: "country_specific" },
      config,
    );
    return buildComplianceRecord({
      ...signals,
      requiredActions: [
        ...signals.requiredActions,
        `Track country-specific requirements for ${signals.country}`,
      ],
    });
  }

  monitorRegulatoryChanges(
    input: ComplianceAnalysisInput,
    config: RegionalComplianceEngineConfiguration,
  ): ComplianceRecord {
    const signals = computeStructuralComplianceSignals(
      { ...input, regulationCategory: "regulatory_change" },
      config,
    );
    return buildComplianceRecord({
      ...signals,
      requiredActions: [
        ...signals.requiredActions,
        `Monitor regulatory change signals for ${signals.country}`,
      ],
    });
  }
}
