import { z } from "zod";

/** CRIR certification workflow — docs/governance/COMMERCIAL_RISK_INTELLIGENCE_REPORT_SPECIFICATION.md §5 */
export const CRIR_CERTIFICATION_STATUSES = [
  "DRAFT",
  "INTELLIGENCE_REVIEWED",
  "FINANCE_REVIEWED",
  "GOVERNANCE_CERTIFIED",
  "GRAND_KING_APPROVED",
] as const;

export type CrirCertificationStatus = (typeof CRIR_CERTIFICATION_STATUSES)[number];

export const CRIR_SURVIVABILITY_ASSESSMENTS = ["PASS", "FAIL", "CONDITIONAL"] as const;
export type CrirSurvivabilityAssessment = (typeof CRIR_SURVIVABILITY_ASSESSMENTS)[number];

export const crirReportSchema = z.object({
  reportId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  productOrOpportunityId: z.string().optional(),
  supplierIds: z.array(z.string()).default([]),
  marketplaceIds: z.array(z.string()).default([]),
  preparedBy: z.string().min(1),
  preparedAt: z.string().datetime({ offset: true }),
  certificationStatus: z.enum(CRIR_CERTIFICATION_STATUSES),
  survivabilityAssessment: z.enum(CRIR_SURVIVABILITY_ASSESSMENTS),
  version: z.string().default("1.0"),
  sectionsComplete: z.boolean().default(false),
  netMarginPercentAfterCosts: z.number().optional(),
  updatedAt: z.string().datetime({ offset: true }),
});

export type CrirReport = z.infer<typeof crirReportSchema>;

export const registerCrirReportInputSchema = crirReportSchema.omit({
  updatedAt: true,
}).extend({
  updatedAt: z.string().datetime({ offset: true }).optional(),
});

export type RegisterCrirReportInput = z.infer<typeof registerCrirReportInputSchema>;

const STATUS_RANK: Record<CrirCertificationStatus, number> = {
  DRAFT: 0,
  INTELLIGENCE_REVIEWED: 1,
  FINANCE_REVIEWED: 2,
  GOVERNANCE_CERTIFIED: 3,
  GRAND_KING_APPROVED: 4,
};

/** Minimum certification for launch per EI6-09 / CRIR spec §4 */
export const CRIR_MINIMUM_LAUNCH_CERTIFICATION: CrirCertificationStatus = "GOVERNANCE_CERTIFIED";

export function crirCertificationRank(status: CrirCertificationStatus): number {
  return STATUS_RANK[status];
}

export function isCrirLaunchCertificationSufficient(status: CrirCertificationStatus): boolean {
  return crirCertificationRank(status) >= crirCertificationRank(CRIR_MINIMUM_LAUNCH_CERTIFICATION);
}
