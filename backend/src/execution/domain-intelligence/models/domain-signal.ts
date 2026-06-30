import { z } from "zod";

export const DOMAIN_SIGNAL_TYPES = [
  "brand_name_alignment",
  "slug_quality",
  "tld_preference",
  "availability_estimate",
  "alternative_coverage",
  "niche_relevance",
  "domain_composite",
] as const;

export type DomainSignalType = (typeof DOMAIN_SIGNAL_TYPES)[number];

/** Individual factor contributing to domain intelligence scoring. */
export type DomainSignal = {
  signalType: DomainSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const domainSignalSchema = z.object({
  signalType: z.enum(DOMAIN_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a DomainSignal record shape. */
export function validateDomainSignal(value: unknown): DomainSignal {
  return domainSignalSchema.parse(value);
}
