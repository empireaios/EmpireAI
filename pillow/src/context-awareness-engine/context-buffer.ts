/** T1-07 — Workflow context ring buffer. */

import type { WorkflowContextModel } from "./types.js";

export class ContextBuffer {
  private buffer: WorkflowContextModel[] = [];

  constructor(private limit: number) {}

  push(context: WorkflowContextModel): void {
    this.buffer.push(context);
    while (this.buffer.length > this.limit) {
      this.buffer.shift();
    }
  }

  getRecent(limit: number): WorkflowContextModel[] {
    return this.buffer.slice(-limit).map((c) => ({ ...c }));
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
