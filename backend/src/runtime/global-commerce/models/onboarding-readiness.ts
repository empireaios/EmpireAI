import { z } from "zod";

export const OnboardingStatusSchema = z.enum([
  "NOT_STARTED",
  "INFO_REQUIRED",
  "ACCOUNT_REQUIRED",
  "KYC_REQUIRED",
  "TERMS_REQUIRED",
  "CREDENTIALS_REQUIRED",
  "PENDING_REVIEW",
  "CONNECTED",
  "READY",
  "BLOCKED",
]);

export type OnboardingStatus = z.infer<typeof OnboardingStatusSchema>;

export const OnboardingReadinessSchema = z.object({
  countryCode: z.string(),
  providerId: z.string(),
  displayName: z.string(),
  domain: z.string(),
  status: OnboardingStatusSchema,
  readinessScore: z.number().int().min(0).max(100),
  missingActions: z.array(z.string()),
  humanActions: z.array(z.string()),
  automatableActions: z.array(z.string()),
  risk: z.enum(["LOW", "MEDIUM", "HIGH"]),
  estimatedSetupDifficulty: z.enum(["EASY", "MODERATE", "HARD", "VERY_HARD"]),
  runtimePluginId: z.string().optional(),
  pluginCertified: z.boolean(),
});

export type OnboardingReadiness = z.infer<typeof OnboardingReadinessSchema>;
