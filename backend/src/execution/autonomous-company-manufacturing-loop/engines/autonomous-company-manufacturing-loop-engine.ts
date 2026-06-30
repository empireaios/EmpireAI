import type { CompanyManufacturingRecord } from "../models/company-manufacturing-record.js";
import type { CompanyManufacturingRepository } from "../repositories/company-manufacturing-repository.js";
import {
  runAutonomousCompanyManufacturingLoop,
  type CompanyManufacturingLoopInput,
} from "../scoring/autonomous-company-manufacturing-loop-scoring.js";

/** Orchestrates autonomous company manufacturing loop runs. */
export class AutonomousCompanyManufacturingLoopEngine {
  constructor(private readonly repository: CompanyManufacturingRepository) {}

  runManufacturingLoop(input: CompanyManufacturingLoopInput) {
    return runAutonomousCompanyManufacturingLoop(input);
  }

  async runAndSave(input: CompanyManufacturingLoopInput): Promise<CompanyManufacturingRecord> {
    const breakdown = await runAutonomousCompanyManufacturingLoop(input);
    return this.repository.save(input.workspaceId, breakdown);
  }
}

export const defaultAutonomousCompanyManufacturingLoopEngine = {
  runManufacturingLoop: runAutonomousCompanyManufacturingLoop,
};

export type { CompanyManufacturingLoopInput };
