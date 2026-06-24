import type { EyeConnector } from "../../connector-registry/models/eye-connector.js";
import type { ConnectorRegistryModule } from "../../connector-registry/contract/connector-registry-module.js";
import type { ConnectorPollingJobCreateInput } from "../models/connector-polling-job.js";
import {
  calculateNextRunAt,
  type ConnectorPollingSchedule,
} from "../models/connector-polling-schedule.js";
import type { PollingSchedulerRepository } from "../repositories/polling-scheduler-repository.js";

export type ConnectorPollingPlanOptions = {
  defaultIntervalSec?: number;
  defaultProductId?: string;
  productIdByConnector?: Record<string, string>;
};

export type ConnectorPollingPlan = {
  jobsCreated: number;
  schedulesCreated: number;
  skippedConnectorIds: string[];
};

const SKIPPED_CONNECTOR_STATUSES = new Set(["PAUSED", "DISABLED"]);

/** Returns true when a connector should not receive polling jobs. */
export function shouldSkipConnector(connector: EyeConnector): boolean {
  return SKIPPED_CONNECTOR_STATUSES.has(connector.status);
}

/** Returns true when a connector is eligible for automated polling. */
export function isPollableConnector(connector: EyeConnector): boolean {
  return connector.status === "ACTIVE" && !shouldSkipConnector(connector);
}

/** Plans polling jobs and schedules for active registered connectors. */
export class ConnectorPollingPlanner {
  constructor(
    private readonly connectorRegistry: ConnectorRegistryModule,
    private readonly repository: PollingSchedulerRepository,
  ) {}

  async planActiveConnectorJobs(
    workspaceId: string,
    options: ConnectorPollingPlanOptions = {},
  ): Promise<ConnectorPollingPlan> {
    const intervalSec = options.defaultIntervalSec ?? 3600;
    const defaultProductId = options.defaultProductId ?? "prod-eye-poll-default";
    const connectors = await this.connectorRegistry.listConnectors(workspaceId);
    const skippedConnectorIds: string[] = [];
    let jobsCreated = 0;
    let schedulesCreated = 0;

    for (const connector of connectors) {
      if (!isPollableConnector(connector)) {
        skippedConnectorIds.push(connector.connectorId);
        continue;
      }

      const existingJob = await this.repository.getJobByConnector(
        workspaceId,
        connector.connectorId,
      );
      if (existingJob) {
        continue;
      }

      const productId =
        options.productIdByConnector?.[connector.connectorId] ??
        `${defaultProductId}-${connector.connectorId}`;

      const jobInput: ConnectorPollingJobCreateInput = {
        connectorId: connector.connectorId,
        productId,
        pollQuery: { connectorType: connector.connectorType },
      };

      const job = await this.repository.createJob(workspaceId, jobInput);
      jobsCreated += 1;

      const nowIso = new Date().toISOString();
      await this.repository.createSchedule(workspaceId, {
        jobId: job.jobId,
        connectorId: connector.connectorId,
        intervalSec,
        enabled: true,
        nextRunAt: nowIso,
      });
      schedulesCreated += 1;
    }

    return { jobsCreated, schedulesCreated, skippedConnectorIds };
  }

  calculateNextRunAt(fromIso: string, intervalSec: number): string {
    return calculateNextRunAt(fromIso, intervalSec);
  }

  buildScheduleAfterRun(
    schedule: ConnectorPollingSchedule,
    runAtIso: string,
  ): Pick<ConnectorPollingSchedule, "lastRunAt" | "nextRunAt"> {
    return {
      lastRunAt: runAtIso,
      nextRunAt: this.calculateNextRunAt(runAtIso, schedule.intervalSec),
    };
  }
}

export const connectorPollingPlanner = {
  shouldSkipConnector,
  isPollableConnector,
  calculateNextRunAt,
} as const;
