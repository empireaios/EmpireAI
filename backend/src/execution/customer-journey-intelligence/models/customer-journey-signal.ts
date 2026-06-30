import { z } from "zod";

export const CUSTOMER_JOURNEY_SIGNAL_TYPES = [
  "discovery_strength",
  "conversion_path",
  "checkout_readiness",
  "retention_potential",
  "recovery_coverage",
  "loyalty_depth",
  "journey_composite",
] as const;

export type CustomerJourneySignalType = (typeof CUSTOMER_JOURNEY_SIGNAL_TYPES)[number];

/** Scoring signal for customer journey confidence. */
export type CustomerJourneySignal = {
  signalType: CustomerJourneySignalType;
  score: number;
  weight: number;
  detail: string;
};

export const customerJourneySignalSchema = z.object({
  signalType: z.enum(CUSTOMER_JOURNEY_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a CustomerJourneySignal record shape. */
export function validateCustomerJourneySignal(value: unknown): CustomerJourneySignal {
  return customerJourneySignalSchema.parse(value);
}
