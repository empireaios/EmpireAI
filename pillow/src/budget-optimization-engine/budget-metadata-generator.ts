/** R5-13 — Budget Metadata Generator. */

import {
  BOE_CAPABILITIES,
  BOE_METADATA_VERSION,
  BUDGET_OPTIMIZATION_ENGINE_ID,
} from "./paths.js";
import type {
  BudgetEngineRecord,
  BudgetRecord,
  BudgetRunReport,
  BudgetValidationReport,
  OperationalState,
  ValidationStatus,
} from "./types.js";

export class BudgetMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    dependencyPresence: BudgetEngineRecord["dependencyPresence"];
  }): BudgetEngineRecord {
    return {
      engineRecordId: `boe-${BUDGET_OPTIMIZATION_ENGINE_ID}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: BUDGET_OPTIMIZATION_ENGINE_ID,
      engineVersion: BOE_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus:
        input.operationalState === "failed"
          ? "failed"
          : input.operationalState === "suspended"
            ? "degraded"
            : "healthy",
      validationStatus: input.validationStatus,
      supportedCapabilities: [...BOE_CAPABILITIES],
      frameworkModuleId: input.frameworkModuleId,
      dependencyPresence: input.dependencyPresence,
      metadataVersion: BOE_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: BudgetRunReport["action"];
    engineRecord: BudgetEngineRecord;
    budgetRecords: BudgetRecord[];
    validation: BudgetValidationReport;
    durationMs: number;
  }): BudgetRunReport {
    return {
      budgetRunReportId: `boe-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      budgetRecords: input.budgetRecords,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: BOE_METADATA_VERSION,
    };
  }
}
