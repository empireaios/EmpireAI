import { randomUUID } from "node:crypto";

import type {
  ConnectorPollingJob,
  ConnectorPollingJobCreateInput,
} from "../models/connector-polling-job.js";
import type {
  ConnectorPollingSchedule,
  ConnectorPollingScheduleCreateInput,
} from "../models/connector-polling-schedule.js";
import type {
  ConnectorPollingResult,
  ConnectorPollingResultCreateInput,
} from "../models/connector-polling-result.js";
import type {
  PollingSchedulerJobQuery,
  PollingSchedulerRepository,
  PollingSchedulerResultQuery,
  PollingSchedulerScheduleQuery,
} from "./polling-scheduler-repository.js";

function jobKey(workspaceId: string, jobId: string): string {
  return `${workspaceId}:job:${jobId}`;
}

function scheduleKey(workspaceId: string, scheduleId: string): string {
  return `${workspaceId}:schedule:${scheduleId}`;
}

function resultKey(workspaceId: string, resultId: string): string {
  return `${workspaceId}:result:${resultId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

/** In-memory PollingSchedulerRepository for Mission 037 tests and local development. */
export class InMemoryPollingSchedulerRepository implements PollingSchedulerRepository {
  private readonly jobs = new Map<string, ConnectorPollingJob>();
  private readonly schedules = new Map<string, ConnectorPollingSchedule>();
  private readonly results = new Map<string, ConnectorPollingResult>();
  private readonly connectorJobIndex = new Map<string, string>();

  async createJob(
    workspaceId: string,
    input: ConnectorPollingJobCreateInput,
  ): Promise<ConnectorPollingJob> {
    const timestamp = nowIso();
    const job: ConnectorPollingJob = {
      jobId: randomUUID(),
      workspaceId,
      connectorId: input.connectorId,
      productId: input.productId,
      status: input.status ?? "ACTIVE",
      pollQuery: input.pollQuery ?? {},
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.jobs.set(jobKey(workspaceId, job.jobId), job);
    this.connectorJobIndex.set(`${workspaceId}:${input.connectorId}`, job.jobId);
    return structuredClone(job);
  }

  async getJobById(workspaceId: string, jobId: string): Promise<ConnectorPollingJob | null> {
    const job = this.jobs.get(jobKey(workspaceId, jobId));
    return job ? structuredClone(job) : null;
  }

  async getJobByConnector(
    workspaceId: string,
    connectorId: string,
  ): Promise<ConnectorPollingJob | null> {
    const jobId = this.connectorJobIndex.get(`${workspaceId}:${connectorId}`);
    if (!jobId) {
      return null;
    }
    return this.getJobById(workspaceId, jobId);
  }

  async listJobs(query: PollingSchedulerJobQuery): Promise<ConnectorPollingJob[]> {
    let results = [...this.jobs.values()].filter((job) => job.workspaceId === query.workspaceId);
    if (query.connectorId) {
      results = results.filter((job) => job.connectorId === query.connectorId);
    }
    if (query.status) {
      results = results.filter((job) => job.status === query.status);
    }
    return results.map((job) => structuredClone(job));
  }

  async updateJob(
    workspaceId: string,
    jobId: string,
    input: Partial<ConnectorPollingJobCreateInput>,
  ): Promise<ConnectorPollingJob> {
    const key = jobKey(workspaceId, jobId);
    const existing = this.jobs.get(key);
    if (!existing) {
      throw new Error(`Polling job not found: ${jobId}`);
    }

    const updated: ConnectorPollingJob = {
      ...existing,
      productId: input.productId ?? existing.productId,
      status: input.status ?? existing.status,
      pollQuery: input.pollQuery ?? existing.pollQuery,
      updatedAt: nowIso(),
    };
    this.jobs.set(key, updated);
    return structuredClone(updated);
  }

  async createSchedule(
    workspaceId: string,
    input: ConnectorPollingScheduleCreateInput,
  ): Promise<ConnectorPollingSchedule> {
    const timestamp = nowIso();
    const schedule: ConnectorPollingSchedule = {
      scheduleId: randomUUID(),
      jobId: input.jobId,
      workspaceId,
      connectorId: input.connectorId,
      intervalSec: input.intervalSec,
      enabled: input.enabled ?? true,
      lastRunAt: null,
      nextRunAt: input.nextRunAt ?? calculateInitialNextRunAt(timestamp, input.intervalSec),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.schedules.set(scheduleKey(workspaceId, schedule.scheduleId), schedule);
    return structuredClone(schedule);
  }

  async getScheduleById(
    workspaceId: string,
    scheduleId: string,
  ): Promise<ConnectorPollingSchedule | null> {
    const schedule = this.schedules.get(scheduleKey(workspaceId, scheduleId));
    return schedule ? structuredClone(schedule) : null;
  }

  async getScheduleByJob(
    workspaceId: string,
    jobId: string,
  ): Promise<ConnectorPollingSchedule | null> {
    const schedule = [...this.schedules.values()].find(
      (entry) => entry.workspaceId === workspaceId && entry.jobId === jobId,
    );
    return schedule ? structuredClone(schedule) : null;
  }

  async listSchedules(query: PollingSchedulerScheduleQuery): Promise<ConnectorPollingSchedule[]> {
    let results = [...this.schedules.values()].filter(
      (schedule) => schedule.workspaceId === query.workspaceId,
    );
    if (query.connectorId) {
      results = results.filter((schedule) => schedule.connectorId === query.connectorId);
    }
    if (query.enabled !== undefined) {
      results = results.filter((schedule) => schedule.enabled === query.enabled);
    }
    return results.map((schedule) => structuredClone(schedule));
  }

  async updateSchedule(
    workspaceId: string,
    scheduleId: string,
    input: Partial<
      Pick<ConnectorPollingSchedule, "enabled" | "lastRunAt" | "nextRunAt" | "intervalSec">
    >,
  ): Promise<ConnectorPollingSchedule> {
    const key = scheduleKey(workspaceId, scheduleId);
    const existing = this.schedules.get(key);
    if (!existing) {
      throw new Error(`Polling schedule not found: ${scheduleId}`);
    }

    const updated: ConnectorPollingSchedule = {
      ...existing,
      intervalSec: input.intervalSec ?? existing.intervalSec,
      enabled: input.enabled ?? existing.enabled,
      lastRunAt: input.lastRunAt === undefined ? existing.lastRunAt : input.lastRunAt,
      nextRunAt: input.nextRunAt === undefined ? existing.nextRunAt : input.nextRunAt,
      updatedAt: nowIso(),
    };
    this.schedules.set(key, updated);
    return structuredClone(updated);
  }

  async recordResult(
    workspaceId: string,
    input: ConnectorPollingResultCreateInput,
  ): Promise<ConnectorPollingResult> {
    const result: ConnectorPollingResult = {
      resultId: randomUUID(),
      jobId: input.jobId,
      scheduleId: input.scheduleId,
      workspaceId,
      connectorId: input.connectorId,
      status: input.status,
      reason: input.reason,
      ingestionResultId: input.ingestionResultId ?? null,
      signalId: input.signalId ?? null,
      durationMs: input.durationMs,
      polledAt: input.polledAt ?? nowIso(),
    };

    this.results.set(resultKey(workspaceId, result.resultId), result);
    return structuredClone(result);
  }

  async listResults(query: PollingSchedulerResultQuery): Promise<ConnectorPollingResult[]> {
    let results = [...this.results.values()].filter(
      (result) => result.workspaceId === query.workspaceId,
    );
    if (query.connectorId) {
      results = results.filter((result) => result.connectorId === query.connectorId);
    }
    if (query.status) {
      results = results.filter((result) => result.status === query.status);
    }
    results.sort(
      (left, right) =>
        right.polledAt.localeCompare(left.polledAt) ||
        left.connectorId.localeCompare(right.connectorId),
    );
    return paginate(results.map((result) => structuredClone(result)), query.limit, query.offset);
  }
}

function calculateInitialNextRunAt(fromIso: string, intervalSec: number): string {
  return new Date(new Date(fromIso).getTime() + intervalSec * 1000).toISOString();
}

/** Factory for a fresh in-memory polling scheduler repository. */
export function createInMemoryPollingSchedulerRepository(): InMemoryPollingSchedulerRepository {
  return new InMemoryPollingSchedulerRepository();
}
