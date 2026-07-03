/**
 * G5-03 — Registry-driven schedule and policy resolution (no hardcoded timing).
 */

import type {
  AutomationPolicyRow,
  AutomationRecoveryRow,
  AutomationScheduleRow,
} from "../../../registry/types/automation-registry-types.js";
import {
  REG_AUTOMATION_POLICY,
  REG_AUTOMATION_RECOVERY,
  REG_AUTOMATION_SCHEDULE,
} from "../../../registry/types/registry-ids.js";
import type { ResolvedSchedulePolicy, ScheduleMode } from "../contracts/scheduler-types.js";
import { resolveAutomationRegistry } from "../registry/automation-registry-resolver.js";

function readNumber(config: Record<string, unknown>, key: string): number | undefined {
  const value = config[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function readString(config: Record<string, unknown>, key: string): string | undefined {
  const value = config[key];
  return typeof value === "string" ? value : undefined;
}

export function resolveScheduleModeFromRegistry(
  schedule?: AutomationScheduleRow,
  override?: ScheduleMode,
): ScheduleMode {
  if (override) return override;
  if (!schedule) return "immediate";
  const configured = readString(schedule.configuration, "scheduleMode");
  if (configured && (SCHEDULE_MODE_VALUES as readonly string[]).includes(configured)) {
    return configured as ScheduleMode;
  }
  switch (schedule.scheduleKind) {
    case "cron":
      return "recurring";
    case "slot":
      return "recurring";
    case "manifest":
      return "deferred";
    default:
      return "scheduled";
  }
}

const SCHEDULE_MODE_VALUES = [
  "immediate",
  "scheduled",
  "recurring",
  "deferred",
  "retry",
  "recovery",
  "manual",
  "plugin",
] as const;

export function resolveSchedulePolicy(input: {
  scheduleRegistryId?: string;
  policyRegistryId?: string;
  recoveryRegistryId?: string;
  scheduleMode?: ScheduleMode;
}): ResolvedSchedulePolicy {
  const schedules = resolveAutomationRegistry({}, REG_AUTOMATION_SCHEDULE)
    .rows as AutomationScheduleRow[];
  const policies = resolveAutomationRegistry({}, REG_AUTOMATION_POLICY)
    .rows as AutomationPolicyRow[];
  const recoveries = resolveAutomationRegistry({}, REG_AUTOMATION_RECOVERY)
    .rows as AutomationRecoveryRow[];

  const schedule = input.scheduleRegistryId
    ? schedules.find((row) => row.id === input.scheduleRegistryId)
    : undefined;
  const policyRow =
    (input.policyRegistryId ? policies.find((row) => row.id === input.policyRegistryId) : undefined) ??
    (schedule?.policyRef ? policies.find((row) => row.id === schedule.policyRef) : undefined);
  const recovery = input.recoveryRegistryId
    ? recoveries.find((row) => row.id === input.recoveryRegistryId)
    : undefined;

  const intervalMs =
    readNumber(schedule?.configuration ?? {}, "intervalMs") ??
    readNumber(policyRow?.configuration ?? {}, "defaultIntervalMs");

  const executionDeadlineMs =
    policyRow?.sla?.[0]?.maxDurationMs ??
    readNumber(policyRow?.configuration ?? {}, "executionDeadlineMs");

  const scheduleMode = resolveScheduleModeFromRegistry(schedule, input.scheduleMode);

  return {
    scheduleRegistryId: schedule?.id ?? input.scheduleRegistryId,
    policyRegistryId: policyRow?.id ?? input.policyRegistryId ?? schedule?.policyRef,
    recoveryRegistryId: recovery?.id ?? input.recoveryRegistryId,
    scheduleMode,
    intervalMs,
    maxAttempts: recovery?.maxAttempts ?? policyRow?.retry.maxAttempts ?? 0,
    backoffMs: policyRow?.retry.backoffMs ?? 0,
    executionDeadlineMs,
    timezone: schedule?.timezone,
    expression: schedule?.expression,
  };
}

export function computeScheduledTime(input: {
  policy: ResolvedSchedulePolicy;
  nowMs: number;
  deferUntil?: string;
  retryCount?: number;
}): string {
  const { policy, nowMs, deferUntil, retryCount = 0 } = input;

  if (deferUntil) {
    return deferUntil;
  }

  switch (policy.scheduleMode) {
    case "immediate":
    case "manual":
      return new Date(nowMs).toISOString();
    case "retry":
    case "recovery":
      return new Date(nowMs + policy.backoffMs * Math.max(retryCount, 1)).toISOString();
    case "deferred":
    case "scheduled":
    case "recurring":
    case "plugin": {
      const delay = policy.intervalMs ?? 0;
      return new Date(nowMs + delay).toISOString();
    }
    default:
      return new Date(nowMs).toISOString();
  }
}

export function computeExecutionDeadline(
  scheduledTimeIso: string,
  policy: ResolvedSchedulePolicy,
): string | undefined {
  if (!policy.executionDeadlineMs) return undefined;
  const start = Date.parse(scheduledTimeIso);
  if (Number.isNaN(start)) return undefined;
  return new Date(start + policy.executionDeadlineMs).toISOString();
}
