import type { SoulRuntimeEvent } from "../models/soul-runtime-event.js";

export interface SoulRuntimeRepository {
  saveEvent(event: SoulRuntimeEvent): SoulRuntimeEvent;
  listEvents(workspaceId: string, limit?: number): SoulRuntimeEvent[];
  getEventById(eventId: string): SoulRuntimeEvent | null;
}
