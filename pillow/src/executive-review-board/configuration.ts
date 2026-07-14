/** E5-10 — Executive Review Board configuration. */

export type ReviewBoardConfiguration = {
  reviewCycleDays: number;
  executiveReviewIntervalDays: number;
  scanFrequencyMinutes: number;
  actionDueDays: number;
  notificationRouting: string[];
  autoEscalationEnabled: boolean;
  criticalAreaReviewRequired: boolean;
};

export const DEFAULT_REVIEW_CONFIGURATION: ReviewBoardConfiguration = {
  reviewCycleDays: 7,
  executiveReviewIntervalDays: 14,
  scanFrequencyMinutes: 5,
  actionDueDays: 14,
  notificationRouting: ["ecc", "supervisor", "guardian"],
  autoEscalationEnabled: true,
  criticalAreaReviewRequired: true,
};

export function buildReviewConfiguration(
  overrides: Partial<ReviewBoardConfiguration> = {},
): ReviewBoardConfiguration {
  return { ...DEFAULT_REVIEW_CONFIGURATION, ...overrides };
}
