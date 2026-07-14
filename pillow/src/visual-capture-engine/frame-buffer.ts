/** T1-01 — Ring buffer for captured frames. */

import type { CaptureFrame } from "./types.js";

export class FrameBuffer {
  private frames: CaptureFrame[] = [];

  constructor(private limit: number) {}

  setLimit(limit: number): void {
    this.limit = Math.max(1, limit);
    this.trim();
  }

  push(frame: CaptureFrame): void {
    this.frames.push(frame);
    this.trim();
  }

  getLatest(): CaptureFrame | null {
    return this.frames[this.frames.length - 1] ?? null;
  }

  getRecent(limit = 10): CaptureFrame[] {
    return this.frames.slice(-limit);
  }

  size(): number {
    return this.frames.length;
  }

  clear(): void {
    this.frames = [];
  }

  private trim(): void {
    if (this.frames.length > this.limit) {
      this.frames = this.frames.slice(-this.limit);
    }
  }
}
