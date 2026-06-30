import { z } from "zod";

export const MOBILE_MESSAGING_SIGNAL_TYPES = [
  "sms_coverage",
  "push_coverage",
  "timing_quality",
  "segmentation_depth",
  "automation_readiness",
  "frequency_safety",
  "messaging_composite",
] as const;

export type MobileMessagingSignalType = (typeof MOBILE_MESSAGING_SIGNAL_TYPES)[number];

/** Scoring signal for mobile messaging blueprint confidence. */
export type MobileMessagingSignal = {
  signalType: MobileMessagingSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const mobileMessagingSignalSchema = z.object({
  signalType: z.enum(MOBILE_MESSAGING_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a MobileMessagingSignal record shape. */
export function validateMobileMessagingSignal(value: unknown): MobileMessagingSignal {
  return mobileMessagingSignalSchema.parse(value);
}
