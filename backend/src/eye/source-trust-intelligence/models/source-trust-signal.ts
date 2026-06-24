import { z } from "zod";

export const SOURCE_TRUST_SIGNAL_TYPES = [
  "historical_accuracy",
  "signal_consistency",
  "noise_level",
  "manipulation_risk",
  "connector_health",
  "evidence_alignment",
] as const;

export type SourceTrustSignalType = (typeof SOURCE_TRUST_SIGNAL_TYPES)[number];

/** Individual factor contributing to a source trust profile. */
export type SourceTrustSignal = {
  signalType: SourceTrustSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const sourceTrustSignalSchema = z.object({
  signalType: z.enum(SOURCE_TRUST_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a SourceTrustSignal record shape. */
export function validateSourceTrustSignal(value: unknown): SourceTrustSignal {
  return sourceTrustSignalSchema.parse(value);
}
