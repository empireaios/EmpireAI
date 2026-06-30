/**
 * Autonomous Company Manufacturing Loop module — manufactures companies end-to-end.
 */

import {
  AutonomousCompanyManufacturingLoopEngine,
  defaultAutonomousCompanyManufacturingLoopEngine,
  type CompanyManufacturingLoopInput,
} from "../engines/autonomous-company-manufacturing-loop-engine.js";
import type { CompanyManufacturingRecord } from "../models/company-manufacturing-record.js";
import {
  autonomousCompanyManufacturingLoopScoring,
  runAutonomousCompanyManufacturingLoop,
} from "../scoring/autonomous-company-manufacturing-loop-scoring.js";
import type {
  CompanyManufacturingRepository,
  CompanyManufacturingRepositoryQuery,
} from "../repositories/company-manufacturing-repository.js";
import { createInMemoryCompanyManufacturingRepository } from "../repositories/in-memory-company-manufacturing-repository.js";

export const AUTONOMOUS_COMPANY_MANUFACTURING_LOOP_MODULE_ID =
  "autonomous-company-manufacturing-loop" as const;
export type AutonomousCompanyManufacturingLoopModuleId =
  typeof AUTONOMOUS_COMPANY_MANUFACTURING_LOOP_MODULE_ID;

export const AUTONOMOUS_COMPANY_MANUFACTURING_LOOP_MODULE_VERSION = "0.1.0" as const;

export type AutonomousCompanyManufacturingLoopCapability =
  | "autonomous-company-manufacturing-loop.run"
  | "autonomous-company-manufacturing-loop.persist"
  | "autonomous-company-manufacturing-loop.list";

export const AUTONOMOUS_COMPANY_MANUFACTURING_LOOP_CAPABILITIES: readonly AutonomousCompanyManufacturingLoopCapability[] =
  [
    "autonomous-company-manufacturing-loop.run",
    "autonomous-company-manufacturing-loop.persist",
    "autonomous-company-manufacturing-loop.list",
  ] as const;

export type AutonomousCompanyManufacturingLoopModuleContract = {
  moduleId: AutonomousCompanyManufacturingLoopModuleId;
  version: string;
  capabilities: readonly AutonomousCompanyManufacturingLoopCapability[];
};

export const AUTONOMOUS_COMPANY_MANUFACTURING_LOOP_MODULE_CONTRACT: AutonomousCompanyManufacturingLoopModuleContract =
  {
    moduleId: AUTONOMOUS_COMPANY_MANUFACTURING_LOOP_MODULE_ID,
    version: AUTONOMOUS_COMPANY_MANUFACTURING_LOOP_MODULE_VERSION,
    capabilities: AUTONOMOUS_COMPANY_MANUFACTURING_LOOP_CAPABILITIES,
  };

/** Orchestrates the full Eye → Deployment company manufacturing loop. */
export class AutonomousCompanyManufacturingLoopModule {
  readonly contract = AUTONOMOUS_COMPANY_MANUFACTURING_LOOP_MODULE_CONTRACT;
  private readonly engine: AutonomousCompanyManufacturingLoopEngine;

  constructor(
    private readonly repository: CompanyManufacturingRepository,
    engine?: AutonomousCompanyManufacturingLoopEngine,
  ) {
    this.engine =
      engine ?? new AutonomousCompanyManufacturingLoopEngine(repository);
  }

  runAutonomousCompanyManufacturingLoop = runAutonomousCompanyManufacturingLoop;
  scoring = autonomousCompanyManufacturingLoopScoring;

  runManufacturingLoop(input: CompanyManufacturingLoopInput) {
    return this.engine.runManufacturingLoop(input);
  }

  async persistManufacturingRun(
    input: CompanyManufacturingLoopInput,
  ): Promise<CompanyManufacturingRecord> {
    return this.engine.runAndSave(input);
  }

  async getManufacturingRecord(
    workspaceId: string,
    recordId: string,
  ): Promise<CompanyManufacturingRecord | null> {
    return this.repository.getById(workspaceId, recordId);
  }

  async getLatestManufacturingRun(
    workspaceId: string,
  ): Promise<CompanyManufacturingRecord | null> {
    return this.repository.getLatest(workspaceId);
  }

  async getManufacturingRunByProduct(
    workspaceId: string,
    productId: string,
  ): Promise<CompanyManufacturingRecord | null> {
    return this.repository.getByProduct(workspaceId, productId);
  }

  async listManufacturingRecords(
    workspaceId: string,
    filters: Omit<CompanyManufacturingRepositoryQuery, "workspaceId"> = {},
  ): Promise<CompanyManufacturingRecord[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for an autonomous company manufacturing loop module. */
export function createAutonomousCompanyManufacturingLoopModule(
  repository: CompanyManufacturingRepository = createInMemoryCompanyManufacturingRepository(),
  engine?: AutonomousCompanyManufacturingLoopEngine,
): AutonomousCompanyManufacturingLoopModule {
  return new AutonomousCompanyManufacturingLoopModule(
    repository,
    engine ?? new AutonomousCompanyManufacturingLoopEngine(repository),
  );
}

export const autonomousCompanyManufacturingLoopModule =
  createAutonomousCompanyManufacturingLoopModule();

export type { CompanyManufacturingLoopInput };

export { defaultAutonomousCompanyManufacturingLoopEngine };
