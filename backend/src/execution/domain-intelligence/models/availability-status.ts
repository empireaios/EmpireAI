import { z } from "zod";

/** Heuristic availability estimate — no live registrar lookup. */
export const AVAILABILITY_STATUSES = [
  "LIKELY_AVAILABLE",
  "LIKELY_TAKEN",
  "UNVERIFIED",
] as const;

export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number];

export const availabilityStatusSchema = z.enum(AVAILABILITY_STATUSES);

/** Validates an availability status value. */
export function validateAvailabilityStatus(value: unknown): AvailabilityStatus {
  return availabilityStatusSchema.parse(value);
}
