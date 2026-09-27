/** Owns delayed startup, interval callbacks and their in-flight writes together. */
export class ManagedBackgroundTask {
  private bootTimer: ReturnType<typeof setTimeout> | undefined;
  private intervalTimer: ReturnType<typeof setInterval> | undefined;
  private active: Promise<void> | undefined;
  private running = false;
  private stopping: Promise<void> | undefined;
  private capturePaused = false;
  private pendingWhilePaused = false;

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
    if (!this.running) return;
    if (this.capturePaused) { this.pendingWhilePaused = true; return; }
    if (this.active) return;
    // Recheck immediately before execution, including queued callbacks after stop().
    const active = Promise.resolve().then(async () => {
      if (!this.running) return;
      if (this.capturePaused) { this.pendingWhilePaused = true; return; }
      if (this.options.allowed?.() === false) return;
      await this.options.run();
    }).catch(this.options.onError).finally(() => {
      if (this.active === active) this.active = undefined;
    });
    this.active = active;
  }

  /** Hold this task's delayed boot and interval callbacks while an isolated
   * capture runs. A timed-out drain stays paused until the active run settles.
   */
  async withPausedExecution<T>(capture: () => T | Promise<T>, timeoutMs = 30_000): Promise<T> {
    if (this.capturePaused || !Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30_000) {
      throw new Error("Background capture pause unavailable or timeout invalid");
    }
    this.capturePaused = true;
    const active = this.active;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let drained = false;
    const resume = () => {
      this.capturePaused = false;
      if (this.pendingWhilePaused && this.running) {
        this.pendingWhilePaused = false;
        this.tick();
      } else this.pendingWhilePaused = false;
    };
    try {
      if (active) {
        await Promise.race([
          active,
          new Promise<never>((_, reject) => {
            timer = setTimeout(() => reject(new Error("Background task drain timed out; no snapshot taken")), timeoutMs);
          }),
        ]);
      }
      drained = true;
      return await capture();
    } finally {
      if (timer) clearTimeout(timer);
      if (drained || !active) resume();
      else void active.finally(resume).catch(() => {});
    }
  }

  stop(): Promise<void> {
    if (this.stopping) return this.stopping;
    this.running = false;
    this.pendingWhilePaused = false;
    clearTimeout(this.bootTimer);
    clearInterval(this.intervalTimer);
    this.bootTimer = undefined;
    this.intervalTimer = undefined;
    const pending = this.active;
    this.stopping = Promise.resolve(pending).finally(() => { this.stopping = undefined; });
    return this.stopping;
  }
}
