/** R4-19 — Customer module validators. */

import type { CustomerOperationsCertificationConfiguration } from "./configuration.js";
import type { CustomerOperationsCertificationContext } from "./customer-operations-certification-context.js";
import type { MissionValidationResult } from "./types.js";
import { validateEngineMission } from "./mission-validator-utils.js";

type ValidatorConfig = CustomerOperationsCertificationConfiguration;
type ValidatorContext = CustomerOperationsCertificationContext;

export class CustomerIdentityValidator {
  async validate(ctx: ValidatorContext, config: ValidatorConfig): Promise<MissionValidationResult> {
    return validateEngineMission({
      missionId: "R4-01",
      missionLabel: "Customer Identity Engine",
      engine: ctx.customerIdentityEngine,
      expectedMissionId: "R4-01",
      smokeTest:
        config.includeSmokeTests && config.safeTestMode
          ? () => {
              void ctx.customerIdentityEngine?.getCustomerRecords();
            }
          : undefined,
    });
  }
}

export class CrmValidator {
  async validate(ctx: ValidatorContext, config: ValidatorConfig): Promise<MissionValidationResult> {
    return validateEngineMission({
      missionId: "R4-02",
      missionLabel: "CRM Foundation",
      engine: ctx.crmFoundation,
      expectedMissionId: "R4-02",
      smokeTest:
        config.includeSmokeTests && config.safeTestMode
          ? () => {
              void ctx.crmFoundation?.getCrmRecords();
            }
          : undefined,
    });
  }
}

export class CustomerTimelineValidator {
  async validate(ctx: ValidatorContext, config: ValidatorConfig): Promise<MissionValidationResult> {
    return validateEngineMission({
      missionId: "R4-03",
      missionLabel: "Customer Timeline Engine",
      engine: ctx.customerTimelineEngine,
      expectedMissionId: "R4-03",
      smokeTest:
        config.includeSmokeTests && config.safeTestMode
          ? () => {
              void ctx.customerTimelineEngine?.getTimelineRecords();
            }
          : undefined,
    });
  }
}

export class CommunicationValidator {
  async validateEmail(ctx: ValidatorContext, config: ValidatorConfig): Promise<MissionValidationResult> {
    return validateEngineMission({
      missionId: "R4-04",
      missionLabel: "Email Communication Engine",
      engine: ctx.emailCommunicationEngine,
      expectedMissionId: "R4-04",
      smokeTest:
        config.includeSmokeTests && config.safeTestMode
          ? () => {
              void ctx.emailCommunicationEngine?.getState();
            }
          : undefined,
    });
  }

  async validateSms(ctx: ValidatorContext, config: ValidatorConfig): Promise<MissionValidationResult> {
    return validateEngineMission({
      missionId: "R4-05",
      missionLabel: "SMS Communication Engine",
      engine: ctx.smsCommunicationEngine,
      expectedMissionId: "R4-05",
      smokeTest:
        config.includeSmokeTests && config.safeTestMode
          ? () => {
              void ctx.smsCommunicationEngine?.getState();
            }
          : undefined,
    });
  }

  async validateWhatsApp(ctx: ValidatorContext, config: ValidatorConfig): Promise<MissionValidationResult> {
    return validateEngineMission({
      missionId: "R4-06",
      missionLabel: "WhatsApp Integration",
      engine: ctx.whatsAppIntegration,
      expectedMissionId: "R4-06",
      smokeTest:
        config.includeSmokeTests && config.safeTestMode
          ? () => {
              void ctx.whatsAppIntegration?.getState();
            }
          : undefined,
    });
  }

  async validateLiveChat(ctx: ValidatorContext, config: ValidatorConfig): Promise<MissionValidationResult> {
    return validateEngineMission({
      missionId: "R4-07",
      missionLabel: "Live Chat Integration",
      engine: ctx.liveChatIntegration,
      expectedMissionId: "R4-07",
      smokeTest:
        config.includeSmokeTests && config.safeTestMode
          ? () => {
              void ctx.liveChatIntegration?.getState();
            }
          : undefined,
    });
  }

  async validateAiSupport(ctx: ValidatorContext, config: ValidatorConfig): Promise<MissionValidationResult> {
    return validateEngineMission({
      missionId: "R4-08",
      missionLabel: "AI Customer Support",
      engine: ctx.aiCustomerSupport,
      expectedMissionId: "R4-08",
      smokeTest:
        config.includeSmokeTests && config.safeTestMode
          ? () => {
              void ctx.aiCustomerSupport?.getAiSupportRecords();
            }
          : undefined,
    });
  }

  async validateTicketManagement(
    ctx: ValidatorContext,
    config: ValidatorConfig,
  ): Promise<MissionValidationResult> {
    return validateEngineMission({
      missionId: "R4-09",
      missionLabel: "Ticket Management Engine",
      engine: ctx.ticketManagementEngine,
      expectedMissionId: "R4-09",
      smokeTest:
        config.includeSmokeTests && config.safeTestMode
          ? () => {
              void ctx.ticketManagementEngine?.getTicketRecords();
            }
          : undefined,
    });
  }
}

export class CustomerAnalyticsValidator {
  async validateSentiment(ctx: ValidatorContext, config: ValidatorConfig): Promise<MissionValidationResult> {
    return validateEngineMission({
      missionId: "R4-10",
      missionLabel: "Customer Sentiment Engine",
      engine: ctx.customerSentimentEngine,
      expectedMissionId: "R4-10",
      smokeTest:
        config.includeSmokeTests && config.safeTestMode
          ? () => {
              void ctx.customerSentimentEngine?.getSentimentRecords();
            }
          : undefined,
    });
  }

  async validateReviewManagement(
    ctx: ValidatorContext,
    config: ValidatorConfig,
  ): Promise<MissionValidationResult> {
    return validateEngineMission({
      missionId: "R4-11",
      missionLabel: "Review Management Engine",
      engine: ctx.reviewManagementEngine,
      expectedMissionId: "R4-11",
      smokeTest:
        config.includeSmokeTests && config.safeTestMode
          ? () => {
              void ctx.reviewManagementEngine?.getReviewRecords();
            }
          : undefined,
    });
  }

  async validateLoyalty(ctx: ValidatorContext, config: ValidatorConfig): Promise<MissionValidationResult> {
    return validateEngineMission({
      missionId: "R4-12",
      missionLabel: "Loyalty Programme Engine",
      engine: ctx.loyaltyProgrammeEngine,
      expectedMissionId: "R4-12",
      smokeTest:
        config.includeSmokeTests && config.safeTestMode
          ? () => {
              void ctx.loyaltyProgrammeEngine?.getLoyaltyRecords();
            }
          : undefined,
    });
  }

  async validateReturns(ctx: ValidatorContext, config: ValidatorConfig): Promise<MissionValidationResult> {
    return validateEngineMission({
      missionId: "R4-13",
      missionLabel: "Returns Intelligence",
      engine: ctx.returnsIntelligenceEngine,
      expectedMissionId: "R4-13",
      smokeTest:
        config.includeSmokeTests && config.safeTestMode
          ? () => {
              void ctx.returnsIntelligenceEngine?.getReturnIntelligenceRecords();
            }
          : undefined,
    });
  }

  async validateRisk(ctx: ValidatorContext, config: ValidatorConfig): Promise<MissionValidationResult> {
    return validateEngineMission({
      missionId: "R4-14",
      missionLabel: "Customer Risk Engine",
      engine: ctx.customerRiskEngine,
      expectedMissionId: "R4-14",
      smokeTest:
        config.includeSmokeTests && config.safeTestMode
          ? () => {
              void ctx.customerRiskEngine?.getCustomerRiskRecords();
            }
          : undefined,
    });
  }

  async validateClv(ctx: ValidatorContext, config: ValidatorConfig): Promise<MissionValidationResult> {
    return validateEngineMission({
      missionId: "R4-15",
      missionLabel: "Customer Lifetime Value Engine",
      engine: ctx.customerLifetimeValueEngine,
      expectedMissionId: "R4-15",
      smokeTest:
        config.includeSmokeTests && config.safeTestMode
          ? () => {
              void ctx.customerLifetimeValueEngine?.getClvRecords();
            }
          : undefined,
    });
  }
}

export class CustomerIntelligenceValidator {
  async validateSegmentation(
    ctx: ValidatorContext,
    config: ValidatorConfig,
  ): Promise<MissionValidationResult> {
    return validateEngineMission({
      missionId: "R4-16",
      missionLabel: "Customer Segmentation Engine",
      engine: ctx.customerSegmentationEngine,
      expectedMissionId: "R4-16",
      smokeTest:
        config.includeSmokeTests && config.safeTestMode
          ? () => {
              void ctx.customerSegmentationEngine?.getSegmentationRecords();
            }
          : undefined,
    });
  }

  async validateJourneyIntelligence(
    ctx: ValidatorContext,
    config: ValidatorConfig,
  ): Promise<MissionValidationResult> {
    return validateEngineMission({
      missionId: "R4-17",
      missionLabel: "Customer Journey Intelligence",
      engine: ctx.customerJourneyIntelligenceEngine,
      expectedMissionId: "R4-17",
      smokeTest:
        config.includeSmokeTests && config.safeTestMode
          ? () => {
              void ctx.customerJourneyIntelligenceEngine?.getJourneyRecords();
            }
          : undefined,
    });
  }

  async validateExecutiveDashboard(
    ctx: ValidatorContext,
    config: ValidatorConfig,
  ): Promise<MissionValidationResult> {
    return validateEngineMission({
      missionId: "R4-18",
      missionLabel: "Executive Customer Dashboard",
      engine: ctx.executiveCustomerDashboard,
      expectedMissionId: "R4-18",
      smokeTest:
        config.includeSmokeTests && config.safeTestMode
          ? () => {
              void ctx.executiveCustomerDashboard?.getSnapshots();
            }
          : undefined,
    });
  }
}
