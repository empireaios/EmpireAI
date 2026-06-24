/**
 * Autonomous Investigation Planner module — converts priorities into investigation plans.
 */

import { createConnectorRegistryModule } from "../../connector-registry/contract/connector-registry-module.js";
import type { ConnectorRegistryModule } from "../../connector-registry/contract/connector-registry-module.js";
import type { InvestigationPriority } from "../../investigation-priority-intelligence/models/investigation-priority.js";
import type { InvestigationTarget } from "../../investigation-priority-intelligence/models/investigation-target.js";
import type { SourceTrustProfile } from "../../source-trust-intelligence/models/source-trust-profile.js";
import {
  InvestigationPlanningEngine,
  defaultInvestigationPlanningEngine,
  type InvestigationPlanningInput,
} from "../engines/investigation-planning-engine.js";
import type { InvestigationPlan } from "../models/investigation-plan.js";
import type {
  InvestigationPlanRepositoryQuery,
  InvestigationRepository,
} from "../repositories/investigation-repository.js";
import { createInMemoryInvestigationRepository } from "../repositories/in-memory-investigation-repository.js";

export const AUTONOMOUS_INVESTIGATION_PLANNER_MODULE_ID =
  "autonomous-investigation-planner" as const;
export type AutonomousInvestigationPlannerModuleId =
  typeof AUTONOMOUS_INVESTIGATION_PLANNER_MODULE_ID;

export const AUTONOMOUS_INVESTIGATION_PLANNER_MODULE_VERSION = "0.1.0" as const;

export type AutonomousInvestigationPlannerCapability =
  | "autonomous-investigation-planner.plan"
  | "autonomous-investigation-planner.persist"
  | "autonomous-investigation-planner.list";

export const AUTONOMOUS_INVESTIGATION_PLANNER_CAPABILITIES: readonly AutonomousInvestigationPlannerCapability[] =
  [
    "autonomous-investigation-planner.plan",
    "autonomous-investigation-planner.persist",
    "autonomous-investigation-planner.list",
  ] as const;

export type AutonomousInvestigationPlannerModuleContract = {
  moduleId: AutonomousInvestigationPlannerModuleId;
  version: string;
  capabilities: readonly AutonomousInvestigationPlannerCapability[];
};

export const AUTONOMOUS_INVESTIGATION_PLANNER_MODULE_CONTRACT: AutonomousInvestigationPlannerModuleContract =
  {
    moduleId: AUTONOMOUS_INVESTIGATION_PLANNER_MODULE_ID,
    version: AUTONOMOUS_INVESTIGATION_PLANNER_MODULE_VERSION,
    capabilities: AUTONOMOUS_INVESTIGATION_PLANNER_CAPABILITIES,
  };

export type CreateInvestigationPlanInput = {
  target: InvestigationTarget;
  priority: InvestigationPriority;
  trustProfiles?: SourceTrustProfile[];
};

/** Orchestrates investigation planning and persistence. */
export class InvestigationPlannerModule {
  readonly contract = AUTONOMOUS_INVESTIGATION_PLANNER_MODULE_CONTRACT;
  private readonly engine: InvestigationPlanningEngine;

  constructor(
    private readonly repository: InvestigationRepository,
    private readonly connectorRegistry: ConnectorRegistryModule = createConnectorRegistryModule(),
    engine: InvestigationPlanningEngine = defaultInvestigationPlanningEngine,
  ) {
    this.engine = engine;
  }

  async createInvestigationPlan(
    workspaceId: string,
    input: CreateInvestigationPlanInput,
  ): Promise<InvestigationPlan> {
    const connectors = await this.connectorRegistry.listConnectors(workspaceId);
    const planningInput: InvestigationPlanningInput = {
      target: input.target,
      priority: input.priority,
      trustProfiles: input.trustProfiles ?? [],
      connectors,
    };

    const planInput = this.engine.plan(planningInput);
    return this.repository.savePlan(workspaceId, planInput);
  }

  planInvestigation(input: InvestigationPlanningInput): InvestigationPlan["tasks"] {
    return this.engine.plan(input).tasks;
  }

  async getInvestigationPlan(
    workspaceId: string,
    targetId: string,
  ): Promise<InvestigationPlan | null> {
    return this.repository.getPlanByTarget(workspaceId, targetId);
  }

  async listInvestigationPlans(
    workspaceId: string,
    filters: Omit<InvestigationPlanRepositoryQuery, "workspaceId"> = {},
  ): Promise<InvestigationPlan[]> {
    return this.repository.listPlans({ workspaceId, ...filters });
  }
}

/** Factory for an investigation planner module with optional custom dependencies. */
export function createInvestigationPlannerModule(
  repository: InvestigationRepository = createInMemoryInvestigationRepository(),
  connectorRegistry: ConnectorRegistryModule = createConnectorRegistryModule(),
  engine: InvestigationPlanningEngine = defaultInvestigationPlanningEngine,
): InvestigationPlannerModule {
  return new InvestigationPlannerModule(repository, connectorRegistry, engine);
}

export const investigationPlannerModule = createInvestigationPlannerModule();
