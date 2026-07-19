/** R4-12 — Loyalty Analytics Engine. */

import type { LoyaltyAbuseAlert, LoyaltyRecord } from "./types.js";

export type LoyaltySummary = {
  totalProgrammes: number;
  totalMembers: number;
  totalRecords: number;
  totalPointsAwarded: number;
  totalPointsRedeemed: number;
  activeAbuseAlerts: number;
  failedRecords: number;
};

export class LoyaltyAnalyticsEngine {
  summarize(
    records: LoyaltyRecord[],
    programmeCount: number,
    memberCount: number,
    alerts: LoyaltyAbuseAlert[],
  ): LoyaltySummary {
    return {
      totalProgrammes: programmeCount,
      totalMembers: memberCount,
      totalRecords: records.length,
      totalPointsAwarded: records.reduce((sum, r) => sum + r.pointsEarned, 0),
      totalPointsRedeemed: records.reduce((sum, r) => sum + r.pointsRedeemed, 0),
      activeAbuseAlerts: alerts.filter((a) => a.severity !== "low").length,
      failedRecords: records.filter((r) => r.validationStatus === "failed").length,
    };
  }

  detectAbuse(
    records: LoyaltyRecord[],
    config: { maxPointsPerAward: number; maxRedemptionsPerHour: number },
  ): Array<{
    abuseType: LoyaltyAbuseAlert["abuseType"];
    severity: LoyaltyAbuseAlert["severity"];
    message: string;
    record: LoyaltyRecord;
  }> {
    const detected: Array<{
      abuseType: LoyaltyAbuseAlert["abuseType"];
      severity: LoyaltyAbuseAlert["severity"];
      message: string;
      record: LoyaltyRecord;
    }> = [];

    const oneHourAgo = Date.now() - 3_600_000;
    const recentRedemptions = records.filter(
      (r) =>
        r.activityType === "points_redeemed" &&
        new Date(r.timestamp).getTime() >= oneHourAgo,
    );

    const byCustomer = new Map<string, LoyaltyRecord[]>();
    for (const r of recentRedemptions) {
      const key = `${r.customerId}:${r.loyaltyProgrammeId}`;
      byCustomer.set(key, [...(byCustomer.get(key) ?? []), r]);
    }

    for (const [, group] of byCustomer) {
      if (group.length > config.maxRedemptionsPerHour) {
        const latest = group[group.length - 1]!;
        detected.push({
          abuseType: "rapid_activity",
          severity: "high",
          message: `${group.length} redemptions within one hour`,
          record: latest,
        });
      }
    }

    for (const record of records) {
      if (record.pointsEarned > config.maxPointsPerAward) {
        detected.push({
          abuseType: "excessive_award",
          severity: "high",
          message: `Award of ${record.pointsEarned} exceeds limit`,
          record,
        });
      }
      if (record.currentPointsBalance < 0) {
        detected.push({
          abuseType: "negative_balance",
          severity: "high",
          message: "Negative points balance detected",
          record,
        });
      }
    }

    return detected;
  }

  toMachineReadable(record: LoyaltyRecord): Record<string, unknown> {
    return {
      loyaltyRecordId: record.loyaltyRecordId,
      timestamp: record.timestamp,
      customerId: record.customerId,
      loyaltyProgrammeId: record.loyaltyProgrammeId,
      loyaltyTier: record.loyaltyTier,
      pointsEarned: record.pointsEarned,
      pointsRedeemed: record.pointsRedeemed,
      currentPointsBalance: record.currentPointsBalance,
      rewardReference: record.rewardReference,
      validationStatus: record.validationStatus,
      metadataVersion: record.metadataVersion,
    };
  }
}
