/**
 * Connector Polling Scheduler module — continuous Eye observation without manual triggering.
 */

import { createConnectorRegistryModule } from "../../connector-registry/contract/connector-registry-module.js";
import type { ConnectorRegistryModule } from "../../connector-registry/contract/connector-registry-module.js";
import { createConnectorSignalIngestionModule } from "../../connector-signal-ingestion/contract/connector-signal-ingestion-module.js";
import type { ConnectorSignalIngestionModule } from "../../connector-signal-ingestion/contract/connector-signal-ingestion-module.js";
import {
  ConnectorPollingExecutor,
  defaultConnectorPollHandler,
  type ConnectorPollHandler,
  type ConnectorPollingExecuteOptions,
} from "../executors/connector-polling-executor.js";
import type { ConnectorPollingJob, ConnectorPollingJobCreateInput } from "../models/connector-polling-job.js";
import type { ConnectorPollingResult } from "../models/connector-polling-result.js";
import {
  calculateNextRunAt,
  isScheduleDue,
  type ConnectorPollingSchedule,
  type ConnectorPollingScheduleCreateInput,
} from "../models/connector-polling-schedule.js";
import {
  ConnectorPollingPlanner,
  type ConnectorPollingPlan,
  type ConnectorPollingPlanOptions,
} from "../planners/connector-polling-planner.js";
import type {
  PollingSchedulerRepository,
  PollingSchedulerResultQuery,
  PollingSchedulerScheduleQuery,
} from "../repositories/polling-scheduler-repository.js";
import { createInMemoryPollingSchedulerRepository } from "../repositories/in-memory-polling-scheduler-repository.js";

export const CONNECTOR_POLLING_SCHEDULER_MODULE_ID = "connector-polling-scheduler" as const;
export type ConnectorPollingSchedulerModuleId = typeof CONNECTOR_POLLING_SCHEDULER_MODULE_ID;

export const CONNECTOR_POLLING_SCHEDULER_MODULE_VERSION = "0.1.0" as const;

export type ConnectorPollingSchedulerCapability =
  | "connector-polling-scheduler.plan"
  | "connector-polling-scheduler.schedule"
  | "connector-polling-scheduler.execute"
  | "connector-polling-scheduler.trigger"
  | "connector-polling-scheduler.results";

export const CONNECTOR_POLLING_SCHEDULER_CAPABILITIES: readonly ConnectorPollingSchedulerCapability[] =
  [
    "connector-polling-scheduler.plan",
    "connector-polling-scheduler.schedule",
    "connector-polling-scheduler.execute",
    "connector-polling-scheduler.trigger",
    "connector-polling-scheduler.results",
  ] as const;

export type ConnectorPollingSchedulerModuleContract = {
  moduleId: ConnectorPollingSchedulerModuleId;
  version: string;
  capabilities: readonly ConnectorPollingSchedulerCapability[];
};

export const CONNECTOR_POLLING_SCHEDULER_MODULE_CONTRACT: ConnectorPollingSchedulerModuleContract = {
  moduleId: CONNECTOR_POLLING_SCHEDULER_MODULE_ID,
  version: CONNECTOR_POLLING_SCHEDULER_MODULE_VERSION,
  capabilities: CONNECTOR_POLLING_SCHEDULER_CAPABILITIES,
};

/** Orchestrates connector polling plans, schedules, execution, and result tracking. */
export class ConnectorPollingSchedulerModule {
  readonly contract = CONNECTOR_POLLING_SCHEDULER_MODULE_CONTRACT;
  private readonly planner: ConnectorPollingPlanner;
  private readonly executor: ConnectorPollingExecutor;

  constructor(
    private readonly repository: PollingSchedulerRepository,
    connectorRegistry: ConnectorRegistryModule = createConnectorRegistryModule(),
    ingestionModule: ConnectorSignalIngestionModule = createConnectorSignalIngestionModule(),
    pollHandler: ConnectorPollHandler = defaultConnectorPollHandler,
  ) {
    this.planner = new ConnectorPollingPlanner(connectorRegistry, repository);
    this.executor = new ConnectorPollingExecutor(
      connectorRegistry,
      ingestionModule,
      repository,
      pollHandler,
    );
  }

  async planActiveConnectorJobs(
    workspaceId: string,
    options: ConnectorPollingPlanOptions = {},
  ): Promise<ConnectorPollingPlan> {
    return this.planner.planActiveConnectorJobs(workspaceId, options);
  }

  async createPollingJob(
    workspaceId: string,
    input: ConnectorPollingJobCreateInput,
  ): Promise<ConnectorPollingJob> {
    return this.repository.createJob(workspaceId, input);
  }

  async createPollingSchedule(
    workspaceId: string,
    input: ConnectorPollingScheduleCreateInput,
  ): Promise<ConnectorPollingSchedule> {
    return this.repository.createSchedule(workspaceId, input);
  }

  async runDuePolls(
    workspaceId: string,
    nowIso: string = new Date().toISOString(),
    options: ConnectorPollingExecuteOptions = {},
  ): Promise<ConnectorPollingResult[]> {
    const schedules = await this.repository.listSchedules({ workspaceId, enabled: true });
    const results: ConnectorPollingResult[] = [];

    for (const schedule of schedules) {
      if (!isScheduleDue(schedule, nowIso)) {
        continue;
      }

      const job = await this.repository.getJobById(workspaceId, schedule.jobId);
      if (!job) {
        continue;
      }

      const result = await this.executor.executePoll(workspaceId, job, schedule, options);
      await this.repository.updateSchedule(workspaceId, schedule.scheduleId, {
        ...this.planner.buildScheduleAfterRun(schedule, result.polledAt),
      });
      results.push(result);
    }

    return results;
  }

  async triggerManualPoll(
    workspaceId: string,
    jobId: string,
    options: ConnectorPollingExecuteOptions = { manual: true },
  ): Promise<ConnectorPollingResult> {
    const job = await this.repository.getJobById(workspaceId, jobId);
    if (!job) {
      throw new Error(`Polling job not found: ${jobId}`);
    }

    const schedule = await this.repository.getScheduleByJob(workspaceId, jobId);
    if (!schedule) {
      throw new Error(`Polling schedule not found for job: ${jobId}`);
    }

    const result = await this.executor.executePoll(workspaceId, job, schedule, {
      ...options,
      manual: true,
    });

    await this.repository.updateSchedule(workspaceId, schedule.scheduleId, {
      ...this.planner.buildScheduleAfterRun(schedule, result.polledAt),
    });

    return result;
  }

  calculateNextRunAt(fromIso: string, intervalSec: number): string {
    return calculateNextRunAt(fromIso, intervalSec);
  }

  async listSchedules(
    workspaceId: string,
    filters: Omit<PollingSchedulerScheduleQuery, "workspaceId"> = {},
  ): Promise<ConnectorPollingSchedule[]> {
    return this.repository.listSchedules({ workspaceId, ...filters });
  }

  async listPollingResults(
    workspaceId: string,
    filters: Omit<PollingSchedulerResultQuery, "workspaceId"> = {},
  ): Promise<ConnectorPollingResult[]> {
    return this.repository.listResults({ workspaceId, ...filters });
  }
}

/** Factory for a connector polling scheduler module with optional custom dependencies. */
export function createConnectorPollingSchedulerModule(
  repository: PollingSchedulerRepository = createInMemoryPollingSchedulerRepository(),
  connectorRegistry: ConnectorRegistryModule = createConnectorRegistryModule(),
  ingestionModule: ConnectorSignalIngestionModule = createConnectorSignalIngestionModule(),
  pollHandler: ConnectorPollHandler = defaultConnectorPollHandler,
): ConnectorPollingSchedulerModule {
  return new ConnectorPollingSchedulerModule(
    repository,
    connectorRegistry,
    ingestionModule,
    pollHandler,
  );
}

export const connectorPollingSchedulerModule = createConnectorPollingSchedulerModule();
