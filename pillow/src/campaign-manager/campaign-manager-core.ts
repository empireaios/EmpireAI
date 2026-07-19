/** R5-07 — Campaign Manager (core orchestration). */

import type { MarketingFrameworkEngine } from "../marketing-framework/engine.js";
import type { MetaAdsIntegration } from "../meta-ads-integration/engine.js";
import type { GoogleAdsIntegration } from "../google-ads-integration/engine.js";
import type { TikTokAdsIntegration } from "../tiktok-ads-integration/engine.js";
import type { YouTubeAdsIntegration } from "../youtube-ads-integration/engine.js";
import type { SeoIntelligenceEngine } from "../seo-intelligence-engine/engine.js";
import { CAM_METADATA_VERSION, CAMPAIGN_MANAGER_ID } from "./paths.js";
import { appendCamLog } from "./cam-logging.js";
import { CampaignLifecycleEngine } from "./campaign-lifecycle-engine.js";
import { CampaignScheduler } from "./campaign-scheduler.js";
import { CampaignCoordinationEngine } from "./campaign-coordination-engine.js";
import { CampaignStatusEngine } from "./campaign-status-engine.js";
import { CampaignAnalyticsEngine } from "./campaign-analytics-engine.js";
import { CampaignValidator } from "./campaign-validator.js";
import { CampaignMetadataGenerator } from "./campaign-metadata-generator.js";
import type { CampaignManagerConfiguration } from "./configuration.js";
import type {
  ApproveCampaignInput,
  CampaignEngineRecord,
  CampaignRecord,
  CampaignRunReport,
  ConnectCampaignManagerInput,
  CoordinateChannelsInput,
  CreateCampaignInput,
  DetectFailuresInput,
  MarketingChannel,
  ScheduleCampaignInput,
  SetObjectiveInput,
  TrackExecutionInput,
  UpdateLifecycleInput,
  UpdateStatusInput,
} from "./types.js";

export type ChannelDependencies = {
  meta: MetaAdsIntegration | null;
  google: GoogleAdsIntegration | null;
  tiktok: TikTokAdsIntegration | null;
  youtube: YouTubeAdsIntegration | null;
  seo: SeoIntelligenceEngine | null;
};

export class CampaignManagerCore {
  private engineRecord: CampaignEngineRecord | null = null;
  private campaigns = new Map<string, CampaignRecord>();
  private readonly lifecycle = new CampaignLifecycleEngine();
  private readonly scheduler = new CampaignScheduler();
  private readonly coordination = new CampaignCoordinationEngine();
  private readonly statusEngine = new CampaignStatusEngine();
  private readonly analytics = new CampaignAnalyticsEngine();
  private readonly validator = new CampaignValidator();
  private readonly metadataGenerator = new CampaignMetadataGenerator();

  constructor(
    private readonly framework: MarketingFrameworkEngine | null,
    private readonly channels: ChannelDependencies,
  ) {}

  getEngineRecord(): CampaignEngineRecord | null {
    return this.engineRecord;
  }

  getCampaignRecords(): CampaignRecord[] {
    return [...this.campaigns.values()].map((c) => ({ ...c }));
  }

  private probeChannel(channel: MarketingChannel): boolean {
    try {
      if (channel === "meta") {
        return Boolean(this.channels.meta?.getState());
      }
      if (channel === "google") {
        return Boolean(this.channels.google?.getState());
      }
      if (channel === "tiktok") {
        return Boolean(this.channels.tiktok?.getState());
      }
      if (channel === "youtube") {
        return Boolean(this.channels.youtube?.getState());
      }
      if (channel === "seo") {
        return Boolean(this.channels.seo?.getState());
      }
    } catch {
      return false;
    }
    return false;
  }

  private channelAvailability(): Record<MarketingChannel, boolean> {
    return {
      meta: this.probeChannel("meta"),
      google: this.probeChannel("google"),
      tiktok: this.probeChannel("tiktok"),
      youtube: this.probeChannel("youtube"),
      seo: this.probeChannel("seo"),
    };
  }

  private requireConnected(): CampaignEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error("Campaign Manager not connected — call connectCampaignManager first");
    }
    return this.engineRecord;
  }

  private requireCampaign(campaignId: string): CampaignRecord {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) throw new Error(`Campaign not found: ${campaignId}`);
    return campaign;
  }

  private persist(record: CampaignRecord): CampaignRecord {
    this.campaigns.set(record.campaignId, record);
    return { ...record };
  }

  registerWithFramework(
    config: CampaignManagerConfiguration,
  ): { frameworkModuleId: string | null; validation: CampaignRunReport["validation"] } {
    if (!this.framework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.framework.registerMarketingModule({
      definition: {
        marketingModuleIdentifier: CAMPAIGN_MANAGER_ID,
        moduleVersion: CAM_METADATA_VERSION,
        moduleType: "marketing",
        integrationMissionId: "R5-07",
        authenticationMethod: "none",
        credentialRef: "vault://campaign-manager",
        apiEndpointConfig: {
          baseUrl: "internal://campaign-manager",
          protocol: "rest",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "campaign.created",
            "campaign.scheduled",
            "campaign.executed",
            "campaign.failed",
            "campaign.approved",
          ],
          maxEventsPerMinute: 120,
          windowMs: 60000,
        },
        rateLimitConfig: {
          enabled: true,
          requestsPerMinute: 120,
          burstLimit: 20,
          windowMs: 60000,
        },
        retryConfig: {
          enabled: true,
          maxAttempts: config.maxRetryAttempts,
          delayMs: config.retryDelayMs,
          backoffMultiplier: config.retryBackoffMultiplier,
        },
        supportedCapabilities: [
          "marketing_module_registration",
          "marketing_module_activation",
          "marketing_event_routing",
        ],
      },
      forceRegister: true,
    });

    appendCamLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Campaign Manager with Marketing Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `cam-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: CAM_METADATA_VERSION,
      },
    };
  }

  connectCampaignManager(
    _input: ConnectCampaignManagerInput,
    config: CampaignManagerConfiguration,
  ): CampaignRunReport {
    const started = Date.now();
    const frameworkReg = this.registerWithFramework(config);
    const availability = this.channelAvailability();

    if (this.framework && frameworkReg.validation.decision !== "fail") {
      this.framework.activateMarketingModule(CAMPAIGN_MANAGER_ID);
    }

    const record = this.metadataGenerator.buildEngineRecord({
      frameworkModuleId: frameworkReg.frameworkModuleId,
      operationalState: frameworkReg.validation.decision === "fail" ? "failed" : "active",
      validationStatus:
        frameworkReg.validation.decision === "fail"
          ? "failed"
          : frameworkReg.validation.decision === "partial"
            ? "partial"
            : "passed",
      channelDependencies: availability,
    });
    this.engineRecord = record;

    const validation = this.validator.validateEngineRecord(record);
    if (frameworkReg.validation.warnings.length > 0) {
      validation.warnings.push(...frameworkReg.validation.warnings);
      if (validation.decision === "pass") validation.decision = "partial";
    }

    appendCamLog({
      event: "campaign_creation",
      level: "info",
      details: `Campaign Manager connected · channels=${Object.values(availability).filter(Boolean).length}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      campaignRecords: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  createCampaign(
    input: CreateCampaignInput,
    config: CampaignManagerConfiguration,
  ): CampaignRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const existingNames = new Set(
      [...this.campaigns.values()].map((c) => c.campaignName.trim().toLowerCase()),
    );
    const validation = this.validator.validateCampaignCreation(input, config, existingNames);
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "create_campaign",
        engineRecord: engine,
        campaignRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    const now = new Date().toISOString();
    const campaign = this.metadataGenerator.buildCampaignRecord({
      campaignName: input.campaignName.trim(),
      campaignObjective: input.campaignObjective,
      marketingChannels: input.marketingChannels,
      campaignSchedule: {
        startAt: input.startAt ?? now,
        endAt: input.endAt ?? null,
        timezone: input.timezone ?? "UTC",
      },
    });
    campaign.validationStatus = "passed";
    campaign.campaignStatus = "pending_approval";
    this.persist(campaign);

    appendCamLog({
      event: "campaign_creation",
      level: "info",
      details: `Created campaign ${campaign.campaignId}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "create_campaign",
      engineRecord: engine,
      campaignRecords: [campaign],
      validation: this.validator.validateCampaignRecord(campaign),
      durationMs: Date.now() - started,
    });
  }

  updateLifecycle(
    input: UpdateLifecycleInput,
    config: CampaignManagerConfiguration,
  ): CampaignRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    if (!config.campaignLifecycleRulesEnabled) {
      return this.metadataGenerator.buildRunReport({
        action: "update_lifecycle",
        engineRecord: engine,
        campaignRecords: [],
        validation: {
          validationReportId: `cam-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "partial",
          errors: [],
          warnings: ["Campaign lifecycle rules disabled"],
          durationMs: Date.now() - started,
          metadataVersion: CAM_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const campaign = this.requireCampaign(input.campaignId);
    if (
      input.targetStatus === "running" &&
      config.requireApprovalBeforeLaunch &&
      !campaign.approvedAt
    ) {
      return this.metadataGenerator.buildRunReport({
        action: "update_lifecycle",
        engineRecord: engine,
        campaignRecords: [campaign],
        validation: {
          validationReportId: `cam-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Cannot launch campaign without validation/approval"],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: CAM_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const result = this.lifecycle.transition(campaign, input.targetStatus);
    if (!result.ok) {
      return this.metadataGenerator.buildRunReport({
        action: "update_lifecycle",
        engineRecord: engine,
        campaignRecords: [campaign],
        validation: {
          validationReportId: `cam-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: [result.error ?? "Lifecycle transition failed"],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: CAM_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const saved = this.persist(result.record);
    return this.metadataGenerator.buildRunReport({
      action: "update_lifecycle",
      engineRecord: engine,
      campaignRecords: [saved],
      validation: this.validator.validateCampaignRecord(saved),
      durationMs: Date.now() - started,
    });
  }

  setObjective(input: SetObjectiveInput, _config: CampaignManagerConfiguration): CampaignRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const campaign = this.requireCampaign(input.campaignId);
    campaign.campaignObjective = input.campaignObjective;
    campaign.timestamp = new Date().toISOString();
    const saved = this.persist(campaign);
    appendCamLog({
      event: "campaign_updates",
      level: "info",
      details: `Objective set for ${saved.campaignId}`,
    });
    return this.metadataGenerator.buildRunReport({
      action: "set_objective",
      engineRecord: engine,
      campaignRecords: [saved],
      validation: this.validator.validateCampaignRecord(saved),
      durationMs: Date.now() - started,
    });
  }

  scheduleCampaign(
    input: ScheduleCampaignInput,
    config: CampaignManagerConfiguration,
  ): CampaignRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    if (!config.campaignSchedulingRulesEnabled) {
      return this.metadataGenerator.buildRunReport({
        action: "schedule_campaign",
        engineRecord: engine,
        campaignRecords: [],
        validation: {
          validationReportId: `cam-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "partial",
          errors: [],
          warnings: ["Campaign scheduling rules disabled"],
          durationMs: Date.now() - started,
          metadataVersion: CAM_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const campaign = this.requireCampaign(input.campaignId);
    const result = this.scheduler.schedule(campaign, {
      startAt: input.startAt,
      endAt: input.endAt ?? null,
      timezone: input.timezone ?? campaign.campaignSchedule.timezone,
    });
    if (!result.ok) {
      return this.metadataGenerator.buildRunReport({
        action: "schedule_campaign",
        engineRecord: engine,
        campaignRecords: [campaign],
        validation: {
          validationReportId: `cam-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: [result.error ?? "Scheduling failed"],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: CAM_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const saved = this.persist(result.record);
    return this.metadataGenerator.buildRunReport({
      action: "schedule_campaign",
      engineRecord: engine,
      campaignRecords: [saved],
      validation: this.validator.validateCampaignRecord(saved),
      durationMs: Date.now() - started,
    });
  }

  updateStatus(input: UpdateStatusInput, _config: CampaignManagerConfiguration): CampaignRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const campaign = this.requireCampaign(input.campaignId);
    const saved = this.persist(this.statusEngine.updateStatus(campaign, input.campaignStatus));
    return this.metadataGenerator.buildRunReport({
      action: "update_status",
      engineRecord: engine,
      campaignRecords: [saved],
      validation: this.validator.validateCampaignRecord(saved),
      durationMs: Date.now() - started,
    });
  }

  coordinateChannels(
    input: CoordinateChannelsInput,
    config: CampaignManagerConfiguration,
  ): CampaignRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    if (!config.channelCoordinationRulesEnabled) {
      return this.metadataGenerator.buildRunReport({
        action: "coordinate_channels",
        engineRecord: engine,
        campaignRecords: [],
        validation: {
          validationReportId: `cam-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "partial",
          errors: [],
          warnings: ["Channel coordination rules disabled"],
          durationMs: Date.now() - started,
          metadataVersion: CAM_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const campaign = this.requireCampaign(input.campaignId);
    if (config.requireApprovalBeforeLaunch && !campaign.approvedAt) {
      return this.metadataGenerator.buildRunReport({
        action: "coordinate_channels",
        engineRecord: engine,
        campaignRecords: [campaign],
        validation: {
          validationReportId: `cam-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Cannot coordinate/launch campaign without approval"],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: CAM_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    if (campaign.campaignStatus === "approved" || campaign.campaignStatus === "scheduled") {
      campaign.campaignStatus = "running";
    }

    const result = this.coordination.coordinate(campaign, this.channelAvailability());
    const saved = this.persist(result.record);
    engine.channelDependencies = this.channelAvailability();
    this.engineRecord = engine;

    return this.metadataGenerator.buildRunReport({
      action: "coordinate_channels",
      engineRecord: engine,
      campaignRecords: [saved],
      validation: {
        validationReportId: `cam-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: result.partial ? "partial" : "pass",
        errors: [],
        warnings: result.missing.map((c) => `Channel unavailable: ${c}`),
        durationMs: Date.now() - started,
        metadataVersion: CAM_METADATA_VERSION,
      },
      durationMs: Date.now() - started,
    });
  }

  trackExecution(
    input: TrackExecutionInput,
    _config: CampaignManagerConfiguration,
  ): CampaignRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const targets = input.campaignId
      ? [this.requireCampaign(input.campaignId)]
      : this.getCampaignRecords();
    const tracked = this.analytics.trackExecution(targets);
    for (const record of tracked) this.persist(record);

    return this.metadataGenerator.buildRunReport({
      action: "track_execution",
      engineRecord: engine,
      campaignRecords: tracked,
      validation:
        tracked.length === 0
          ? {
              validationReportId: `cam-val-${Date.now()}`,
              validationTimestamp: new Date().toISOString(),
              decision: "fail",
              errors: ["No campaigns available for execution tracking"],
              warnings: [],
              durationMs: Date.now() - started,
              metadataVersion: CAM_METADATA_VERSION,
            }
          : this.validator.validateCampaignRecord(tracked[0]!),
      durationMs: Date.now() - started,
    });
  }

  detectFailures(
    input: DetectFailuresInput,
    _config: CampaignManagerConfiguration,
  ): CampaignRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const targets = input.campaignId
      ? [this.requireCampaign(input.campaignId)]
      : this.getCampaignRecords();
    const failed = this.analytics.detectFailures(targets);
    for (const record of failed) this.persist(record);

    return this.metadataGenerator.buildRunReport({
      action: "detect_failures",
      engineRecord: engine,
      campaignRecords: failed,
      validation: {
        validationReportId: `cam-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: failed.length > 0 ? "partial" : "pass",
        errors: [],
        warnings: failed.map((f) => f.failureSummary ?? f.campaignId),
        durationMs: Date.now() - started,
        metadataVersion: CAM_METADATA_VERSION,
      },
      durationMs: Date.now() - started,
    });
  }

  approveCampaign(
    input: ApproveCampaignInput,
    config: CampaignManagerConfiguration,
  ): CampaignRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const campaign = this.requireCampaign(input.campaignId);
    const recordValidation = this.validator.validateCampaignRecord(campaign);
    if (recordValidation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "approve_campaign",
        engineRecord: engine,
        campaignRecords: [campaign],
        validation: recordValidation,
        durationMs: Date.now() - started,
      });
    }

    campaign.approvedAt = new Date().toISOString();
    campaign.campaignStatus = "approved";
    campaign.validationStatus = "passed";
    campaign.timestamp = new Date().toISOString();
    const saved = this.persist(campaign);

    appendCamLog({
      event: "campaign_updates",
      level: "info",
      details: `Approved campaign ${saved.campaignId}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "approve_campaign",
      engineRecord: engine,
      campaignRecords: [saved],
      validation: {
        validationReportId: `cam-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "pass",
        errors: [],
        warnings: config.requireApprovalBeforeLaunch
          ? []
          : ["Approval gate unexpectedly disabled"],
        durationMs: Date.now() - started,
        metadataVersion: CAM_METADATA_VERSION,
      },
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.campaigns.clear();
  }
}
