/**
 * G5-03 — Scheduler plugin registry (schedulers, priority, queue providers, delay/retry/calendar).
 */

import type { QueuedAutomationRequest, ResolvedSchedulePolicy, ScheduleMode } from "../contracts/scheduler-types.js";

export type SchedulerPlugin = {
  pluginId: string;
  scheduleMode: ScheduleMode;
  computeScheduledTime?: (input: {
    policy: ResolvedSchedulePolicy;
    nowMs: number;
    entry?: QueuedAutomationRequest;
  }) => string | undefined;
};

export type PriorityStrategyPlugin = {
  pluginId: string;
  rank: (entry: QueuedAutomationRequest) => number;
};

export type QueueProviderPlugin = {
  pluginId: string;
  /** Future distributed worker backends — G5-03 registers only, core uses in-memory queue. */
  providerKind: "memory" | "distributed" | "broker";
};

export type DelayStrategyPlugin = {
  pluginId: string;
  computeDelayMs: (policy: ResolvedSchedulePolicy, retryCount: number) => number | undefined;
};

export type RetryStrategyPlugin = {
  pluginId: string;
  shouldRetry: (input: {
    policy: ResolvedSchedulePolicy;
    retryCount: number;
    errorClass?: string;
  }) => boolean;
};

export type CalendarProviderPlugin = {
  pluginId: string;
  timezone: string;
};

export class SchedulerPluginRegistry {
  private readonly schedulers = new Map<string, SchedulerPlugin>();
  private readonly priorityStrategies = new Map<string, PriorityStrategyPlugin>();
  private readonly queueProviders = new Map<string, QueueProviderPlugin>();
  private readonly delayStrategies = new Map<string, DelayStrategyPlugin>();
  private readonly retryStrategies = new Map<string, RetryStrategyPlugin>();
  private readonly calendarProviders = new Map<string, CalendarProviderPlugin>();

  registerScheduler(plugin: SchedulerPlugin): void {
    this.schedulers.set(plugin.pluginId, plugin);
  }

  registerPriorityStrategy(plugin: PriorityStrategyPlugin): void {
    this.priorityStrategies.set(plugin.pluginId, plugin);
  }

  registerQueueProvider(plugin: QueueProviderPlugin): void {
    this.queueProviders.set(plugin.pluginId, plugin);
  }

  registerDelayStrategy(plugin: DelayStrategyPlugin): void {
    this.delayStrategies.set(plugin.pluginId, plugin);
  }

  registerRetryStrategy(plugin: RetryStrategyPlugin): void {
    this.retryStrategies.set(plugin.pluginId, plugin);
  }

  registerCalendarProvider(plugin: CalendarProviderPlugin): void {
    this.calendarProviders.set(plugin.pluginId, plugin);
  }

  resolveSchedulerPlugin(scheduleMode: ScheduleMode): SchedulerPlugin | undefined {
    for (const plugin of this.schedulers.values()) {
      if (plugin.scheduleMode === scheduleMode) return plugin;
    }
    return undefined;
  }

  applyDelayStrategy(policy: ResolvedSchedulePolicy, retryCount: number): number | undefined {
    for (const strategy of this.delayStrategies.values()) {
      const delay = strategy.computeDelayMs(policy, retryCount);
      if (delay !== undefined) return delay;
    }
    return undefined;
  }

  applyRetryStrategy(input: {
    policy: ResolvedSchedulePolicy;
    retryCount: number;
    errorClass?: string;
  }): boolean {
    if (this.retryStrategies.size === 0) {
      return input.retryCount < input.policy.maxAttempts;
    }
    for (const strategy of this.retryStrategies.values()) {
      if (strategy.shouldRetry(input)) return true;
    }
    return false;
  }

  listQueueProviders(): readonly QueueProviderPlugin[] {
    return [...this.queueProviders.values()];
  }

  resetForTests(): void {
    this.schedulers.clear();
    this.priorityStrategies.clear();
    this.queueProviders.clear();
    this.delayStrategies.clear();
    this.retryStrategies.clear();
    this.calendarProviders.clear();
  }
}

export const schedulerPluginRegistry = new SchedulerPluginRegistry();

export function resetSchedulerPluginRegistryForTests(): void {
  schedulerPluginRegistry.resetForTests();
}
