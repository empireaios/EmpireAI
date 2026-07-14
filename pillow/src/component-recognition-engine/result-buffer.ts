/** T1-03 — Recognition result ring buffer. */

import type { ComponentRecognitionResult } from "./types.js";

export class ResultBuffer {
  private buffer: ComponentRecognitionResult[] = [];

  constructor(private limit: number) {}

  push(result: ComponentRecognitionResult): void {
    this.buffer.push(result);
    while (this.buffer.length > this.limit) {
      this.buffer.shift();
    }
  }

  getRecent(limit: number): ComponentRecognitionResult[] {
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
