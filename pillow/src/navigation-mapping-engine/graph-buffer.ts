/** T1-05 — Navigation graph ring buffer. */

import type { NavigationGraph } from "./types.js";

export class GraphBuffer {
  private buffer: NavigationGraph[] = [];

  constructor(private limit: number) {}

  push(graph: NavigationGraph): void {
    this.buffer.push(graph);
    while (this.buffer.length > this.limit) {
      this.buffer.shift();
    }
  }

  getRecent(limit: number): NavigationGraph[] {
    return this.buffer.slice(-limit).map((g) => ({ ...g }));
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
