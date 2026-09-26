/** Owns delayed startup, interval callbacks and their in-flight writes together. */
export class ManagedBackgroundTask {
  private bootTimer: ReturnType<typeof setTimeout> | undefined;
  private intervalTimer: ReturnType<typeof setInterval> | undefined;
  private active: Promise<void> | undefined;
  private running = false;
  private stopping: Promise<void> | undefined;

  constructor(private readonly options: {
    run: () => Promise<unknown> | unknown;
    allowed?: () => boolean;
    onError: (error: unknown) => void;
  }) {}

  start(bootDelayMs: number, intervalMs?: number): void {
    if (this.running || this.stopping || this.options.allowed?.() === false) return;
    if (!Number.isFinite(bootDelayMs) || bootDelayMs < 0 ||
        (intervalMs != null && (!Number.isFinite(intervalMs) || intervalMs <= 0))) {
      throw new Error("Background task delays must be finite and non-negative (interval positive)");
    }
    this.running = true;
    this.bootTimer = setTimeout(() => {
      this.bootTimer = undefined;
      this.tick();
    }, bootDelayMs);
    if (intervalMs != null) this.intervalTimer = setInterval(() => this.tick(), intervalMs);
  }

  private tick(): void {
    if (!this.running || this.active) return;
    // Recheck immediately before execution, including queued callbacks after stop().
    const active = Promise.resolve().then(async () => {
      if (!this.running || this.options.allowed?.() === false) return;
      await this.options.run();
    }).catch(this.options.onError).finally(() => {
      if (this.active === active) this.active = undefined;
    });
    this.active = active;
  }

  stop(): Promise<void> {
    if (this.stopping) return this.stopping;
    this.running = false;
    clearTimeout(this.bootTimer);
    clearInterval(this.intervalTimer);
    this.bootTimer = undefined;
    this.intervalTimer = undefined;
    const pending = this.active;
    this.stopping = Promise.resolve(pending).finally(() => { this.stopping = undefined; });
    return this.stopping;
  }
}
