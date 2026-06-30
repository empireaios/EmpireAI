import { z } from "zod";

export const STORE_HISTORY_EVENT_TYPES = [
  "LAUNCH",
  "MILESTONE",
  "PIVOT",
  "EXPANSION",
  "INCIDENT",
  "OPTIMIZATION",
] as const;

export type StoreHistoryEventType = (typeof STORE_HISTORY_EVENT_TYPES)[number];

/** Single event in store history timeline. */
export type StoreHistoryEvent = {
  eventId: string;
  eventType: StoreHistoryEventType;
  title: string;
  description: string;
  occurredAt: string;
  impactScore: number;
};

export const storeHistoryEventSchema = z.object({
  eventId: z.string().min(1),
  eventType: z.enum(STORE_HISTORY_EVENT_TYPES),
  title: z.string().min(1),
  description: z.string().min(1),
  occurredAt: z.string().datetime({ offset: true }),
  impactScore: z.number().min(0).max(100),
});

/** Long-term store history memory. */
export type StoreHistory = {
  historyId: string;
  storeName: string;
  events: StoreHistoryEvent[];
  totalRevenue: number;
  monthsActive: number;
  currency: string;
  score: number;
  summary: string;
};

export const storeHistorySchema = z.object({
  historyId: z.string().min(1),
  storeName: z.string().min(1),
  events: z.array(storeHistoryEventSchema).min(1),
  totalRevenue: z.number().min(0),
  monthsActive: z.number().int().min(0),
  currency: z.string().min(1),
  score: z.number().min(0).max(100),
  summary: z.string().min(1),
});

/** Validates a StoreHistory record shape. */
export function validateStoreHistory(value: unknown): StoreHistory {
  return storeHistorySchema.parse(value);
}

/** Validates a StoreHistoryEvent record shape. */
export function validateStoreHistoryEvent(value: unknown): StoreHistoryEvent {
  return storeHistoryEventSchema.parse(value);
}
