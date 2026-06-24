import { randomUUID } from "node:crypto";
import type { EyeConnector } from "../contract/eye-connector.js";
import type { ProductSignal } from "../contract/product-signal.js";
import type { EyeSignalEnvelope } from "../contract/signal-envelope.js";
import { EyeEventPipeline } from "../events/event-pipeline.js";
import { HealthMonitor } from "../health/health-monitor.js";
import { SignalNormalizationPipeline } from "../pipelines/signal-normalization-pipeline.js";
import { ConnectorRateLimiterRegistry } from "../ratelimit/rate-limiter.js";
import { EyeConnectorRegistry } from "../registry/connector-registry.js";
import { RetryPolicy, type RetryPolicyConfig } from "../retry/retry-policy.js";
import type {
  EyeConnectorContext,
  EyeObserveRequest,
  EyePollSchedule,
  EyeProviderId,
  EyeSignalDomain,
} from "../types.js";

export type PollResult = {
  scheduleId: string;
  providerId: EyeProviderId;
  workspaceId: string;
  success: boolean;
  observations: number;
  signals: EyeSignalEnvelope[];
  error?: string;
  durationMs: number;
};

export type ConnectorSchedulerOptions = {
  registry?: EyeConnectorRegistry;
  events?: EyeEventPipeline;
  health?: HealthMonitor;
  retry?: RetryPolicy | Partial<RetryPolicyConfig>;
  rateLimiters?: ConnectorRateLimiterRegistry;
  normalization?: SignalNormalizationPipeline;
};

function resolveRetryPolicy(retry?: RetryPolicy | Partial<RetryPolicyConfig>): RetryPolicy {
  if (retry instanceof RetryPolicy) return retry;
  return new RetryPolicy(retry);
}

type ActiveTimer = {
  scheduleId: string;
  timer: ReturnType<typeof setInterval>;
};

/** In-memory polling scheduler — triggers connector observe() on intervals. */
export class ConnectorScheduler {
  private readonly registry: EyeConnectorRegistry;
  private readonly events: EyeEventPipeline;
  private readonly health: HealthMonitor;
  private readonly retry: RetryPolicy;
  private readonly rateLimiters: ConnectorRateLimiterRegistry;
  private readonly normalization: SignalNormalizationPipeline;
  private readonly schedules = new Map<string, EyePollSchedule>();
  private readonly timers = new Map<string, ActiveTimer>();

  constructor(options: ConnectorSchedulerOptions = {}) {
    this.registry = options.registry ?? new EyeConnectorRegistry();
    this.events = options.events ?? new EyeEventPipeline();
    this.health = options.health ?? new HealthMonitor();
    this.retry = resolveRetryPolicy(options.retry);
    this.rateLimiters = options.rateLimiters ?? new ConnectorRateLimiterRegistry();
    this.normalization = options.normalization ?? new SignalNormalizationPipeline();
  }

  upsertSchedule(
    input: Omit<EyePollSchedule, "id" | "lastRunAt" | "nextRunAt" | "createdAt"> & {
      id?: string;
    },
  ): EyePollSchedule {
    const id = input.id ?? randomUUID();
    const existing = this.schedules.get(id);
    const schedule: EyePollSchedule = {
      id,
      workspaceId: input.workspaceId,
      providerId: input.providerId,
      domain: input.domain,
      intervalSec: input.intervalSec,
      cronExpression: input.cronExpression,
      queryTemplate: input.queryTemplate,
      enabled: input.enabled,
      lastRunAt: existing?.lastRunAt ?? null,
      nextRunAt: existing?.nextRunAt ?? null,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    this.schedules.set(id, schedule);

    if (schedule.enabled) {
      this.startTimer(schedule);
    } else {
      this.stopTimer(id);
    }
    return schedule;
  }

  removeSchedule(scheduleId: string): void {
    this.stopTimer(scheduleId);
    this.schedules.delete(scheduleId);
  }

  getSchedule(scheduleId: string): EyePollSchedule | undefined {
    return this.schedules.get(scheduleId);
  }

  listSchedules(workspaceId?: string): EyePollSchedule[] {
    const all = [...this.schedules.values()];
    return workspaceId ? all.filter((s) => s.workspaceId === workspaceId) : all;
  }

  async triggerNow(scheduleId: string, correlationId?: string): Promise<PollResult> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      throw new Error(`Unknown poll schedule: ${scheduleId}`);
    }
    return this.executePoll(schedule, correlationId ?? `poll-${scheduleId}`);
  }

  stopAll(): void {
    for (const scheduleId of this.timers.keys()) {
      this.stopTimer(scheduleId);
    }
  }

  private startTimer(schedule: EyePollSchedule): void {
    this.stopTimer(schedule.id);
    const intervalMs = Math.max(100, schedule.intervalSec * 1000);
    const timer = setInterval(() => {
      void this.executePoll(schedule, `scheduled-${schedule.id}`).catch(() => {
        /* errors recorded in poll result + health */
      });
    }, intervalMs);
    if (typeof timer.unref === "function") timer.unref();
    this.timers.set(schedule.id, { scheduleId: schedule.id, timer });
    schedule.nextRunAt = new Date(Date.now() + intervalMs).toISOString();
  }

  private stopTimer(scheduleId: string): void {
    const active = this.timers.get(scheduleId);
    if (active) {
      clearInterval(active.timer);
      this.timers.delete(scheduleId);
    }
  }

  private async executePoll(schedule: EyePollSchedule, correlationId: string): Promise<PollResult> {
    const started = Date.now();
    const connector = this.registry.require(schedule.providerId);
    const context: EyeConnectorContext = {
      workspaceId: schedule.workspaceId,
      correlationId,
    };
    const request: EyeObserveRequest = {
      domain: schedule.domain,
      query: schedule.queryTemplate,
      mode: "live",
    };

    await this.events.emit("poll.started", {
      workspaceId: schedule.workspaceId,
      providerId: schedule.providerId,
      payload: { scheduleId: schedule.id, domain: schedule.domain },
    });

    const limiter = this.rateLimiters.getOrCreate(schedule.providerId, {
      capacity: connector.definition.rateLimitPerMinute,
      windowMs: 60_000,
    });

    try {
      const observations = await this.retry.execute(async () => {
        await limiter.acquire();
        return connector.observe(context, request);
      });

      const signals = this.normalization.normalizeObservations(
        schedule.workspaceId,
        observations,
        schedule.domain === "product"
          ? (schedule.queryTemplate as { productTitle: string; category: string })
          : undefined,
      );

      const durationMs = Date.now() - started;
      this.health.recordSuccess(schedule.workspaceId, schedule.providerId, durationMs);
      schedule.lastRunAt = new Date().toISOString();
      schedule.nextRunAt = new Date(Date.now() + schedule.intervalSec * 1000).toISOString();

      await this.events.emit("poll.completed", {
        workspaceId: schedule.workspaceId,
        providerId: schedule.providerId,
        payload: {
          scheduleId: schedule.id,
          observationCount: observations.length,
          signalCount: signals.length,
          durationMs,
        },
      });

      for (const signal of signals) {
        await this.events.emit("signal.emitted", {
          workspaceId: schedule.workspaceId,
          providerId: schedule.providerId,
          payload: { envelopeId: signal.envelopeId, domain: signal.domain },
        });
      }

      return {
        scheduleId: schedule.id,
        providerId: schedule.providerId,
        workspaceId: schedule.workspaceId,
        success: true,
        observations: observations.length,
        signals,
        durationMs,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const durationMs = Date.now() - started;
      this.health.recordFailure(schedule.workspaceId, schedule.providerId, message);
      schedule.lastRunAt = new Date().toISOString();

      await this.events.emit("poll.failed", {
        workspaceId: schedule.workspaceId,
        providerId: schedule.providerId,
        payload: { scheduleId: schedule.id, error: message, durationMs },
      });

      return {
        scheduleId: schedule.id,
        providerId: schedule.providerId,
        workspaceId: schedule.workspaceId,
        success: false,
        observations: 0,
        signals: [],
        error: message,
        durationMs,
      };
    }
  }

  /** Extract product signals from poll results for convenience. */
  extractProductSignals(signals: EyeSignalEnvelope[]): ProductSignal[] {
    return signals
      .filter((s) => s.domain === "product")
      .map((s) => s.payload as ProductSignal);
  }
}

/** Facade wiring registry + scheduler + shared subsystems for integration tests. */
export class EyeConnectorRuntime {
  readonly registry: EyeConnectorRegistry;
  readonly events: EyeEventPipeline;
  readonly health: HealthMonitor;
  readonly retry: RetryPolicy;
  readonly rateLimiters: ConnectorRateLimiterRegistry;
  readonly normalization: SignalNormalizationPipeline;
  readonly scheduler: ConnectorScheduler;

  constructor(options: ConnectorSchedulerOptions = {}) {
    this.registry = options.registry ?? new EyeConnectorRegistry();
    this.events = options.events ?? new EyeEventPipeline();
    this.health = options.health ?? new HealthMonitor();
    this.retry = resolveRetryPolicy(options.retry);
    this.rateLimiters = options.rateLimiters ?? new ConnectorRateLimiterRegistry();
    this.normalization = options.normalization ?? new SignalNormalizationPipeline();
    this.scheduler = new ConnectorScheduler({
      registry: this.registry,
      events: this.events,
      health: this.health,
      retry: this.retry,
      rateLimiters: this.rateLimiters,
      normalization: this.normalization,
    });
  }

  register(connector: EyeConnector): void {
    this.registry.register(connector);
    void this.events.emit("connector.registered", {
      workspaceId: "*",
      providerId: connector.definition.providerId,
      payload: { providerName: connector.definition.providerName },
    });
  }

  shutdown(): void {
    this.scheduler.stopAll();
  }
}

export type { EyeSignalDomain };
