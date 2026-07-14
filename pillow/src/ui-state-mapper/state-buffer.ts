/** T1-02 — UI state ring buffer. */

import type { UiStateModel } from "./types.js";

export class StateBuffer {
  private buffer: UiStateModel[] = [];

  constructor(private limit: number) {}

  push(state: UiStateModel): void {
    this.buffer.push(state);
    while (this.buffer.length > this.limit) {
      this.buffer.shift();
    }
  }

  getRecent(limit: number): UiStateModel[] {
    return this.buffer.slice(-limit).map((s) => ({ ...s }));
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
