import { z } from "zod";

export const TRACKING_EVENT_STATUSES = [
  "LABEL_CREATED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "EXCEPTION",
  "FAILED",
] as const;

export type TrackingEventStatus = (typeof TRACKING_EVENT_STATUSES)[number];

/** Shipment tracking event for an order. */
export type TrackingEvent = {
  eventId: string;
  orderId: string;
  trackingNumber: string;
  carrier: string;
  status: TrackingEventStatus;
  description: string;
  location: string | null;
  occurredAt: string;
};

export const trackingEventSchema = z.object({
  eventId: z.string().min(1),
  orderId: z.string().min(1),
  trackingNumber: z.string().min(1),
  carrier: z.string().min(1),
  status: z.enum(TRACKING_EVENT_STATUSES),
  description: z.string().min(1),
  location: z.string().nullable(),
  occurredAt: z.string().datetime({ offset: true }),
});

/** Validates a TrackingEvent record shape. */
export function validateTrackingEvent(value: unknown): TrackingEvent {
  return trackingEventSchema.parse(value);
}
