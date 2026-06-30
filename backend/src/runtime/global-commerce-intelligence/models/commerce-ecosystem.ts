import { z } from "zod";

export const EcosystemDomainCoverageSchema = z.object({
  domain: z.string(),
  providerCount: z.number().int().min(0),
  providerIds: z.array(z.string()),
  coverageScore: z.number().min(0).max(100),
  readinessScore: z.number().min(0).max(100),
});

export type EcosystemDomainCoverage = z.infer<typeof EcosystemDomainCoverageSchema>;

export const CommerceEcosystemProfileSchema = z.object({
  countryCode: z.string(),
  displayName: z.string(),
  currency: z.string(),
  languages: z.array(z.string()),
  domains: z.array(EcosystemDomainCoverageSchema),
  taxProviders: z.array(z.string()),
  complianceNotes: z.array(z.string()),
  ecosystemHealthScore: z.number().min(0).max(100),
  ecosystemMaturity: z.enum(["EMERGING", "DEVELOPING", "MATURE", "ADVANCED"]),
  gaps: z.array(z.string()),
  computedAt: z.string(),
});

export type CommerceEcosystemProfile = z.infer<typeof CommerceEcosystemProfileSchema>;
