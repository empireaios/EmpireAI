/** X2-20 — Enterprise Governance Engine. */

import type { AutonomousPortfolioBoardConfiguration } from "./configuration.js";
import type { ExecutiveBoardRecord } from "./types.js";

export class EnterpriseGovernanceEngine {
  enforce(input: {
    records: ExecutiveBoardRecord[];
    config: AutonomousPortfolioBoardConfiguration;
  }): { records: ExecutiveBoardRecord[]; warnings: string[] } {
    const warnings: string[] = [];
    if (!input.config.governancePoliciesEnabled) {
      warnings.push("Governance policies disabled");
    }
    if (!input.config.requireApprovalForStrategicExecution) {
      warnings.push("Strategic execution still requires approval by safety policy");
    }

    const records = input.records.map((record) => ({
      ...record,
      autoExecutionBlocked: true as const,
      structuralSignalOnly: true as const,
      sensitiveEnterpriseData: false as const,
      recommendedDecisions: record.recommendedDecisions.map(
        (d) => `${d} (approval required)`,
      ),
    }));

    warnings.push(
      "Strategic decisions never execute automatically beyond configured approval policies",
    );
    return { records, warnings };
  }
}
