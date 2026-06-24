import type { ConnectorPollingJob, ConnectorPollingJobCreateInput } from "../models/connector-polling-job.js";
import type {
  ConnectorPollingSchedule,
  ConnectorPollingScheduleCreateInput,
} from "../models/connector-polling-schedule.js";
import type {
  ConnectorPollingResult,
  ConnectorPollingResultCreateInput,
  PollingResultStatus,
} from "../models/connector-polling-result.js";

export type PollingSchedulerJobQuery = {
  workspaceId: string;
  connectorId?: string;
  status?: ConnectorPollingJob["status"];
};

export type PollingSchedulerScheduleQuery = {
  workspaceId: string;
  connectorId?: string;
  enabled?: boolean;
};

export type PollingSchedulerResultQuery = {
  workspaceId: string;
  connectorId?: string;
  status?: PollingResultStatus;
  limit?: number;
  offset?: number;
};

/** Persists connector polling jobs, schedules, and execution results. */
export interface PollingSchedulerRepository {
  createJob(workspaceId: string, input: ConnectorPollingJobCreateInput): Promise<ConnectorPollingJob>;
  getJobById(workspaceId: string, jobId: string): Promise<ConnectorPollingJob | null>;
  getJobByConnector(workspaceId: string, connectorId: string): Promise<ConnectorPollingJob | null>;
  listJobs(query: PollingSchedulerJobQuery): Promise<ConnectorPollingJob[]>;
  updateJob(
    workspaceId: string,
    jobId: string,
    input: Partial<ConnectorPollingJobCreateInput>,
  ): Promise<ConnectorPollingJob>;

  createSchedule(
    workspaceId: string,
    input: ConnectorPollingScheduleCreateInput,
  ): Promise<ConnectorPollingSchedule>;
  getScheduleById(workspaceId: string, scheduleId: string): Promise<ConnectorPollingSchedule | null>;
  getScheduleByJob(workspaceId: string, jobId: string): Promise<ConnectorPollingSchedule | null>;
  listSchedules(query: PollingSchedulerScheduleQuery): Promise<ConnectorPollingSchedule[]>;
  updateSchedule(
    workspaceId: string,
    scheduleId: string,
    input: Partial<Pick<ConnectorPollingSchedule, "enabled" | "lastRunAt" | "nextRunAt" | "intervalSec">>,
  ): Promise<ConnectorPollingSchedule>;

  recordResult(
    workspaceId: string,
    input: ConnectorPollingResultCreateInput,
  ): Promise<ConnectorPollingResult>;
  listResults(query: PollingSchedulerResultQuery): Promise<ConnectorPollingResult[]>;
}
