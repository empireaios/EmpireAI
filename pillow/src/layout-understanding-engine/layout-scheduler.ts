/** T1-04 — Layout analysis interval scheduling. */

import {
  effectiveAnalysisIntervalMs,
  type LayoutUnderstandingConfiguration,
} from "./configuration.js";

export class LayoutScheduler {
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private paused = false;

  start(config: LayoutUnderstandingConfiguration, tick: () => void | Promise<void>): void {
    this.stop();
    if (!config.enabled) return;
    const intervalMs = effectiveAnalysisIntervalMs(config);
    this.running = true;
    this.paused = false;
    void tick();
    this.timer = setInterval(() => {
      if (!this.paused) void tick();
    }, intervalMs);
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
    this.running = false;
    this.paused = false;
  }

  isRunning(): boolean {
    return this.running;
  }
}
