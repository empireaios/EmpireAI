import type { ConnectorRegistryModule } from "../../connector-registry/contract/connector-registry-module.js";
import type { ConnectorSignalIngestionModule } from "../../connector-signal-ingestion/contract/connector-signal-ingestion-module.js";
import type { ConnectorIngestionEventInput } from "../../connector-signal-ingestion/models/connector-ingestion-event.js";
import type { ConnectorPollingJob } from "../models/connector-polling-job.js";
import type { ConnectorPollingResult } from "../models/connector-polling-result.js";
import type { ConnectorPollingSchedule } from "../models/connector-polling-schedule.js";
import { isPollableConnector, shouldSkipConnector } from "../planners/connector-polling-planner.js";
import type { PollingSchedulerRepository } from "../repositories/polling-scheduler-repository.js";

export type ConnectorPollContext = {
  workspaceId: string;
  connectorId: string;
  productId: string;
  job: ConnectorPollingJob;
  schedule: ConnectorPollingSchedule;
};

export type ConnectorPollHandler = (context: ConnectorPollContext) => Promise<ConnectorIngestionEventInput>;

export type ConnectorPollingExecuteOptions = {
  manual?: boolean;
  allowUnhealthyConnector?: boolean;
};

/** Default poll handler that synthesizes a scheduled observation payload. */
export async function defaultConnectorPollHandler(
  context: ConnectorPollContext,
): Promise<ConnectorIngestionEventInput> {
  return {
    connectorId: context.connectorId,
    productId: context.productId,
    evidence: [
      {
        kind: "scheduled_poll",
        summary: `Scheduled poll observation for ${context.connectorId}`,
        value: "observed",
        sourceRef: context.schedule.scheduleId,
      },
    ],
    metadata: {
      pollJobId: context.job.jobId,
      scheduleId: context.schedule.scheduleId,
      scheduled: true,
      pollQuery: context.job.pollQuery,
    },
  };
}

/** Executes connector polling runs and forwards observations to ingestion. */
export class ConnectorPollingExecutor {
  constructor(
    private readonly connectorRegistry: ConnectorRegistryModule,
    private readonly ingestionModule: ConnectorSignalIngestionModule,
    private readonly repository: PollingSchedulerRepository,
    private readonly pollHandler: ConnectorPollHandler = defaultConnectorPollHandler,
  ) {}

  async executePoll(
    workspaceId: string,
    job: ConnectorPollingJob,
    schedule: ConnectorPollingSchedule,
    options: ConnectorPollingExecuteOptions = {},
  ): Promise<ConnectorPollingResult> {
    const started = Date.now();
    const polledAt = new Date().toISOString();

    if (!schedule.enabled || job.status === "DISABLED") {
      return this.repository.recordResult(workspaceId, {
        jobId: job.jobId,
        scheduleId: schedule.scheduleId,
        connectorId: job.connectorId,
        status: "SKIPPED",
        reason: "Polling job or schedule is disabled",
        durationMs: Date.now() - started,
        polledAt,
      });
    }

    const connector = await this.connectorRegistry.getConnector(workspaceId, job.connectorId);
    if (!connector) {
      return this.repository.recordResult(workspaceId, {
        jobId: job.jobId,
        scheduleId: schedule.scheduleId,
        connectorId: job.connectorId,
        status: "FAILED",
        reason: "UNKNOWN_CONNECTOR",
        durationMs: Date.now() - started,
        polledAt,
      });
    }

    if (shouldSkipConnector(connector)) {
      return this.repository.recordResult(workspaceId, {
        jobId: job.jobId,
        scheduleId: schedule.scheduleId,
        connectorId: job.connectorId,
        status: "SKIPPED",
        reason: `Connector status is ${connector.status}`,
        durationMs: Date.now() - started,
        polledAt,
      });
    }

    if (!options.manual && !isPollableConnector(connector)) {
      return this.repository.recordResult(workspaceId, {
        jobId: job.jobId,
        scheduleId: schedule.scheduleId,
        connectorId: job.connectorId,
        status: "SKIPPED",
        reason: `Connector is not pollable (${connector.status})`,
        durationMs: Date.now() - started,
        polledAt,
      });
    }

    try {
      const observation = await this.pollHandler({
        workspaceId,
        connectorId: job.connectorId,
        productId: job.productId,
        job,
        schedule,
      });

      const outcome = await this.ingestionModule.ingest(workspaceId, observation, {
        allowUnhealthyConnector: options.allowUnhealthyConnector,
      });

      const durationMs = Date.now() - started;

      if (outcome.result.status !== "SUCCESS") {
        return this.repository.recordResult(workspaceId, {
          jobId: job.jobId,
          scheduleId: schedule.scheduleId,
          connectorId: job.connectorId,
          status: "FAILED",
          reason: outcome.result.reason,
          ingestionResultId: outcome.result.resultId,
          durationMs,
          polledAt,
        });
      }

      return this.repository.recordResult(workspaceId, {
        jobId: job.jobId,
        scheduleId: schedule.scheduleId,
        connectorId: job.connectorId,
        status: "SUCCESS",
        reason: "Polling observation ingested successfully",
        ingestionResultId: outcome.result.resultId,
        signalId: outcome.result.signalId,
        durationMs,
        polledAt,
      });
    } catch (error) {
      return this.repository.recordResult(workspaceId, {
        jobId: job.jobId,
        scheduleId: schedule.scheduleId,
        connectorId: job.connectorId,
        status: "FAILED",
        reason: error instanceof Error ? error.message : "Polling execution failed",
        durationMs: Date.now() - started,
        polledAt,
      });
    }
  }
}
