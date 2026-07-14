/** T1-04 — Layout model ring buffer. */

import type { LayoutModel } from "./types.js";

export class LayoutBuffer {
  private buffer: LayoutModel[] = [];

  constructor(private limit: number) {}

  push(layout: LayoutModel): void {
    this.buffer.push(layout);
    while (this.buffer.length > this.limit) {
      this.buffer.shift();
    }
  }

  getRecent(limit: number): LayoutModel[] {
    return this.buffer.slice(-limit).map((l) => ({ ...l }));
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
