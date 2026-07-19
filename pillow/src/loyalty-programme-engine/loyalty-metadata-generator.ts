/** R4-12 — Loyalty metadata generator. */

import {
  LOYALTY_PROGRAMME_ENGINE_ID,
  LPE_CAPABILITIES,
  LPE_METADATA_VERSION,
} from "./paths.js";
import type {
  EngineState,
  LoyaltyAbuseAlert,
  LoyaltyEngineRecord,
  LoyaltyFailure,
  LoyaltyMember,
  LoyaltyProgramme,
  LoyaltyRecord,
  LoyaltyReward,
  LoyaltyRunReport,
  LoyaltyTier,
  LoyaltyValidationReport,
  LoyaltyActivityType,
  ValidationStatus,
} from "./types.js";

export function buildLoyaltyEngineRecordId(): string {
  return `lpe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildLoyaltyRunReportId(): string {
  return `lpe-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildLoyaltyRecordId(): string {
  return `lpe-rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildLoyaltyProgrammeId(): string {
  return `lpe-prog-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildLoyaltyMemberId(): string {
  return `lpe-mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildLoyaltyRewardId(): string {
  return `lpe-reward-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildLoyaltyAbuseAlertId(): string {
  return `lpe-alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildLoyaltyFailureId(): string {
  return `lpe-fail-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class LoyaltyMetadataGenerator {
  buildEngineRecord(input: {
    operationalState: EngineState;
    validationStatus: ValidationStatus;
    identityEngineConnected: boolean;
    crmFoundationConnected: boolean;
    timelineEngineConnected: boolean;
    sentimentEngineConnected: boolean;
    reviewManagementEngineConnected: boolean;
  }): LoyaltyEngineRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      engineRecordId: buildLoyaltyEngineRecordId(),
      timestamp: new Date().toISOString(),
      engineId: LOYALTY_PROGRAMME_ENGINE_ID,
      engineVersion: LPE_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      supportedCapabilities: [...LPE_CAPABILITIES],
      identityEngineConnected: input.identityEngineConnected,
      crmFoundationConnected: input.crmFoundationConnected,
      timelineEngineConnected: input.timelineEngineConnected,
      sentimentEngineConnected: input.sentimentEngineConnected,
      reviewManagementEngineConnected: input.reviewManagementEngineConnected,
      metadataVersion: LPE_METADATA_VERSION,
    };
  }

  buildProgramme(input: {
    programmeName: string;
    programmeDescription: string;
  }): LoyaltyProgramme {
    return {
      loyaltyProgrammeId: buildLoyaltyProgrammeId(),
      timestamp: new Date().toISOString(),
      programmeName: input.programmeName,
      programmeDescription: input.programmeDescription,
      active: true,
      metadataVersion: LPE_METADATA_VERSION,
    };
  }

  buildMember(input: {
    customerId: string;
    loyaltyProgrammeId: string;
    loyaltyTier: LoyaltyTier;
    currentPointsBalance: number;
  }): LoyaltyMember {
    return {
      memberId: buildLoyaltyMemberId(),
      timestamp: new Date().toISOString(),
      customerId: input.customerId,
      loyaltyProgrammeId: input.loyaltyProgrammeId,
      loyaltyTier: input.loyaltyTier,
      currentPointsBalance: input.currentPointsBalance,
      metadataVersion: LPE_METADATA_VERSION,
    };
  }

  buildLoyaltyRecord(input: {
    customerId: string;
    loyaltyProgrammeId: string;
    loyaltyTier: LoyaltyTier;
    pointsEarned: number;
    pointsRedeemed: number;
    currentPointsBalance: number;
    rewardReference: string | null;
    activityType: LoyaltyActivityType;
    validationStatus?: ValidationStatus;
  }): LoyaltyRecord {
    return {
      loyaltyRecordId: buildLoyaltyRecordId(),
      timestamp: new Date().toISOString(),
      customerId: input.customerId,
      loyaltyProgrammeId: input.loyaltyProgrammeId,
      loyaltyTier: input.loyaltyTier,
      pointsEarned: input.pointsEarned,
      pointsRedeemed: input.pointsRedeemed,
      currentPointsBalance: input.currentPointsBalance,
      rewardReference: input.rewardReference,
      activityType: input.activityType,
      validationStatus: input.validationStatus ?? "passed",
      metadataVersion: LPE_METADATA_VERSION,
    };
  }

  buildReward(input: {
    customerId: string;
    loyaltyProgrammeId: string;
    loyaltyRecordId: string;
    rewardReference: string;
    pointsCost: number;
    description: string;
  }): LoyaltyReward {
    return {
      rewardId: buildLoyaltyRewardId(),
      timestamp: new Date().toISOString(),
      customerId: input.customerId,
      loyaltyProgrammeId: input.loyaltyProgrammeId,
      loyaltyRecordId: input.loyaltyRecordId,
      rewardReference: input.rewardReference,
      pointsCost: input.pointsCost,
      description: input.description,
      metadataVersion: LPE_METADATA_VERSION,
    };
  }

  buildAbuseAlert(input: {
    customerId: string;
    loyaltyRecordId: string | null;
    abuseType: LoyaltyAbuseAlert["abuseType"];
    severity: LoyaltyAbuseAlert["severity"];
    message: string;
  }): LoyaltyAbuseAlert {
    return {
      alertId: buildLoyaltyAbuseAlertId(),
      timestamp: new Date().toISOString(),
      customerId: input.customerId,
      loyaltyRecordId: input.loyaltyRecordId,
      abuseType: input.abuseType,
      severity: input.severity,
      message: input.message,
      metadataVersion: LPE_METADATA_VERSION,
    };
  }

  buildFailure(
    loyaltyRecordId: string | null,
    reason: string,
    severity: LoyaltyFailure["severity"],
  ): LoyaltyFailure {
    return {
      failureId: buildLoyaltyFailureId(),
      timestamp: new Date().toISOString(),
      loyaltyRecordId,
      reason,
      severity,
      metadataVersion: LPE_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: LoyaltyRunReport["action"];
    engineRecord: LoyaltyEngineRecord;
    loyaltyRecords: LoyaltyRecord[];
    rewards: LoyaltyReward[];
    abuseAlerts: LoyaltyAbuseAlert[];
    failures: LoyaltyFailure[];
    validation: LoyaltyValidationReport;
    durationMs: number;
  }): LoyaltyRunReport {
    return {
      loyaltyRunReportId: buildLoyaltyRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      loyaltyRecords: input.loyaltyRecords,
      rewards: input.rewards,
      abuseAlerts: input.abuseAlerts,
      failures: input.failures,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: LPE_METADATA_VERSION,
    };
  }
}
