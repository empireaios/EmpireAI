/** R5-06 — SEO Intelligence Manager. */

import type { MarketingFrameworkEngine } from "../marketing-framework/engine.js";
import type { CustomerJourneyIntelligenceEngine } from "../customer-journey-intelligence-engine/engine.js";
import {
  SIE_METADATA_VERSION,
  SEO_INTELLIGENCE_ENGINE_ID,
} from "./paths.js";
import { appendSieLog } from "./sie-logging.js";
import { KeywordIntelligenceEngine } from "./keyword-intelligence-engine.js";
import { TechnicalSeoAnalyzer } from "./technical-seo-analyzer.js";
import { ContentSeoAnalyzer } from "./content-seo-analyzer.js";
import { RankingMonitor } from "./ranking-monitor.js";
import { SeoRecommendationEngine } from "./seo-recommendation-engine.js";
import { SeoValidator } from "./seo-validator.js";
import { SeoMetadataGenerator } from "./seo-metadata-generator.js";
import type { SeoIntelligenceConfiguration } from "./configuration.js";
import type {
  AnalyzePageInput,
  ConnectSeoEngineInput,
  DetectIssuesInput,
  GenerateRecommendationsInput,
  ManageKeywordInput,
  ManageSeoProjectInput,
  MonitorOrganicPerformanceInput,
  OptimizeMetadataInput,
  RecommendInternalLinksInput,
  SeoEngineRecord,
  SeoIssue,
  SeoProject,
  SeoRecord,
  SeoRunReport,
  TrackRankingInput,
} from "./types.js";

export class SeoIntelligenceManager {
  private engineRecord: SeoEngineRecord | null = null;
  private projects = new Map<string, SeoProject>();
  private seoRecords = new Map<string, SeoRecord>();
  private issues: SeoIssue[] = [];
  private readonly keywords = new KeywordIntelligenceEngine();
  private readonly technicalAnalyzer = new TechnicalSeoAnalyzer();
  private readonly contentAnalyzer = new ContentSeoAnalyzer();
  private readonly rankingMonitor: RankingMonitor;
  private readonly recommendations = new SeoRecommendationEngine();
  private readonly validator = new SeoValidator();
  private readonly metadataGenerator = new SeoMetadataGenerator();

  constructor(
    private readonly framework: MarketingFrameworkEngine | null,
    private readonly journeyIntelligence: CustomerJourneyIntelligenceEngine | null,
  ) {
    this.rankingMonitor = new RankingMonitor(this.keywords);
  }

  getEngineRecord(): SeoEngineRecord | null {
    return this.engineRecord;
  }

  getSeoRecords(): SeoRecord[] {
    return [...this.seoRecords.values()].map((r) => ({ ...r }));
  }

  getProjectCount(): number {
    return this.projects.size;
  }

  getKeywordCount(): number {
    return this.keywords.count();
  }

  private journeyConnected(): boolean {
    if (!this.journeyIntelligence) return false;
    try {
      const state = this.journeyIntelligence.getState();
      return state.engineVersion === "PILLOW-CJI-001";
    } catch {
      return false;
    }
  }

  private marketingDataPresent(): boolean {
    if (!this.framework) return false;
    try {
      const modules = this.framework.getRegisteredModules();
      return modules.some((m) =>
        [
          "meta-ads-integration",
          "google-ads-integration",
          "tiktok-ads-integration",
          "youtube-ads-integration",
        ].includes(m.marketingModuleIdentifier),
      );
    } catch {
      return false;
    }
  }

  private requireConnected(): SeoEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error("SEO Intelligence Engine not connected — call connectSeoEngine first");
    }
    return this.engineRecord;
  }

  private activeWebsite(config: SeoIntelligenceConfiguration): string {
    const projectId = this.engineRecord?.activeProjectId;
    if (projectId) {
      const project = this.projects.get(projectId);
      if (project) return project.websiteReference;
    }
    return config.defaultWebsiteReference;
  }

  registerWithFramework(
    config: SeoIntelligenceConfiguration,
  ): { frameworkModuleId: string | null; validation: SeoRunReport["validation"] } {
    if (!this.framework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.framework.registerMarketingModule({
      definition: {
        marketingModuleIdentifier: SEO_INTELLIGENCE_ENGINE_ID,
        moduleVersion: SIE_METADATA_VERSION,
        moduleType: "marketing",
        integrationMissionId: "R5-06",
        authenticationMethod: "none",
        credentialRef: "vault://seo-intelligence",
        apiEndpointConfig: {
          baseUrl: "internal://seo-intelligence",
          protocol: "rest",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "seo.page.analyzed",
            "seo.keyword.tracked",
            "seo.ranking.updated",
            "seo.recommendation.generated",
            "seo.failed",
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

    appendSieLog({
      event: "framework_registration",
      level: "info",
      details: `Registered SEO Intelligence with Marketing Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `sie-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: SIE_METADATA_VERSION,
      },
    };
  }

  connectSeoEngine(
    input: ConnectSeoEngineInput,
    config: SeoIntelligenceConfiguration,
  ): SeoRunReport {
    const started = Date.now();
    const frameworkReg = this.registerWithFramework(config);

    const websiteReference = input.websiteReference ?? config.defaultWebsiteReference;
    const project = this.createProject(
      input.projectName ?? "Default SEO Project",
      websiteReference,
    );

    if (this.framework && frameworkReg.validation.decision !== "fail") {
      this.framework.activateMarketingModule(SEO_INTELLIGENCE_ENGINE_ID);
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
      journeyIntelligenceConnected: this.journeyConnected(),
      marketingDataPresent: this.marketingDataPresent(),
      activeProjectId: project.projectId,
    });
    this.engineRecord = record;

    const validation = this.validator.validateEngineRecord(record);
    if (frameworkReg.validation.warnings.length > 0) {
      validation.warnings.push(...frameworkReg.validation.warnings);
      if (validation.decision === "pass") validation.decision = "partial";
    }

    appendSieLog({
      event: "seo_analysis",
      level: "info",
      details: `SEO engine connected · project=${project.projectId}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      seoRecords: [],
      keywords: [],
      issues: [],
      recommendations: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  private createProject(projectName: string, websiteReference: string): SeoProject {
    const project: SeoProject = {
      projectId: `sie-proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      projectName,
      websiteReference,
      createdAt: new Date().toISOString(),
      status: "active",
    };
    this.projects.set(project.projectId, project);
    return project;
  }

  manageProject(
    input: ManageSeoProjectInput,
    config: SeoIntelligenceConfiguration,
  ): SeoRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const websiteReference = input.websiteReference ?? this.activeWebsite(config);
    const project = this.createProject(input.projectName, websiteReference);
    engine.activeProjectId = project.projectId;
    engine.timestamp = new Date().toISOString();
    this.engineRecord = engine;

    return this.metadataGenerator.buildRunReport({
      action: "manage_project",
      engineRecord: engine,
      seoRecords: [],
      keywords: [],
      issues: [],
      recommendations: [],
      validation: this.validator.validateEngineRecord(engine),
      durationMs: Date.now() - started,
    });
  }

  analyzePage(input: AnalyzePageInput, config: SeoIntelligenceConfiguration): SeoRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const validation = this.validator.validatePageAnalysis(input, config);
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "analyze_page",
        engineRecord: engine,
        seoRecords: [],
        keywords: [],
        issues: [],
        recommendations: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    const websiteReference = input.websiteReference ?? this.activeWebsite(config);
    const technicalIssues = this.technicalAnalyzer.analyze(input);
    const contentIssues = this.contentAnalyzer.analyze(input, null);
    const issues = [...technicalIssues, ...contentIssues];
    this.issues.push(...issues);

    const seoScore = config.seoScoringRulesEnabled
      ? this.contentAnalyzer.score(input, issues.length)
      : 50;

    const record = this.metadataGenerator.buildSeoRecord({
      websiteReference,
      pageReference: input.pageReference,
      keywordReference: null,
      rankingPosition: null,
      seoScore,
      technicalIssueSummary:
        issues.length === 0
          ? "No technical issues detected"
          : issues.map((i) => i.summary).join("; "),
      recommendationSummary: "Run generateRecommendations for actionable next steps",
      validationStatus: validation.decision === "pass" ? "passed" : "partial",
    });
    this.seoRecords.set(record.seoRecordId, record);

    const recordValidation = this.validator.validateSeoRecord(record);
    if (recordValidation.decision === "fail") {
      validation.decision = "fail";
      validation.errors.push(...recordValidation.errors);
    }

    return this.metadataGenerator.buildRunReport({
      action: "analyze_page",
      engineRecord: engine,
      seoRecords: [record],
      keywords: [],
      issues,
      recommendations: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  manageKeyword(input: ManageKeywordInput, config: SeoIntelligenceConfiguration): SeoRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const validation = this.validator.validateKeyword(input, config);
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "manage_keyword",
        engineRecord: engine,
        seoRecords: [],
        keywords: [],
        issues: [],
        recommendations: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    const keyword = this.keywords.manageKeyword(input, this.activeWebsite(config));
    return this.metadataGenerator.buildRunReport({
      action: "manage_keyword",
      engineRecord: engine,
      seoRecords: [],
      keywords: [keyword],
      issues: [],
      recommendations: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  trackRanking(input: TrackRankingInput, config: SeoIntelligenceConfiguration): SeoRunReport {
    const started = Date.now();
    const engine = this.requireConnected();

    if (!config.keywordTrackingRulesEnabled) {
      return this.metadataGenerator.buildRunReport({
        action: "track_ranking",
        engineRecord: engine,
        seoRecords: [],
        keywords: [],
        issues: [],
        recommendations: [],
        validation: {
          validationReportId: `sie-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "partial",
          errors: [],
          warnings: ["Keyword tracking rules disabled"],
          durationMs: Date.now() - started,
          metadataVersion: SIE_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const keywords = this.rankingMonitor.track(
      input.keywordReference,
      input.websiteReference ?? this.activeWebsite(config),
    );

    const validation =
      keywords.length === 0
        ? {
            validationReportId: `sie-val-${Date.now()}`,
            validationTimestamp: new Date().toISOString(),
            decision: "fail" as const,
            errors: ["No keywords available for ranking tracking"],
            warnings: [],
            durationMs: Date.now() - started,
            metadataVersion: SIE_METADATA_VERSION,
          }
        : {
            validationReportId: `sie-val-${Date.now()}`,
            validationTimestamp: new Date().toISOString(),
            decision: "pass" as const,
            errors: [],
            warnings: [],
            durationMs: Date.now() - started,
            metadataVersion: SIE_METADATA_VERSION,
          };

    return this.metadataGenerator.buildRunReport({
      action: "track_ranking",
      engineRecord: engine,
      seoRecords: [],
      keywords,
      issues: [],
      recommendations: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  detectIssues(input: DetectIssuesInput, config: SeoIntelligenceConfiguration): SeoRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const pageReference = input.pageReference ?? "/";
    const issues = [
      ...this.technicalAnalyzer.analyze({ pageReference }),
      ...this.contentAnalyzer.analyze({ pageReference }, null),
    ];
    this.issues.push(...issues);

    const related = [...this.seoRecords.values()].filter(
      (r) =>
        r.websiteReference === (input.websiteReference ?? this.activeWebsite(config)) &&
        (!input.pageReference || r.pageReference === input.pageReference),
    );

    return this.metadataGenerator.buildRunReport({
      action: "detect_issues",
      engineRecord: engine,
      seoRecords: related,
      keywords: [],
      issues,
      recommendations: [],
      validation: {
        validationReportId: `sie-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: issues.some((i) => i.severity === "critical") ? "partial" : "pass",
        errors: [],
        warnings: issues.length > 0 ? [`${issues.length} SEO issue(s) detected`] : [],
        durationMs: Date.now() - started,
        metadataVersion: SIE_METADATA_VERSION,
      },
      durationMs: Date.now() - started,
    });
  }

  optimizeMetadata(
    input: OptimizeMetadataInput,
    config: SeoIntelligenceConfiguration,
  ): SeoRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const validation = this.validator.validateMetadataOptimization(input, config);
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "optimize_metadata",
        engineRecord: engine,
        seoRecords: [],
        keywords: [],
        issues: [],
        recommendations: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    const recommendations = config.recommendationRulesEnabled
      ? this.recommendations.optimizeMetadata(
          input.pageReference,
          input.proposedTitle,
          input.proposedDescription,
        )
      : [];

    return this.metadataGenerator.buildRunReport({
      action: "optimize_metadata",
      engineRecord: engine,
      seoRecords: [],
      keywords: [],
      issues: [],
      recommendations,
      validation,
      durationMs: Date.now() - started,
    });
  }

  recommendInternalLinks(
    input: RecommendInternalLinksInput,
    config: SeoIntelligenceConfiguration,
  ): SeoRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const recommendations = config.recommendationRulesEnabled
      ? this.recommendations.recommendInternalLinks(input.pageReference)
      : [];

    return this.metadataGenerator.buildRunReport({
      action: "recommend_internal_links",
      engineRecord: engine,
      seoRecords: [],
      keywords: [],
      issues: [],
      recommendations,
      validation: {
        validationReportId: `sie-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: recommendations.length > 0 ? "pass" : "partial",
        errors: [],
        warnings:
          recommendations.length === 0 ? ["Recommendation rules disabled or empty"] : [],
        durationMs: Date.now() - started,
        metadataVersion: SIE_METADATA_VERSION,
      },
      durationMs: Date.now() - started,
    });
  }

  generateRecommendations(
    input: GenerateRecommendationsInput,
    config: SeoIntelligenceConfiguration,
  ): SeoRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const pageReference = input.pageReference ?? "/";
    const pageIssues = this.issues.filter(
      (i) => !input.pageReference || i.pageReference === input.pageReference,
    );
    const recommendations = config.recommendationRulesEnabled
      ? this.recommendations.generateFromIssues(pageIssues, pageReference)
      : [];

    for (const record of this.seoRecords.values()) {
      if (!input.pageReference || record.pageReference === input.pageReference) {
        record.recommendationSummary =
          recommendations.map((r) => r.summary).join("; ") || "No recommendations";
        record.timestamp = new Date().toISOString();
      }
    }

    return this.metadataGenerator.buildRunReport({
      action: "generate_recommendations",
      engineRecord: engine,
      seoRecords: this.getSeoRecords().filter(
        (r) => !input.pageReference || r.pageReference === input.pageReference,
      ),
      keywords: [],
      issues: pageIssues,
      recommendations,
      validation: {
        validationReportId: `sie-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "pass",
        errors: [],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: SIE_METADATA_VERSION,
      },
      durationMs: Date.now() - started,
    });
  }

  monitorOrganicPerformance(
    input: MonitorOrganicPerformanceInput,
    config: SeoIntelligenceConfiguration,
  ): SeoRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const websiteReference = input.websiteReference ?? this.activeWebsite(config);
    const targets = this.getSeoRecords().filter(
      (r) =>
        r.websiteReference === websiteReference &&
        (!input.pageReference || r.pageReference === input.pageReference),
    );

    if (targets.length === 0) {
      return this.metadataGenerator.buildRunReport({
        action: "monitor_organic_performance",
        engineRecord: engine,
        seoRecords: [],
        keywords: [],
        issues: [],
        recommendations: [],
        validation: {
          validationReportId: `sie-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["No SEO records available for organic performance monitoring"],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: SIE_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const updated = targets.map((record) => {
      const next: SeoRecord = {
        ...record,
        organicImpressions: Math.max(record.organicImpressions, 500),
        organicClicks: Math.max(record.organicClicks, Math.floor(record.seoScore * 2)),
        organicSessions: Math.max(record.organicSessions, Math.floor(record.seoScore * 1.5)),
        timestamp: new Date().toISOString(),
      };
      this.seoRecords.set(next.seoRecordId, next);
      return next;
    });

    appendSieLog({
      event: "seo_analysis",
      level: "info",
      details: `Organic performance monitored for ${updated.length} page(s)`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "monitor_organic_performance",
      engineRecord: engine,
      seoRecords: updated,
      keywords: this.keywords.list(websiteReference),
      issues: [],
      recommendations: [],
      validation: this.validator.validateSeoRecord(updated[0]!),
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.projects.clear();
    this.seoRecords.clear();
    this.issues = [];
    this.keywords.resetForTesting();
    this.recommendations.resetForTesting();
  }
}
