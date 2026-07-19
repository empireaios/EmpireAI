/** R4-12 — Loyalty Programme Manager. */

import type { CustomerIdentityEngine } from "../customer-identity-engine/engine.js";
import type { CrmFoundationEngine } from "../crm-foundation/engine.js";
import type { CustomerTimelineEngine } from "../customer-timeline-engine/engine.js";
import type { CustomerSentimentEngine } from "../customer-sentiment-engine/engine.js";
import type { ReviewManagementEngine } from "../review-management-engine/engine.js";
import { appendLpeLog } from "./lpe-logging.js";
import { LoyaltyRegistry } from "./loyalty-registry.js";
import { LoyaltyMetadataGenerator } from "./loyalty-metadata-generator.js";
import { LoyaltyMembershipEngine } from "./loyalty-membership-engine.js";
import { LoyaltyPointsEngine } from "./loyalty-points-engine.js";
import { LoyaltyTierManager } from "./loyalty-tier-manager.js";
import { LoyaltyRewardsEngine } from "./loyalty-rewards-engine.js";
import { LoyaltyAnalyticsEngine } from "./loyalty-analytics-engine.js";
import { LoyaltyValidationEngine } from "./loyalty-validation-engine.js";
import { LoyaltyValidator } from "./loyalty-validator.js";
import type { LoyaltyProgrammeEngineConfiguration } from "./configuration.js";
import type {
  AwardLoyaltyPointsInput,
  ConnectLoyaltyProgrammeEngineInput,
  CreateLoyaltyProgrammeInput,
  DetectLoyaltyAbuseInput,
  DetectLoyaltyFailuresInput,
  GenerateLoyaltyRewardsInput,
  LoyaltyAbuseAlert,
  LoyaltyEngineRecord,
  LoyaltyFailure,
  LoyaltyMember,
  LoyaltyRecord,
  LoyaltyReward,
  LoyaltyRunReport,
  ManageLoyaltyTierInput,
  RedeemLoyaltyPointsInput,
  RegisterLoyaltyMemberInput,
  TrackLoyaltyActivityInput,
  TrackLoyaltyBalanceInput,
} from "./types.js";

export class LoyaltyProgrammeManager {
  private engineRecord: LoyaltyEngineRecord | null = null;
  private readonly registry = new LoyaltyRegistry();
  private readonly metadataGenerator = new LoyaltyMetadataGenerator();
  private readonly membershipEngine = new LoyaltyMembershipEngine();
  private readonly pointsEngine = new LoyaltyPointsEngine();
  private readonly tierManager = new LoyaltyTierManager();
  private readonly rewardsEngine = new LoyaltyRewardsEngine();
  private readonly analyticsEngine = new LoyaltyAnalyticsEngine();
  private readonly validationEngine = new LoyaltyValidationEngine();
  private readonly validator = new LoyaltyValidator();
  private readonly failures: LoyaltyFailure[] = [];

  constructor(
    private readonly identityEngine: CustomerIdentityEngine | null,
    private readonly crmFoundation: CrmFoundationEngine | null,
    private readonly timelineEngine: CustomerTimelineEngine | null,
    private readonly sentimentEngine: CustomerSentimentEngine | null,
    private readonly reviewManagementEngine: ReviewManagementEngine | null,
  ) {}

  getEngineRecord(): LoyaltyEngineRecord | null {
    return this.engineRecord;
  }

  getRegistry(): LoyaltyRegistry {
    return this.registry;
  }

  getLoyaltyRecords(): LoyaltyRecord[] {
    return this.registry.listRecords();
  }

  getAnalyticsEngine(): LoyaltyAnalyticsEngine {
    return this.analyticsEngine;
  }

  private isEngineConnected(
    engine: { getEngineRecord?: () => { currentOperationalState?: string } | null } | null,
  ): boolean {
    try {
      const record = engine?.getEngineRecord?.();
      return (
        record?.currentOperationalState === "active" ||
        record?.currentOperationalState === "connected"
      );
    } catch {
      return false;
    }
  }

  private resolveCustomer(customerId: string): { valid: boolean; error: string | null } {
    if (!customerId?.trim()) {
      return { valid: false, error: "Customer ID is required" };
    }

    const hasIdentity =
      this.identityEngine
        ?.getCustomerRecords()
        .some((r) => r.customerId === customerId) ?? false;
    const hasCrm =
      this.crmFoundation
        ?.getCrmRecords()
        .some((p) => p.customerId === customerId) ?? false;
    const hasTimeline =
      this.timelineEngine?.getTimelineRecords().some((r) => r.customerId === customerId) ?? false;

    if (!hasIdentity && !hasCrm && !hasTimeline) {
      return { valid: false, error: `No customer records found for ${customerId}` };
    }
    return { valid: true, error: null };
  }

  private recordToTimeline(customerId: string, description: string, reference: string): void {
    try {
      this.timelineEngine?.recordSupportActivity({
        customerId,
        eventReference: reference,
        eventDescription: description,
        eventSource: "support",
      });
    } catch {
      // best-effort
    }
  }

  private getMemberOrFail(
    customerId: string,
    programmeId: string,
  ): { member: LoyaltyMember | null; error: string | null } {
    const member = this.registry.getMember(customerId, programmeId);
    if (!member) {
      return { member: null, error: "Customer is not registered for this loyalty programme" };
    }
    return { member, error: null };
  }

  private updateMemberBalance(member: LoyaltyMember, newBalance: number, tier?: LoyaltyMember["loyaltyTier"]): LoyaltyMember {
    const updated: LoyaltyMember = {
      ...member,
      currentPointsBalance: newBalance,
      loyaltyTier: tier ?? member.loyaltyTier,
      timestamp: new Date().toISOString(),
    };
    this.registry.storeMember(updated);
    return updated;
  }

  private reviewBonusPoints(customerId: string): number {
    if (!this.reviewManagementEngine) return 0;
    try {
      const positive = this.reviewManagementEngine
        .getReviewRecords()
        .filter((r) => r.customerId === customerId && r.reviewSentiment === "positive");
      return Math.min(positive.length * 10, 100);
    } catch {
      return 0;
    }
  }

  connectLoyaltyProgrammeEngine(
    _input: ConnectLoyaltyProgrammeEngineInput,
    config: LoyaltyProgrammeEngineConfiguration,
  ): LoyaltyRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);

    const record = this.metadataGenerator.buildEngineRecord({
      operationalState: configValidation.decision === "fail" ? "failed" : "active",
      validationStatus: configValidation.decision === "pass" ? "passed" : "partial",
      identityEngineConnected: this.isEngineConnected(this.identityEngine),
      crmFoundationConnected: this.isEngineConnected(this.crmFoundation),
      timelineEngineConnected: this.isEngineConnected(this.timelineEngine),
      sentimentEngineConnected: this.isEngineConnected(this.sentimentEngine),
      reviewManagementEngineConnected: this.isEngineConnected(this.reviewManagementEngine),
    });
    this.engineRecord = record;

    const validation = this.validator.validateEngineRecord(record);
    if (configValidation.decision !== "pass") {
      validation.warnings.push(...configValidation.warnings);
      if (configValidation.errors.length > 0) {
        validation.errors.push(...configValidation.errors);
        validation.decision = "fail";
      } else {
        validation.decision = "partial";
      }
    }

    appendLpeLog({
      event: "engine_initialization",
      level: "info",
      details: `Loyalty Programme Engine connected: ${validation.decision}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      loyaltyRecords: [],
      rewards: [],
      abuseAlerts: [],
      failures: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  createLoyaltyProgramme(
    input: CreateLoyaltyProgrammeInput,
    config: LoyaltyProgrammeEngineConfiguration,
  ): LoyaltyRunReport {
    return this.runAction("create_programme", config, () => {
      const errors: string[] = [];
      if (!input.programmeName?.trim()) errors.push("Programme name is required");

      if (errors.length > 0) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(...errors);
        return this.emptyResult(validation, errors.join("; "));
      }

      const programme = this.metadataGenerator.buildProgramme({
        programmeName: input.programmeName.trim(),
        programmeDescription: input.programmeDescription?.trim() ?? "",
      });
      this.registry.storeProgramme(programme);

      appendLpeLog({
        event: "programme_creation",
        level: "info",
        details: `Created programme ${programme.loyaltyProgrammeId}: ${programme.programmeName}`,
      });

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      return {
        loyaltyRecords: [],
        rewards: [],
        abuseAlerts: [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  registerLoyaltyMember(
    input: RegisterLoyaltyMemberInput,
    config: LoyaltyProgrammeEngineConfiguration,
  ): LoyaltyRunReport {
    return this.runAction("register_member", config, () => {
      const customer = this.resolveCustomer(input.customerId);
      if (!customer.valid) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(customer.error ?? "Invalid customer");
        return this.emptyResult(validation, customer.error);
      }

      const programme = this.registry.getProgramme(input.loyaltyProgrammeId);
      const registration = this.membershipEngine.validateRegistration({
        customerId: input.customerId,
        loyaltyProgrammeId: input.loyaltyProgrammeId,
        programmeExists: programme !== null,
        alreadyRegistered: this.registry.getMember(input.customerId, input.loyaltyProgrammeId) !== null,
      });

      if (!registration.valid) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(...registration.errors);
        return this.emptyResult(validation, registration.errors.join("; "));
      }

      const tier = this.membershipEngine.initialTier(config);
      const member = this.metadataGenerator.buildMember({
        customerId: input.customerId,
        loyaltyProgrammeId: input.loyaltyProgrammeId,
        loyaltyTier: tier,
        currentPointsBalance: 0,
      });
      this.registry.storeMember(member);

      let record = this.metadataGenerator.buildLoyaltyRecord({
        customerId: input.customerId,
        loyaltyProgrammeId: input.loyaltyProgrammeId,
        loyaltyTier: tier,
        pointsEarned: 0,
        pointsRedeemed: 0,
        currentPointsBalance: 0,
        rewardReference: null,
        activityType: "registration",
      });

      const validation = this.validationEngine.validateLoyaltyRecord(record, config);
      if (validation.decision === "fail") {
        return this.emptyResult(validation, validation.errors.join("; "));
      }

      record.validationStatus = validation.decision === "pass" ? "passed" : "partial";
      this.registry.storeRecord(record);

      this.recordToTimeline(
        input.customerId,
        `Registered for loyalty programme ${programme!.programmeName}`,
        record.loyaltyRecordId,
      );

      appendLpeLog({
        event: "loyalty_registration",
        level: "info",
        details: `Member ${member.memberId} registered at tier ${tier}`,
      });

      return {
        loyaltyRecords: [record],
        rewards: [],
        abuseAlerts: [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  awardLoyaltyPoints(
    input: AwardLoyaltyPointsInput,
    config: LoyaltyProgrammeEngineConfiguration,
  ): LoyaltyRunReport {
    return this.runAction("award_points", config, () => {
      const customer = this.resolveCustomer(input.customerId);
      if (!customer.valid) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(customer.error ?? "Invalid customer");
        return this.emptyResult(validation, customer.error);
      }

      const { member, error: memberError } = this.getMemberOrFail(
        input.customerId,
        input.loyaltyProgrammeId,
      );
      if (!member) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(memberError ?? "Member not found");
        return this.emptyResult(validation, memberError);
      }

      const award = this.pointsEngine.validateAward(input.points, config);
      if (!award.valid) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(...award.errors);
        return this.emptyResult(validation, award.errors.join("; "));
      }

      const bonus = this.reviewBonusPoints(input.customerId);
      const totalAward = award.normalizedPoints + bonus;
      const newBalance = member.currentPointsBalance + totalAward;
      const tier = this.tierManager.resolveTier(newBalance, config);
      this.updateMemberBalance(member, newBalance, tier);

      let record = this.metadataGenerator.buildLoyaltyRecord({
        customerId: input.customerId,
        loyaltyProgrammeId: input.loyaltyProgrammeId,
        loyaltyTier: tier,
        pointsEarned: totalAward,
        pointsRedeemed: 0,
        currentPointsBalance: newBalance,
        rewardReference: null,
        activityType: "points_awarded",
      });

      const validation = this.validationEngine.validateLoyaltyRecord(record, config);
      if (validation.decision === "fail") {
        return this.emptyResult(validation, validation.errors.join("; "));
      }

      record.validationStatus = validation.decision === "pass" ? "passed" : "partial";
      this.registry.storeRecord(record);

      this.recordToTimeline(
        input.customerId,
        `Awarded ${totalAward} loyalty points${input.reason ? `: ${input.reason}` : ""}`,
        record.loyaltyRecordId,
      );

      appendLpeLog({
        event: "points_awarded",
        level: "info",
        details: `Awarded ${totalAward} points to ${input.customerId} · balance ${newBalance}`,
      });

      return {
        loyaltyRecords: [record],
        rewards: [],
        abuseAlerts: [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  redeemLoyaltyPoints(
    input: RedeemLoyaltyPointsInput,
    config: LoyaltyProgrammeEngineConfiguration,
  ): LoyaltyRunReport {
    return this.runAction("redeem_points", config, () => {
      const { member, error: memberError } = this.getMemberOrFail(
        input.customerId,
        input.loyaltyProgrammeId,
      );
      if (!member) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(memberError ?? "Member not found");
        return this.emptyResult(validation, memberError);
      }

      const redemption = this.pointsEngine.validateRedemption(
        input.points,
        member.currentPointsBalance,
        config,
      );
      if (!redemption.valid) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(...redemption.errors);
        return this.emptyResult(validation, redemption.errors.join("; "));
      }

      const rewardRef = input.rewardReference?.trim() ?? `redeem-${Date.now()}`;
      const redemptionKey = `redeem:${input.customerId}:${input.loyaltyProgrammeId}:${rewardRef}`;

      if (config.duplicateDetectionEnabled && this.registry.hasRedemptionKey(redemptionKey)) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("Duplicate reward redemption detected");
        return this.emptyResult(validation, "Duplicate reward redemption detected");
      }

      const newBalance = member.currentPointsBalance - redemption.normalizedPoints;
      const tier = this.tierManager.resolveTier(newBalance, config);
      this.updateMemberBalance(member, newBalance, tier);

      let record = this.metadataGenerator.buildLoyaltyRecord({
        customerId: input.customerId,
        loyaltyProgrammeId: input.loyaltyProgrammeId,
        loyaltyTier: tier,
        pointsEarned: 0,
        pointsRedeemed: redemption.normalizedPoints,
        currentPointsBalance: newBalance,
        rewardReference: rewardRef,
        activityType: "points_redeemed",
      });

      const validation = this.validationEngine.validateLoyaltyRecord(record, config);
      if (validation.decision === "fail") {
        return this.emptyResult(validation, validation.errors.join("; "));
      }

      record.validationStatus = validation.decision === "pass" ? "passed" : "partial";
      this.registry.storeRecord(record, redemptionKey);

      this.recordToTimeline(
        input.customerId,
        `Redeemed ${redemption.normalizedPoints} loyalty points for ${rewardRef}`,
        record.loyaltyRecordId,
      );

      appendLpeLog({
        event: "points_redeemed",
        level: "info",
        details: `Redeemed ${redemption.normalizedPoints} points · balance ${newBalance}`,
      });

      return {
        loyaltyRecords: [record],
        rewards: [],
        abuseAlerts: [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  manageLoyaltyTier(
    input: ManageLoyaltyTierInput,
    config: LoyaltyProgrammeEngineConfiguration,
  ): LoyaltyRunReport {
    return this.runAction("manage_tier", config, () => {
      const { member, error: memberError } = this.getMemberOrFail(
        input.customerId,
        input.loyaltyProgrammeId,
      );
      if (!member) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(memberError ?? "Member not found");
        return this.emptyResult(validation, memberError);
      }

      const newTier = this.tierManager.resolveTier(member.currentPointsBalance, config);
      const updated = this.updateMemberBalance(member, member.currentPointsBalance, newTier);

      let record = this.metadataGenerator.buildLoyaltyRecord({
        customerId: input.customerId,
        loyaltyProgrammeId: input.loyaltyProgrammeId,
        loyaltyTier: newTier,
        pointsEarned: 0,
        pointsRedeemed: 0,
        currentPointsBalance: updated.currentPointsBalance,
        rewardReference: null,
        activityType: "tier_change",
      });

      const validation = this.validationEngine.validateLoyaltyRecord(record, config);
      record.validationStatus = validation.decision === "pass" ? "passed" : "partial";
      this.registry.storeRecord(record);

      appendLpeLog({
        event: "tier_management",
        level: "info",
        details: `Tier updated to ${newTier} for ${input.customerId}`,
      });

      return {
        loyaltyRecords: [record],
        rewards: [],
        abuseAlerts: [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  trackLoyaltyBalance(
    input: TrackLoyaltyBalanceInput,
    config: LoyaltyProgrammeEngineConfiguration,
  ): LoyaltyRunReport {
    return this.runAction("track_balance", config, () => {
      const members = this.registry.listMembers().filter((m) => {
        if (input.customerId && m.customerId !== input.customerId) return false;
        if (input.loyaltyProgrammeId && m.loyaltyProgrammeId !== input.loyaltyProgrammeId) {
          return false;
        }
        return true;
      });

      const records = members.map((m) =>
        this.metadataGenerator.buildLoyaltyRecord({
          customerId: m.customerId,
          loyaltyProgrammeId: m.loyaltyProgrammeId,
          loyaltyTier: m.loyaltyTier,
          pointsEarned: 0,
          pointsRedeemed: 0,
          currentPointsBalance: m.currentPointsBalance,
          rewardReference: null,
          activityType: "points_awarded",
          validationStatus: "passed",
        }),
      );

      appendLpeLog({
        event: "balance_tracking",
        level: "info",
        details: `Tracked balance for ${members.length} member(s)`,
      });

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      return {
        loyaltyRecords: records,
        rewards: [],
        abuseAlerts: [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  trackLoyaltyActivity(
    input: TrackLoyaltyActivityInput,
    config: LoyaltyProgrammeEngineConfiguration,
  ): LoyaltyRunReport {
    return this.runAction("track_activity", config, () => {
      const records = this.registry.listRecords().filter((r) => {
        if (input.customerId && r.customerId !== input.customerId) return false;
        if (input.loyaltyProgrammeId && r.loyaltyProgrammeId !== input.loyaltyProgrammeId) {
          return false;
        }
        return true;
      });

      appendLpeLog({
        event: "activity_tracking",
        level: "info",
        details: `Tracked ${records.length} loyalty activity record(s)`,
      });

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      return {
        loyaltyRecords: records,
        rewards: [],
        abuseAlerts: [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  detectLoyaltyAbuse(
    input: DetectLoyaltyAbuseInput,
    config: LoyaltyProgrammeEngineConfiguration,
  ): LoyaltyRunReport {
    return this.runAction("detect_abuse", config, () => {
      if (!config.abuseDetectionEnabled) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        return {
          loyaltyRecords: [],
          rewards: [],
          abuseAlerts: [],
          failures: [],
          validation,
          error: null,
        };
      }

      const records = input.loyaltyRecordId
        ? [this.registry.getRecord(input.loyaltyRecordId)].filter(Boolean) as LoyaltyRecord[]
        : this.registry.listRecords().filter((r) =>
            input.customerId ? r.customerId === input.customerId : true,
          );

      const detected = this.analyticsEngine.detectAbuse(records, {
        maxPointsPerAward: config.maxPointsPerAward,
        maxRedemptionsPerHour: config.maxRedemptionsPerHour,
      });

      const alerts: LoyaltyAbuseAlert[] = detected.map((d) => {
        const alert = this.metadataGenerator.buildAbuseAlert({
          customerId: d.record.customerId,
          loyaltyRecordId: d.record.loyaltyRecordId,
          abuseType: d.abuseType,
          severity: d.severity,
          message: d.message,
        });
        this.registry.storeAlert(alert);
        return alert;
      });

      appendLpeLog({
        event: "abuse_detection",
        level: alerts.length > 0 ? "warn" : "info",
        details: `Detected ${alerts.length} abuse alert(s)`,
      });

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      return {
        loyaltyRecords: records,
        rewards: [],
        abuseAlerts: alerts,
        failures: [],
        validation,
        error: alerts.length > 0 ? "Loyalty abuse detected" : null,
      };
    });
  }

  generateLoyaltyRewards(
    input: GenerateLoyaltyRewardsInput,
    config: LoyaltyProgrammeEngineConfiguration,
  ): LoyaltyRunReport {
    return this.runAction("generate_rewards", config, () => {
      const { member, error: memberError } = this.getMemberOrFail(
        input.customerId,
        input.loyaltyProgrammeId,
      );
      if (!member) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(memberError ?? "Member not found");
        return this.emptyResult(validation, memberError);
      }

      const rewardCheck = this.rewardsEngine.validateRewardGeneration({
        pointsCost: input.pointsCost,
        currentBalance: member.currentPointsBalance,
        config,
      });
      if (!rewardCheck.valid) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(...rewardCheck.errors);
        return this.emptyResult(validation, rewardCheck.errors.join("; "));
      }

      const redeemReport = this.redeemLoyaltyPoints(
        {
          customerId: input.customerId,
          loyaltyProgrammeId: input.loyaltyProgrammeId,
          points: input.pointsCost,
          rewardReference: input.rewardReference,
        },
        config,
      );

      if (redeemReport.validation.decision === "fail") {
        return {
          loyaltyRecords: redeemReport.loyaltyRecords,
          rewards: [],
          abuseAlerts: [],
          failures: [],
          validation: redeemReport.validation,
          error: redeemReport.validation.errors.join("; ") || "Redemption failed",
        };
      }

      const loyaltyRecord = redeemReport.loyaltyRecords[0]!;
      const reward = this.metadataGenerator.buildReward({
        customerId: input.customerId,
        loyaltyProgrammeId: input.loyaltyProgrammeId,
        loyaltyRecordId: loyaltyRecord.loyaltyRecordId,
        rewardReference: input.rewardReference,
        pointsCost: input.pointsCost,
        description: input.description?.trim() ?? `Reward ${input.rewardReference}`,
      });
      this.registry.storeReward(reward);

      appendLpeLog({
        event: "reward_generation",
        level: "info",
        details: `Generated reward ${reward.rewardId} for ${input.rewardReference}`,
      });

      return {
        loyaltyRecords: redeemReport.loyaltyRecords,
        rewards: [reward],
        abuseAlerts: [],
        failures: [],
        validation: redeemReport.validation,
        error: null,
      };
    });
  }

  detectLoyaltyFailures(
    input: DetectLoyaltyFailuresInput,
    config: LoyaltyProgrammeEngineConfiguration,
  ): LoyaltyRunReport {
    return this.runAction("detect_failures", config, () => {
      const records = input.loyaltyRecordId
        ? [this.registry.getRecord(input.loyaltyRecordId)].filter(Boolean) as LoyaltyRecord[]
        : this.registry.listRecords();

      const detected: LoyaltyFailure[] = [];
      for (const record of records) {
        if (record.validationStatus === "failed") {
          detected.push(
            this.metadataGenerator.buildFailure(
              record.loyaltyRecordId,
              `Loyalty record ${record.loyaltyRecordId} failed validation`,
              "high",
            ),
          );
        }
      }

      for (const f of detected) {
        if (
          !this.failures.some(
            (x) => x.loyaltyRecordId === f.loyaltyRecordId && x.reason === f.reason,
          )
        ) {
          this.failures.push(f);
        }
      }

      appendLpeLog({
        event: "loyalty_failure",
        level: detected.length > 0 ? "warn" : "info",
        details: `Detected ${detected.length} loyalty failure(s)`,
      });

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      return {
        loyaltyRecords: records,
        rewards: [],
        abuseAlerts: [],
        failures: detected,
        validation,
        error: detected.length > 0 ? "Loyalty failures detected" : null,
      };
    });
  }

  reportLoyaltyStatus(config: LoyaltyProgrammeEngineConfiguration): LoyaltyRunReport {
    return this.runAction("report_status", config, () => {
      const summary = this.analyticsEngine.summarize(
        this.registry.listRecords(),
        this.registry.listProgrammes().length,
        this.registry.listMembers().length,
        this.registry.listAlerts(),
      );

      appendLpeLog({
        event: "performance_statistics",
        level: "info",
        details: `Status: ${summary.totalMembers} members · ${summary.totalPointsAwarded} points awarded`,
      });

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      return {
        loyaltyRecords: this.registry.listRecords(),
        rewards: this.registry.listRewards(),
        abuseAlerts: this.registry.listAlerts(),
        failures: [...this.failures],
        validation,
        error: null,
      };
    });
  }

  reportLoyaltyHealth(config: LoyaltyProgrammeEngineConfiguration): LoyaltyRunReport {
    return this.runAction("report_health", config, () => {
      const summary = this.analyticsEngine.summarize(
        this.registry.listRecords(),
        this.registry.listProgrammes().length,
        this.registry.listMembers().length,
        this.registry.listAlerts(),
      );

      appendLpeLog({
        event: "health_information",
        level: "info",
        details: `Health: ${summary.totalMembers} members · ${summary.activeAbuseAlerts} abuse alerts`,
      });

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      return {
        loyaltyRecords: [],
        rewards: [],
        abuseAlerts: [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  private emptyResult(validation: LoyaltyRunReport["validation"], error: string | null) {
    return {
      loyaltyRecords: [] as LoyaltyRecord[],
      rewards: [] as LoyaltyReward[],
      abuseAlerts: [] as LoyaltyAbuseAlert[],
      failures: [] as LoyaltyFailure[],
      validation,
      error,
    };
  }

  private runAction(
    action: LoyaltyRunReport["action"],
    config: LoyaltyProgrammeEngineConfiguration,
    fn: () => {
      loyaltyRecords: LoyaltyRecord[];
      rewards: LoyaltyReward[];
      abuseAlerts: LoyaltyAbuseAlert[];
      failures: LoyaltyFailure[];
      validation: LoyaltyRunReport["validation"];
      error: string | null;
    },
  ): LoyaltyRunReport {
    const started = Date.now();
    const engineRecord = this.engineRecord;
    if (!engineRecord) throw new Error("Loyalty Programme Engine not connected");

    const result = fn();
    if (result.error && result.validation.decision !== "fail") {
      result.validation.decision = "fail";
      result.validation.errors.push(result.error);
    }

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      loyaltyRecords: result.loyaltyRecords,
      rewards: result.rewards,
      abuseAlerts: result.abuseAlerts,
      failures: result.failures,
      validation: result.validation,
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.registry.resetForTesting();
    this.failures.length = 0;
  }
}
