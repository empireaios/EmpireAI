/**
 * Founder Command Center module — Grand King's master dashboard for all companies.
 */

import {
  FounderCommandCenterEngine,
  defaultFounderCommandCenterEngine,
  type FounderCommandCenterInput,
} from "../engines/founder-command-center-engine.js";
import type { FounderCommandCenterRecord } from "../models/founder-command-center-record.js";
import {
  founderCommandCenterScoring,
  generateFounderCommandCenter,
} from "../scoring/founder-command-center-scoring.js";
import type {
  FounderCommandCenterRepository,
  FounderCommandCenterRepositoryQuery,
} from "../repositories/founder-command-center-repository.js";
import { createInMemoryFounderCommandCenterRepository } from "../repositories/in-memory-founder-command-center-repository.js";

export const FOUNDER_COMMAND_CENTER_MODULE_ID = "founder-command-center" as const;
export type FounderCommandCenterModuleId = typeof FOUNDER_COMMAND_CENTER_MODULE_ID;

export const FOUNDER_COMMAND_CENTER_MODULE_VERSION = "0.1.0" as const;

export type FounderCommandCenterCapability =
  | "founder-command-center.synthesize"
  | "founder-command-center.snapshot"
  | "founder-command-center.persist"
  | "founder-command-center.list";

export const FOUNDER_COMMAND_CENTER_CAPABILITIES: readonly FounderCommandCenterCapability[] = [
  "founder-command-center.synthesize",
  "founder-command-center.snapshot",
  "founder-command-center.persist",
  "founder-command-center.list",
] as const;

export type FounderCommandCenterModuleContract = {
  moduleId: FounderCommandCenterModuleId;
  version: string;
  capabilities: readonly FounderCommandCenterCapability[];
};

export const FOUNDER_COMMAND_CENTER_MODULE_CONTRACT: FounderCommandCenterModuleContract = {
  moduleId: FOUNDER_COMMAND_CENTER_MODULE_ID,
  version: FOUNDER_COMMAND_CENTER_MODULE_VERSION,
  capabilities: FOUNDER_COMMAND_CENTER_CAPABILITIES,
};

/** Orchestrates founder command center dashboard synthesis and persistence. */
export class FounderCommandCenterModule {
  readonly contract = FOUNDER_COMMAND_CENTER_MODULE_CONTRACT;
  private readonly engine: FounderCommandCenterEngine;

  constructor(
    private readonly repository: FounderCommandCenterRepository,
    engine?: FounderCommandCenterEngine,
  ) {
    this.engine = engine ?? new FounderCommandCenterEngine(repository);
  }

  generateFounderCommandCenter = generateFounderCommandCenter;
  scoring = founderCommandCenterScoring;

  synthesizeDashboard(input: FounderCommandCenterInput) {
    return this.engine.synthesizeDashboard(input);
  }

  async persistDashboard(
    workspaceId: string,
    input: FounderCommandCenterInput,
  ): Promise<FounderCommandCenterRecord> {
    return this.engine.synthesizeAndSave(workspaceId, input);
  }

  async getDashboardRecord(
    workspaceId: string,
    recordId: string,
  ): Promise<FounderCommandCenterRecord | null> {
    return this.repository.getById(workspaceId, recordId);
  }

  async getLatestDashboard(
    workspaceId: string,
  ): Promise<FounderCommandCenterRecord | null> {
    return this.repository.getLatest(workspaceId);
  }

  async listDashboardRecords(
    workspaceId: string,
    filters: Omit<FounderCommandCenterRepositoryQuery, "workspaceId"> = {},
  ): Promise<FounderCommandCenterRecord[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a founder command center module with optional custom dependencies. */
export function createFounderCommandCenterModule(
  repository: FounderCommandCenterRepository = createInMemoryFounderCommandCenterRepository(),
  engine?: FounderCommandCenterEngine,
): FounderCommandCenterModule {
  return new FounderCommandCenterModule(
    repository,
    engine ?? new FounderCommandCenterEngine(repository),
  );
}

export const founderCommandCenterModule = createFounderCommandCenterModule();

export type { FounderCommandCenterInput };

export { defaultFounderCommandCenterEngine };
