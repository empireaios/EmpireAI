import { z } from "zod";

export const HOSTING_TARGETS = ["VERCEL", "DOCKER", "VPS", "STATIC_EXPORT"] as const;

export type HostingTarget = (typeof HOSTING_TARGETS)[number];

export const hostingTargetSchema = z.enum(HOSTING_TARGETS);

/** Validates a hosting target value. */
export function validateHostingTarget(value: unknown): HostingTarget {
  return hostingTargetSchema.parse(value);
}
