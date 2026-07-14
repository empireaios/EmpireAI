/** T1-06 — Interaction event ring buffer. */

import type { InteractionEvent } from "./types.js";

export class EventBuffer {
  private buffer: InteractionEvent[] = [];

  constructor(private limit: number) {}

  push(event: InteractionEvent): void {
    this.buffer.push(event);
    while (this.buffer.length > this.limit) {
      this.buffer.shift();
    }
  }

  getRecent(limit: number): InteractionEvent[] {
    return this.buffer.slice(-limit).map((e) => ({ ...e }));
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
