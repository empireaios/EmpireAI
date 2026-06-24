/**
 * Autonomous Investigation Execution module — executes investigation plans into completed investigations.
 */

import { createConnectorRegistryModule } from "../../connector-registry/contract/connector-registry-module.js";
import type { ConnectorRegistryModule } from "../../connector-registry/contract/connector-registry-module.js";
import { createConnectorPollingSchedulerModule } from "../../connector-polling-scheduler/contract/connector-polling-scheduler-module.js";
import type { ConnectorPollingSchedulerModule } from "../../connector-polling-scheduler/contract/connector-polling-scheduler-module.js";
import type { InvestigationPlan } from "../../autonomous-investigation-planner/models/investigation-plan.js";
import {
  InvestigationExecutionEngine,
  createPollingTaskRunner,
  type InvestigationExecutionOptions,
  type InvestigationTaskRunner,
} from "../engines/investigation-execution-engine.js";
import type { ExecutionResult } from "../models/execution-result.js";
import type { InvestigationExecution } from "../models/investigation-execution.js";
import type { InvestigationExecutionTask } from "../models/investigation-execution-task.js";
import type { ExecutionRepository, ExecutionRepositoryQuery } from "../repositories/execution-repository.js";
import { createInMemoryExecutionRepository } from "../repositories/in-memory-execution-repository.js";

export const AUTONOMOUS_INVESTIGATION_EXECUTION_MODULE_ID =
  "autonomous-investigation-execution" as const;
export type AutonomousInvestigationExecutionModuleId =
  typeof AUTONOMOUS_INVESTIGATION_EXECUTION_MODULE_ID;

export const AUTONOMOUS_INVESTIGATION_EXECUTION_MODULE_VERSION = "0.1.0" as const;

export type AutonomousInvestigationExecutionCapability =
  | "autonomous-investigation-execution.start"
  | "autonomous-investigation-execution.retry"
  | "autonomous-investigation-execution.progress"
  | "autonomous-investigation-execution.results";

export const AUTONOMOUS_INVESTIGATION_EXECUTION_CAPABILITIES: readonly AutonomousInvestigationExecutionCapability[] =
  [
    "autonomous-investigation-execution.start",
    "autonomous-investigation-execution.retry",
    "autonomous-investigation-execution.progress",
    "autonomous-investigation-execution.results",
  ] as const;

export type AutonomousInvestigationExecutionModuleContract = {
  moduleId: AutonomousInvestigationExecutionModuleId;
  version: string;
  capabilities: readonly AutonomousInvestigationExecutionCapability[];
};

export const AUTONOMOUS_INVESTIGATION_EXECUTION_MODULE_CONTRACT: AutonomousInvestigationExecutionModuleContract =
  {
    moduleId: AUTONOMOUS_INVESTIGATION_EXECUTION_MODULE_ID,
    version: AUTONOMOUS_INVESTIGATION_EXECUTION_MODULE_VERSION,
    capabilities: AUTONOMOUS_INVESTIGATION_EXECUTION_CAPABILITIES,
  };

/** Orchestrates investigation plan execution, progress, and result tracking. */
export class InvestigationExecutionModule {
  readonly contract = AUTONOMOUS_INVESTIGATION_EXECUTION_MODULE_CONTRACT;
  private readonly engine: InvestigationExecutionEngine;

  constructor(
    private readonly repository: ExecutionRepository,
    connectorRegistry: ConnectorRegistryModule = createConnectorRegistryModule(),
    pollingScheduler: ConnectorPollingSchedulerModule = createConnectorPollingSchedulerModule(),
    taskRunner?: InvestigationTaskRunner,
  ) {
    this.engine = new InvestigationExecutionEngine(
      repository,
      connectorRegistry,
      taskRunner ?? createPollingTaskRunner(pollingScheduler),
    );
  }

  async startInvestigationExecution(
    workspaceId: string,
    plan: InvestigationPlan,
    options: InvestigationExecutionOptions = {},
  ): Promise<InvestigationExecution> {
    return this.engine.startExecution(workspaceId, plan, options);
  }

  async retryInvestigationExecution(
    workspaceId: string,
    plan: InvestigationPlan,
    executionId: string,
  ): Promise<InvestigationExecution> {
    return this.engine.retryExecution(workspaceId, plan, executionId);
  }

  async getInvestigationExecution(
    workspaceId: string,
    executionId: string,
  ): Promise<InvestigationExecution | null> {
    return this.repository.getExecutionById(workspaceId, executionId);
  }

  async getExecutionByPlan(
    workspaceId: string,
    investigationPlanId: string,
  ): Promise<InvestigationExecution | null> {
    return this.repository.getExecutionByPlan(workspaceId, investigationPlanId);
  }

  async listInvestigationExecutions(
    workspaceId: string,
    filters: Omit<ExecutionRepositoryQuery, "workspaceId"> = {},
  ): Promise<InvestigationExecution[]> {
    return this.repository.listExecutions({ workspaceId, ...filters });
  }

  async listExecutionTasks(executionId: string): Promise<InvestigationExecutionTask[]> {
    return this.repository.listExecutionTasks(executionId);
  }

  async listExecutionResults(executionId: string): Promise<ExecutionResult[]> {
    return this.repository.listResults(executionId);
  }
}

/** Factory for an investigation execution module with optional custom dependencies. */
export function createInvestigationExecutionModule(
  repository: ExecutionRepository = createInMemoryExecutionRepository(),
  connectorRegistry: ConnectorRegistryModule = createConnectorRegistryModule(),
  pollingScheduler: ConnectorPollingSchedulerModule = createConnectorPollingSchedulerModule(),
  taskRunner?: InvestigationTaskRunner,
): InvestigationExecutionModule {
  return new InvestigationExecutionModule(
    repository,
    connectorRegistry,
    pollingScheduler,
    taskRunner,
  );
}

export const investigationExecutionModule = createInvestigationExecutionModule();
