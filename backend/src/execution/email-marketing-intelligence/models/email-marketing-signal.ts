import { z } from "zod";

export const EMAIL_MARKETING_SIGNAL_TYPES = [
  "welcome_quality",
  "recovery_coverage",
  "transactional_clarity",
  "retention_depth",
  "calendar_completeness",
  "copy_quality",
  "subject_line_strength",
  "email_composite",
] as const;

export type EmailMarketingSignalType = (typeof EMAIL_MARKETING_SIGNAL_TYPES)[number];

/** Scoring signal for email marketing blueprint confidence. */
export type EmailMarketingSignal = {
  signalType: EmailMarketingSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const emailMarketingSignalSchema = z.object({
  signalType: z.enum(EMAIL_MARKETING_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates an EmailMarketingSignal record shape. */
export function validateEmailMarketingSignal(value: unknown): EmailMarketingSignal {
  return emailMarketingSignalSchema.parse(value);
}
