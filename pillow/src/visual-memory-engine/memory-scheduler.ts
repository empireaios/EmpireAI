/** T1-08 — Memory capture interval scheduling. */

import {
  effectiveMemoryCaptureIntervalMs,
  type VisualMemoryConfiguration,
} from "./configuration.js";

export class MemoryScheduler {
  private timer: ReturnType<typeof setInterval> | null = null;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private paused = false;

  start(
    config: VisualMemoryConfiguration,
    tick: () => void | Promise<void>,
    cleanup?: () => void | Promise<void>,
  ): void {
    this.stop();
    if (!config.enabled) return;
    const intervalMs = effectiveMemoryCaptureIntervalMs(config);
    this.running = true;
    this.paused = false;
    void tick();
    this.timer = setInterval(() => {
      if (!this.paused) void tick();
    }, intervalMs);
    if (cleanup) {
      this.cleanupTimer = setInterval(() => void cleanup(), config.cleanupIntervalMs);
    }
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.running = false;
    this.paused = false;
  }

  isRunning(): boolean {
    return this.running;
  }
}
