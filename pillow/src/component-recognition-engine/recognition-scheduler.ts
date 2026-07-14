/** T1-03 — Recognition interval scheduling. */

import {
  effectiveRecognitionIntervalMs,
  type ComponentRecognitionConfiguration,
} from "./configuration.js";

export class RecognitionScheduler {
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private paused = false;

  start(config: ComponentRecognitionConfiguration, tick: () => void | Promise<void>): void {
    this.stop();
    if (!config.enabled) return;
    const intervalMs = effectiveRecognitionIntervalMs(config);
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
