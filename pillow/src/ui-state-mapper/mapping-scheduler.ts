/** T1-02 — Mapping interval scheduling. */

import { effectiveUpdateIntervalMs, type UiStateMapperConfiguration } from "./configuration.js";

export class MappingScheduler {
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private paused = false;

  start(config: UiStateMapperConfiguration, tick: () => void | Promise<void>): void {
    this.stop();
    if (!config.enabled) return;
    const intervalMs = effectiveUpdateIntervalMs(config);
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
