/** T1-06 — Event listener engine for ingested and inferred interactions. */

import { appendInteractionLog } from "./interaction-logging.js";
import type { RawInteractionInput } from "./types.js";

export class EventListenerEngine {
  private attached = false;
  private pendingEvents: RawInteractionInput[] = [];

  attach(): void {
    this.attached = true;
    appendInteractionLog({
      event: "listener_attached",
      level: "info",
      details: "Interaction event listener attached",
    });
  }

  detach(): void {
    this.attached = false;
    this.pendingEvents = [];
    appendInteractionLog({
      event: "listener_detached",
      level: "info",
      details: "Interaction event listener detached",
    });
  }

  isAttached(): boolean {
    return this.attached;
  }

  enqueue(raw: RawInteractionInput): void {
    if (!this.attached) return;
    this.pendingEvents.push(raw);
    if (this.pendingEvents.length > 1000) {
      this.pendingEvents = this.pendingEvents.slice(-500);
    }
  }

  drain(): RawInteractionInput[] {
    const events = [...this.pendingEvents];
    this.pendingEvents = [];
    return events;
  }

  pendingCount(): number {
    return this.pendingEvents.length;
  }
}
