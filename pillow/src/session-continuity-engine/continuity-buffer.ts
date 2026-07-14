/** T1-09 — Session continuity ring buffer. */

import type { SessionContinuityModel } from "./types.js";

export class ContinuityBuffer {
  private buffer: SessionContinuityModel[] = [];

  constructor(private limit: number) {}

  push(model: SessionContinuityModel): void {
    this.buffer.push(model);
    while (this.buffer.length > this.limit) {
      this.buffer.shift();
    }
  }

  getRecent(limit: number): SessionContinuityModel[] {
    return this.buffer.slice(-limit).map((m) => ({ ...m }));
  }

  size(): number {
    return this.buffer.length;
  }

  setLimit(limit: number): void {
    this.limit = Math.max(1, limit);
    while (this.buffer.length > this.limit) {
      this.buffer.shift();
    }
  }
}
