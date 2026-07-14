/** T1-08 — Visual memory ring buffer. */

import type { VisualMemoryRecord } from "./types.js";

export class MemoryBuffer {
  private buffer: VisualMemoryRecord[] = [];

  constructor(private limit: number) {}

  push(record: VisualMemoryRecord): void {
    this.buffer.push(record);
    while (this.buffer.length > this.limit) {
      this.buffer.shift();
    }
  }

  getRecent(limit: number): VisualMemoryRecord[] {
    return this.buffer.slice(-limit).map((r) => ({ ...r }));
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
