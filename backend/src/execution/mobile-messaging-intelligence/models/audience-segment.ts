import { z } from "zod";

export const AUDIENCE_SEGMENT_TYPES = [
  "NEW_SUBSCRIBER",
  "ACTIVE_BUYER",
  "LAPSED_CUSTOMER",
  "VIP",
  "CART_ABANDONER",
  "BROWSE_ONLY",
] as const;

export type AudienceSegmentType = (typeof AUDIENCE_SEGMENT_TYPES)[number];

export const AUDIENCE_SEGMENT_LABELS: Record<AudienceSegmentType, string> = {
  NEW_SUBSCRIBER: "New Subscriber",
  ACTIVE_BUYER: "Active Buyer",
  LAPSED_CUSTOMER: "Lapsed Customer",
  VIP: "VIP",
  CART_ABANDONER: "Cart Abandoner",
  BROWSE_ONLY: "Browse Only",
};

/** Audience segment definition for message targeting. */
export type AudienceSegment = {
  segmentId: string;
  segmentType: AudienceSegmentType;
  displayName: string;
  criteria: string;
  estimatedReachPercent: number;
  preferredChannels: string[];
  score: number;
};

export const audienceSegmentSchema = z.object({
  segmentId: z.string().min(1),
  segmentType: z.enum(AUDIENCE_SEGMENT_TYPES),
  displayName: z.string().min(1),
  criteria: z.string().min(1),
  estimatedReachPercent: z.number().min(0).max(100),
  preferredChannels: z.array(z.string().min(1)).min(1),
  score: z.number().min(0).max(100),
});

/** Validates an AudienceSegment record shape. */
export function validateAudienceSegment(value: unknown): AudienceSegment {
  return audienceSegmentSchema.parse(value);
}
