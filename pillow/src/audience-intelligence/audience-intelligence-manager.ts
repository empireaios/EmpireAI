/** R5-08 — Audience Intelligence Manager. */

import type { MarketingFrameworkEngine } from "../marketing-framework/engine.js";
import type { CustomerSegmentationEngine } from "../customer-segmentation-engine/engine.js";
import type { CustomerJourneyIntelligenceEngine } from "../customer-journey-intelligence-engine/engine.js";
import type { MetaAdsIntegration } from "../meta-ads-integration/engine.js";
import type { GoogleAdsIntegration } from "../google-ads-integration/engine.js";
import type { TikTokAdsIntegration } from "../tiktok-ads-integration/engine.js";
import type { YouTubeAdsIntegration } from "../youtube-ads-integration/engine.js";
import type { CampaignManagerEngine } from "../campaign-manager/engine.js";
import { AUD_METADATA_VERSION, AUDIENCE_INTELLIGENCE_ID } from "./paths.js";
import { appendAudLog } from "./aud-logging.js";
import { AudienceAnalysisEngine } from "./audience-analysis-engine.js";
import { BehaviourIntelligenceEngine } from "./behaviour-intelligence-engine.js";
import { AudienceSegmentationEngine } from "./audience-segmentation-engine.js";
import { AudienceRecommendationEngine } from "./audience-recommendation-engine.js";
import { AudienceAnalyticsEngine } from "./audience-analytics-engine.js";
import { AudienceValidator } from "./audience-validator.js";
import { AudienceMetadataGenerator } from "./audience-metadata-generator.js";
import type { AudienceIntelligenceConfiguration } from "./configuration.js";
import type {
  AnalyzeAudienceInput,
  AudienceEngineRecord,
  AudienceRecord,
  AudienceRunReport,
  BuildAudienceInput,
  ConnectAudienceIntelligenceInput,
  DetectOverlapInput,
  GenerateAudienceRecommendationsInput,
} from "./types.js";

export type AudienceIntelligenceDependencies = {
  marketingFramework: MarketingFrameworkEngine | null;
  customerSegmentation: CustomerSegmentationEngine | null;
  customerJourney: CustomerJourneyIntelligenceEngine | null;
  metaAds: MetaAdsIntegration | null;
  googleAds: GoogleAdsIntegration | null;
  tiktokAds: TikTokAdsIntegration | null;
  youtubeAds: YouTubeAdsIntegration | null;
  campaignManager: CampaignManagerEngine | null;
};

export class AudienceIntelligenceManager {
  private engineRecord: AudienceEngineRecord | null = null;
  private readonly analysis = new AudienceAnalysisEngine();
  private readonly behaviour = new BehaviourIntelligenceEngine();
  private readonly segmentation = new AudienceSegmentationEngine();
  private readonly recommendations = new AudienceRecommendationEngine();
  private readonly analytics = new AudienceAnalyticsEngine();
  private readonly validator = new AudienceValidator();
  private readonly metadataGenerator = new AudienceMetadataGenerator();
  private readonly buildHints = new Map<
    string,
    { demographicHints?: string[]; interestHints?: string[]; behaviourHints?: string[] }
  >();

  constructor(private readonly deps: AudienceIntelligenceDependencies) {}

  getEngineRecord(): AudienceEngineRecord | null {
    return this.engineRecord;
  }

  getAudienceRecords(): AudienceRecord[] {
    return this.segmentation.list();
  }

  private probe(getter: () => unknown): boolean {
    try {
      getter();
      return true;
    } catch {
      return false;
    }
  }

  private dependencyPresence(): AudienceEngineRecord["dependencyPresence"] {
    return {
      customerSegmentation: this.deps.customerSegmentation
        ? this.probe(() => this.deps.customerSegmentation!.getState())
        : false,
      customerJourney: this.deps.customerJourney
        ? this.probe(() => this.deps.customerJourney!.getState())
        : false,
      metaAds: this.deps.metaAds ? this.probe(() => this.deps.metaAds!.getState()) : false,
      googleAds: this.deps.googleAds ? this.probe(() => this.deps.googleAds!.getState()) : false,
      tiktokAds: this.deps.tiktokAds ? this.probe(() => this.deps.tiktokAds!.getState()) : false,
      youtubeAds: this.deps.youtubeAds
        ? this.probe(() => this.deps.youtubeAds!.getState())
        : false,
      campaignManager: this.deps.campaignManager
        ? this.probe(() => this.deps.campaignManager!.getState())
        : false,
    };
  }

  private requireConnected(): AudienceEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Audience Intelligence not connected — call connectAudienceIntelligence first",
      );
    }
    return this.engineRecord;
  }

  private requireAudience(id: string): AudienceRecord {
    const record = this.segmentation.get(id);
    if (!record) throw new Error(`Audience not found: ${id}`);
    return record;
  }

  registerWithFramework(
    config: AudienceIntelligenceConfiguration,
  ): { frameworkModuleId: string | null; validation: AudienceRunReport["validation"] } {
    if (!this.deps.marketingFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.marketingFramework.registerMarketingModule({
      definition: {
        marketingModuleIdentifier: AUDIENCE_INTELLIGENCE_ID,
        moduleVersion: AUD_METADATA_VERSION,
        moduleType: "marketing",
        integrationMissionId: "R5-08",
        authenticationMethod: "none",
        credentialRef: "vault://audience-intelligence",
        apiEndpointConfig: {
          baseUrl: "internal://audience-intelligence",
          protocol: "rest",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "audience.built",
            "audience.analyzed",
            "audience.scored",
            "audience.overlap",
            "audience.failed",
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

    appendAudLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Audience Intelligence with Marketing Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `aud-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: AUD_METADATA_VERSION,
      },
    };
  }

  connectAudienceIntelligence(
    _input: ConnectAudienceIntelligenceInput,
    config: AudienceIntelligenceConfiguration,
  ): AudienceRunReport {
    const started = Date.now();
    const frameworkReg = this.registerWithFramework(config);
    const deps = this.dependencyPresence();

    if (this.deps.marketingFramework && frameworkReg.validation.decision !== "fail") {
      this.deps.marketingFramework.activateMarketingModule(AUDIENCE_INTELLIGENCE_ID);
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
      dependencyPresence: deps,
    });
    this.engineRecord = record;

    const validation = this.validator.validateEngineRecord(record);
    if (frameworkReg.validation.warnings.length > 0) {
      validation.warnings.push(...frameworkReg.validation.warnings);
      if (validation.decision === "pass") validation.decision = "partial";
    }

    appendAudLog({
      event: "audience_creation",
      level: "info",
      details: `Audience Intelligence connected · deps=${Object.values(deps).filter(Boolean).length}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      audienceRecords: [],
      overlaps: [],
      recommendations: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  buildAudience(
    input: BuildAudienceInput,
    config: AudienceIntelligenceConfiguration,
  ): AudienceRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const validation = this.validator.validateAudienceBuild(input, config);
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "build_audience",
        engineRecord: engine,
        audienceRecords: [],
        overlaps: [],
        recommendations: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    let estimatedSize = input.estimatedSize;
    if (!estimatedSize && this.deps.customerSegmentation) {
      try {
        const segments = this.deps.customerSegmentation.getSegments();
        estimatedSize = Math.max(100, segments.length * 250);
      } catch {
        /* keep default */
      }
    }

    const record = this.segmentation.build({
      ...input,
      estimatedSize,
      audienceSource: input.audienceSource ?? "composite",
    });
    record.validationStatus = "passed";
    this.segmentation.persist(record);
    this.buildHints.set(record.audienceRecordId, {
      demographicHints: input.demographicHints,
      interestHints: input.interestHints,
      behaviourHints: input.behaviourHints,
    });

    return this.metadataGenerator.buildRunReport({
      action: "build_audience",
      engineRecord: engine,
      audienceRecords: [record],
      overlaps: [],
      recommendations: [],
      validation: this.validator.validateAudienceRecord(record),
      durationMs: Date.now() - started,
    });
  }

  private analyze(
    action: AudienceRunReport["action"],
    input: AnalyzeAudienceInput,
    config: AudienceIntelligenceConfiguration,
    mutator: (record: AudienceRecord) => AudienceRecord,
  ): AudienceRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    if (!config.audienceAnalysisRulesEnabled && action.startsWith("analyze_")) {
      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord: engine,
        audienceRecords: [],
        overlaps: [],
        recommendations: [],
        validation: {
          validationReportId: `aud-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "partial",
          errors: [],
          warnings: ["Audience analysis rules disabled"],
          durationMs: Date.now() - started,
          metadataVersion: AUD_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const record = mutator(this.requireAudience(input.audienceRecordId));
    const saved = this.segmentation.persist(record);
    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord: engine,
      audienceRecords: [saved],
      overlaps: [],
      recommendations: [],
      validation: this.validator.validateAudienceRecord(saved),
      durationMs: Date.now() - started,
    });
  }

  analyzeDemographics(
    input: AnalyzeAudienceInput,
    config: AudienceIntelligenceConfiguration,
  ): AudienceRunReport {
    const hints = this.buildHints.get(input.audienceRecordId)?.demographicHints;
    return this.analyze("analyze_demographics", input, config, (r) =>
      this.analysis.analyzeDemographics(r, hints),
    );
  }

  analyzeInterests(
    input: AnalyzeAudienceInput,
    config: AudienceIntelligenceConfiguration,
  ): AudienceRunReport {
    const hints = this.buildHints.get(input.audienceRecordId)?.interestHints;
    return this.analyze("analyze_interests", input, config, (r) =>
      this.analysis.analyzeInterests(r, hints),
    );
  }

  analyzeBehaviour(
    input: AnalyzeAudienceInput,
    config: AudienceIntelligenceConfiguration,
  ): AudienceRunReport {
    const hints = this.buildHints.get(input.audienceRecordId)?.behaviourHints;
    return this.analyze("analyze_behaviour", input, config, (r) =>
      this.behaviour.analyzeBehaviour(r, hints),
    );
  }

  analyzeIntent(
    input: AnalyzeAudienceInput,
    config: AudienceIntelligenceConfiguration,
  ): AudienceRunReport {
    return this.analyze("analyze_intent", input, config, (r) => this.behaviour.analyzeIntent(r));
  }

  measureEngagement(
    input: AnalyzeAudienceInput,
    config: AudienceIntelligenceConfiguration,
  ): AudienceRunReport {
    if (!config.audienceScoringRulesEnabled) {
      const started = Date.now();
      const engine = this.requireConnected();
      return this.metadataGenerator.buildRunReport({
        action: "measure_engagement",
        engineRecord: engine,
        audienceRecords: [],
        overlaps: [],
        recommendations: [],
        validation: {
          validationReportId: `aud-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "partial",
          errors: [],
          warnings: ["Audience scoring rules disabled"],
          durationMs: Date.now() - started,
          metadataVersion: AUD_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }
    return this.analyze("measure_engagement", input, config, (r) =>
      this.analytics.measureEngagement(r),
    );
  }

  measureQuality(
    input: AnalyzeAudienceInput,
    config: AudienceIntelligenceConfiguration,
  ): AudienceRunReport {
    if (!config.audienceScoringRulesEnabled) {
      const started = Date.now();
      const engine = this.requireConnected();
      return this.metadataGenerator.buildRunReport({
        action: "measure_quality",
        engineRecord: engine,
        audienceRecords: [],
        overlaps: [],
        recommendations: [],
        validation: {
          validationReportId: `aud-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "partial",
          errors: [],
          warnings: ["Audience scoring rules disabled"],
          durationMs: Date.now() - started,
          metadataVersion: AUD_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }
    return this.analyze("measure_quality", input, config, (r) => this.analytics.measureQuality(r));
  }

  detectOverlap(
    input: DetectOverlapInput,
    _config: AudienceIntelligenceConfiguration,
  ): AudienceRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const overlaps = this.segmentation.detectOverlap(input.audienceRecordId);
    const records = input.audienceRecordId
      ? [this.requireAudience(input.audienceRecordId)]
      : this.segmentation.list();

    return this.metadataGenerator.buildRunReport({
      action: "detect_overlap",
      engineRecord: engine,
      audienceRecords: records,
      overlaps,
      recommendations: [],
      validation: {
        validationReportId: `aud-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "pass",
        errors: [],
        warnings: overlaps.length > 0 ? [`${overlaps.length} overlap(s) detected`] : [],
        durationMs: Date.now() - started,
        metadataVersion: AUD_METADATA_VERSION,
      },
      durationMs: Date.now() - started,
    });
  }

  generateRecommendations(
    input: GenerateAudienceRecommendationsInput,
    config: AudienceIntelligenceConfiguration,
  ): AudienceRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    if (!config.recommendationRulesEnabled) {
      return this.metadataGenerator.buildRunReport({
        action: "generate_recommendations",
        engineRecord: engine,
        audienceRecords: [],
        overlaps: [],
        recommendations: [],
        validation: {
          validationReportId: `aud-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "partial",
          errors: [],
          warnings: ["Recommendation rules disabled"],
          durationMs: Date.now() - started,
          metadataVersion: AUD_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const records = input.audienceRecordId
      ? [this.requireAudience(input.audienceRecordId)]
      : this.segmentation.list();
    const recommendations = this.recommendations.generate(records);

    return this.metadataGenerator.buildRunReport({
      action: "generate_recommendations",
      engineRecord: engine,
      audienceRecords: records,
      overlaps: [],
      recommendations,
      validation: {
        validationReportId: `aud-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: recommendations.length > 0 ? "pass" : "partial",
        errors: [],
        warnings: recommendations.length === 0 ? ["No recommendations generated"] : [],
        durationMs: Date.now() - started,
        metadataVersion: AUD_METADATA_VERSION,
      },
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.segmentation.resetForTesting();
    this.recommendations.resetForTesting();
    this.buildHints.clear();
  }
}
