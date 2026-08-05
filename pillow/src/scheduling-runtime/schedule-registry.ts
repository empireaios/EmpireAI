import {
  SCHRT_METADATA_VERSION,
  SCHRT_SEED_CLOCK_UTC,
  SCHEDULING_RUNTIME_IDENTITY,
} from "./paths.js";
import type { SchedulingRuntimeConfiguration } from "./configuration.js";
import { nextSchrtId, type ScheduleStore } from "./schedule-store.js";
import { RecurrenceEngine } from "./recurrence-engine.js";
import { OneTimeEngine } from "./one-time-engine.js";
import type { ScheduleDefinition, SchrtInput } from "./types.js";

export class ScheduleRegistry {
  private readonly recurrence = new RecurrenceEngine();
  private readonly oneTime = new OneTimeEngine();

  create(
    store: ScheduleStore,
    input: SchrtInput,
    config: SchedulingRuntimeConfiguration,
  ): ScheduleDefinition {
    const scheduleId = input.scheduleId ?? nextSchrtId("schrt-sched");
    const scheduleType = input.scheduleType ?? "one_time";
    const nowIso = input.now ?? SCHRT_SEED_CLOCK_UTC;

    let nextExecution: string | null = null;
    if (scheduleType === "one_time") {
      nextExecution = this.oneTime.resolveNextExecution({
        nextExecution: input.nextExecution,
        now: nowIso,
      });
    } else if (scheduleType === "event_driven") {
      nextExecution = null;
    } else if (
      scheduleType === "daily" ||
      scheduleType === "weekly" ||
      scheduleType === "monthly" ||
      scheduleType === "cron" ||
      scheduleType === "delayed"
    ) {
      nextExecution =
        input.nextExecution ??
        this.recurrence.computeNextExecution(scheduleType, nowIso, {
          cronExpression: input.cronExpression ?? null,
        });
    } else if (input.nextExecution) {
      nextExecution = input.nextExecution;
    }

    const schedule: ScheduleDefinition = {
      scheduleId,
      missionId: input.missionId ?? "mission-schrt-default",
      workerId: input.workerId ?? config.workerId,
      factoryId: input.factoryId ?? config.factory,
      scheduleType,
      triggerType:
        input.triggerType ??
        (scheduleType === "event_driven"
          ? "event"
          : scheduleType === "custom_extension"
            ? "custom_extension"
            : "time"),
      timeZone: input.timeZone ?? "UTC",
      executionWindow: input.executionWindow ?? null,
      cronExpression: input.cronExpression ?? null,
      eventKey: input.eventKey ?? null,
      nextExecution,
      previousExecution: null,
      currentStatus: input.currentStatus ?? "active",
      retryPolicy: input.retryPolicy ?? {
        maxRetries: config.defaultMaxRetries,
        backoffMs: config.defaultBackoffMs,
      },
      priority: input.priority ?? 100,
      paused: input.paused ?? false,
      pillowConfirmed: input.pillowConfirmed ?? false,
      grandKingApproved: input.grandKingApproved ?? false,
      highRisk: input.highRisk ?? false,
      auditReference: input.auditReference ?? `audit://schrt/schedule/${scheduleId}`,
      fabricated: false,
      structuralSignalOnly: true,
      metadataVersion: SCHRT_METADATA_VERSION,
    };

    return store.saveSchedule(schedule);
  }

  update(
    store: ScheduleStore,
    scheduleId: string,
    input: SchrtInput,
  ): ScheduleDefinition | null {
    const existing = store.getSchedule(scheduleId);
    if (!existing) return null;

    const patch: Partial<ScheduleDefinition> = {
      missionId: input.missionId ?? existing.missionId,
      workerId: input.workerId ?? existing.workerId,
      factoryId: input.factoryId ?? existing.factoryId,
      scheduleType: input.scheduleType ?? existing.scheduleType,
      triggerType: input.triggerType ?? existing.triggerType,
      timeZone: input.timeZone ?? existing.timeZone,
      executionWindow:
        input.executionWindow !== undefined ? input.executionWindow : existing.executionWindow,
      cronExpression:
        input.cronExpression !== undefined ? input.cronExpression : existing.cronExpression,
      eventKey: input.eventKey !== undefined ? input.eventKey : existing.eventKey,
      priority: input.priority ?? existing.priority,
      retryPolicy: input.retryPolicy ?? existing.retryPolicy,
      pillowConfirmed: input.pillowConfirmed ?? existing.pillowConfirmed,
      grandKingApproved: input.grandKingApproved ?? existing.grandKingApproved,
      highRisk: input.highRisk ?? existing.highRisk,
      auditReference: input.auditReference ?? existing.auditReference,
      fabricated: false,
      structuralSignalOnly: true,
    };

    // nextExecution only from explicit input or recomputed deterministically — never fabricated.
    if (input.nextExecution !== undefined) {
      patch.nextExecution = input.nextExecution;
    } else if (input.now && input.scheduleType) {
      const st = input.scheduleType;
      if (st === "one_time") {
        patch.nextExecution = this.oneTime.resolveNextExecution({
          nextExecution: existing.nextExecution,
          now: input.now,
        });
      } else if (st !== "event_driven" && st !== "custom_extension") {
        patch.nextExecution = this.recurrence.computeNextExecution(st, input.now, {
          cronExpression: patch.cronExpression ?? existing.cronExpression,
        });
      }
    }

    return store.updateSchedule(scheduleId, patch);
  }

  cancel(store: ScheduleStore, scheduleId: string): ScheduleDefinition | null {
    return store.updateSchedule(scheduleId, {
      currentStatus: "cancelled",
      paused: true,
      fabricated: false,
      structuralSignalOnly: true,
    });
  }

  pause(store: ScheduleStore, scheduleId: string): ScheduleDefinition | null {
    return store.updateSchedule(scheduleId, {
      paused: true,
      currentStatus: "paused",
      fabricated: false,
      structuralSignalOnly: true,
    });
  }

  resume(store: ScheduleStore, scheduleId: string): ScheduleDefinition | null {
    return store.updateSchedule(scheduleId, {
      paused: false,
      currentStatus: "active",
      fabricated: false,
      structuralSignalOnly: true,
    });
  }

  seedDefaults(store: ScheduleStore, config: SchedulingRuntimeConfiguration) {
    const seedNow = SCHRT_SEED_CLOCK_UTC;
    const seeds: SchrtInput[] = [
      {
        scheduleId: "sched-daily-01",
        scheduleType: "daily",
        triggerType: "time",
        missionId: "mission-schrt-daily",
        workerId: SCHEDULING_RUNTIME_IDENTITY.workerId,
        factoryId: config.factory,
        now: seedNow,
        currentStatus: "active",
        auditReference: "audit://schrt/seed/sched-daily-01",
        validated: true,
      },
      {
        scheduleId: "sched-weekly-01",
        scheduleType: "weekly",
        triggerType: "time",
        missionId: "mission-schrt-weekly",
        workerId: SCHEDULING_RUNTIME_IDENTITY.workerId,
        factoryId: config.factory,
        now: seedNow,
        currentStatus: "active",
        auditReference: "audit://schrt/seed/sched-weekly-01",
        validated: true,
      },
      {
        scheduleId: "sched-onetime-01",
        scheduleType: "one_time",
        triggerType: "time",
        missionId: "mission-schrt-onetime",
        workerId: SCHEDULING_RUNTIME_IDENTITY.workerId,
        factoryId: config.factory,
        nextExecution: "2026-08-15T12:00:00.000Z",
        currentStatus: "active",
        auditReference: "audit://schrt/seed/sched-onetime-01",
        validated: true,
      },
      {
        scheduleId: "sched-event-01",
        scheduleType: "event_driven",
        triggerType: "event",
        missionId: "mission-schrt-event",
        workerId: SCHEDULING_RUNTIME_IDENTITY.workerId,
        factoryId: config.factory,
        eventKey: "mission.ready",
        currentStatus: "active",
        auditReference: "audit://schrt/seed/sched-event-01",
        validated: true,
      },
      {
        scheduleId: "sched-cron-01",
        scheduleType: "cron",
        triggerType: "time",
        missionId: "mission-schrt-cron",
        workerId: SCHEDULING_RUNTIME_IDENTITY.workerId,
        factoryId: config.factory,
        cronExpression: "0 9 * * *",
        now: seedNow,
        currentStatus: "active",
        auditReference: "audit://schrt/seed/sched-cron-01",
        validated: true,
      },
    ];

    for (const seed of seeds) {
      if (!store.getSchedule(seed.scheduleId!)) {
        this.create(store, seed, config);
      }
    }
  }
}
