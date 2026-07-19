/** X1-02 — Business Opportunity Discovery Manager. */

import type { CompanyFactoryFrameworkEngine } from "../company-factory-framework/engine.js";
import {
  BOD_METADATA_VERSION,
  BUSINESS_OPPORTUNITY_DISCOVERY_ID,
} from "./paths.js";
import { appendBodLog } from "./bod-logging.js";
import { OpportunityDiscoveryEngine } from "./opportunity-discovery-engine.js";
import { MarketIntelligenceEngine } from "./market-intelligence-engine.js";
import { IndustryMonitoringEngine } from "./industry-monitoring-engine.js";
import { OpportunityScoringEngine } from "./opportunity-scoring-engine.js";
import { OpportunityRankingEngine } from "./opportunity-ranking-engine.js";
import { OpportunityValidator } from "./opportunity-validator.js";
import { OpportunityMetadataGenerator } from "./opportunity-metadata-generator.js";
import type { BusinessOpportunityDiscoveryConfiguration } from "./configuration.js";
import type {
  ConnectBusinessOpportunityDiscoveryInput,
  DiscoverOpportunitiesInput,
  OpportunityActionInput,
  OpportunityEngineRecord,
  OpportunityRecord,
  OpportunityRunReport,
} from "./types.js";

export type BusinessOpportunityDiscoveryDependencies = {
  companyFactoryFramework: CompanyFactoryFrameworkEngine | null;
};

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export class BusinessOpportunityDiscoveryManager {
  private engineRecord: OpportunityEngineRecord | null = null;
  private readonly discovery = new OpportunityDiscoveryEngine();
  private readonly marketIntelligence = new MarketIntelligenceEngine();
  private readonly industryMonitoring = new IndustryMonitoringEngine();
  private readonly scoring = new OpportunityScoringEngine();
  private readonly ranking = new OpportunityRankingEngine();
  private readonly validator = new OpportunityValidator();
  private readonly metadataGenerator = new OpportunityMetadataGenerator();

  constructor(private readonly deps: BusinessOpportunityDiscoveryDependencies) {}

  getEngineRecord(): OpportunityEngineRecord | null {
    return this.engineRecord;
  }

  getOpportunityRecords(): OpportunityRecord[] {
    return this.discovery.list();
  }

  averageOpportunityScore(): number {
    return this.discovery.averageScore();
  }

  private probe(getter: () => unknown): boolean {
    try {
      getter();
      return true;
    } catch {
      return false;
    }
  }

  private dependencyPresence(): OpportunityEngineRecord["dependencyPresence"] {
    return {
      companyFactoryFramework: this.deps.companyFactoryFramework
        ? this.probe(() => this.deps.companyFactoryFramework!.getState())
        : false,
    };
  }

  private requireConnected(): OpportunityEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Business Opportunity Discovery not connected — call connectBusinessOpportunityDiscovery first",
      );
    }
    return this.engineRecord;
  }

  private frameworkHealthScore(): number {
    return safe(() => {
      const state = this.deps.companyFactoryFramework?.getState();
      const score = state?.health?.healthScore;
      return typeof score === "number" ? score : 60;
    }, 60);
  }

  registerWithFramework(
    config: BusinessOpportunityDiscoveryConfiguration,
  ): { frameworkModuleId: string | null; validation: OpportunityRunReport["validation"] } {
    if (!this.deps.companyFactoryFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.companyFactoryFramework.registerCompanyModule({
      definition: {
        companyModuleIdentifier: BUSINESS_OPPORTUNITY_DISCOVERY_ID,
        moduleVersion: BOD_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X1-02",
        authenticationMethod: "none",
        credentialRef: "vault://business-opportunity-discovery",
        apiEndpointConfig: {
          baseUrl: "internal://business-opportunity-discovery",
          protocol: "rest",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "opportunity.discovered",
            "opportunity.scored",
            "opportunity.ranked",
            "opportunity.failed",
          ],
          maxEventsPerMinute: 60,
          windowMs: 60000,
        },
        rateLimitConfig: {
          enabled: true,
          requestsPerMinute: 60,
          burstLimit: 10,
          windowMs: 60000,
        },
        retryConfig: {
          enabled: true,
          maxAttempts: config.maxRetryAttempts,
          delayMs: config.retryDelayMs,
          backoffMultiplier: config.retryBackoffMultiplier,
        },
        supportedCapabilities: [
          "company_module_registration",
          "company_module_activation",
          "company_event_routing",
        ],
      },
      forceRegister: true,
    });

    if (report.validation.decision !== "fail") {
      this.deps.companyFactoryFramework.activateCompanyModule(
        BUSINESS_OPPORTUNITY_DISCOVERY_ID,
      );
    }

    appendBodLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Business Opportunity Discovery with Company Factory Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `bod-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: BOD_METADATA_VERSION,
      },
    };
  }

  connectBusinessOpportunityDiscovery(
    _input: ConnectBusinessOpportunityDiscoveryInput,
    config: BusinessOpportunityDiscoveryConfiguration,
  ): OpportunityRunReport {
    const started = Date.now();
    const frameworkReg = this.registerWithFramework(config);
    const deps = this.dependencyPresence();

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

    appendBodLog({
      event: "engine_connect",
      level: "info",
      details: `Business Opportunity Discovery connected · framework=${deps.companyFactoryFramework}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      opportunityRecords: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  discoverOpportunities(
    input: DiscoverOpportunitiesInput,
    config: BusinessOpportunityDiscoveryConfiguration,
  ): OpportunityRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const validation = this.validator.validateDiscover(input, config);
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "discover_opportunities",
        engineRecord: engine,
        opportunityRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    const health = this.frameworkHealthScore();
    const industry = input.industry?.trim() || "general-structural";
    const marketReference =
      input.marketReference?.trim() || `structural://opportunity/${industry}`;
    const category = input.category ?? "general";

    let record = this.discovery.create({
      opportunityCategory: category,
      industry,
      marketReference,
      opportunityScore: Math.max(config.minOpportunityScore, Math.round(health * 0.8)),
      estimatedProfitability: Math.max(
        config.minOpportunityScore,
        Math.round(health * 0.75),
      ),
      confidenceScore: Math.max(config.minConfidenceScore, Math.round(health * 0.7)),
    });
    record = this.scoring.score(record, health, config.minOpportunityScore);
    record.structuralSignalOnly = true;
    record.fabricatedMarketInformation = false;
    this.discovery.persist(record);

    appendBodLog({
      event: "opportunity_discovery",
      level: "info",
      details: `Discovered structural opportunity · id=${record.opportunityId} · score=${record.opportunityScore}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "discover_opportunities",
      engineRecord: engine,
      opportunityRecords: [record],
      validation: this.validator.validateOpportunityRecord(record),
      durationMs: Date.now() - started,
    });
  }

  private requireRecord(opportunityId?: string): OpportunityRecord {
    if (opportunityId) {
      const found = this.discovery.get(opportunityId);
      if (!found) throw new Error(`Opportunity not found: ${opportunityId}`);
      return found;
    }
    const all = this.discovery.list();
    if (all.length === 0) throw new Error("No opportunity records available");
    return all[all.length - 1]!;
  }

  private ensureRecord(
    input: OpportunityActionInput,
    config: BusinessOpportunityDiscoveryConfiguration,
  ): OpportunityRecord {
    try {
      return this.requireRecord(input.opportunityId);
    } catch {
      const created = this.discoverOpportunities(
        {
          industry: input.industry,
          marketReference: input.marketReference,
          validated: true,
        },
        config,
      );
      return created.opportunityRecords[0]!;
    }
  }

  private actionPass(
    action: OpportunityRunReport["action"],
    transform: (record: OpportunityRecord, confidence: number) => OpportunityRecord,
    input: OpportunityActionInput,
    config: BusinessOpportunityDiscoveryConfiguration,
    event: string,
  ): OpportunityRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    if (!config.marketMonitoringRulesEnabled && action.startsWith("monitor")) {
      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord: engine,
        opportunityRecords: [],
        validation: {
          validationReportId: `bod-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Market monitoring rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: BOD_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }

    let record = this.ensureRecord(input, config);
    const confidence = Math.max(
      config.minConfidenceScore,
      Math.round(this.frameworkHealthScore() * 0.75),
    );
    record = transform(record, confidence);
    record.structuralSignalOnly = true;
    record.fabricatedMarketInformation = false;
    this.discovery.persist(record);

    appendBodLog({
      event,
      level: "info",
      details: `${action} · id=${record.opportunityId}`,
    });

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord: engine,
      opportunityRecords: [record],
      validation: this.validator.validateOpportunityRecord(record),
      durationMs: Date.now() - started,
    });
  }

  monitorMarketTrends(
    input: OpportunityActionInput,
    config: BusinessOpportunityDiscoveryConfiguration,
  ): OpportunityRunReport {
    return this.actionPass(
      "monitor_market_trends",
      (r, c) => this.marketIntelligence.monitorTrends(r, c),
      input,
      config,
      "market_monitoring",
    );
  }

  monitorEmergingIndustries(
    input: OpportunityActionInput,
    config: BusinessOpportunityDiscoveryConfiguration,
  ): OpportunityRunReport {
    return this.actionPass(
      "monitor_emerging_industries",
      (r, c) => this.industryMonitoring.monitorEmergingIndustries(r, c),
      input,
      config,
      "market_monitoring",
    );
  }

  monitorCustomerDemand(
    input: OpportunityActionInput,
    config: BusinessOpportunityDiscoveryConfiguration,
  ): OpportunityRunReport {
    return this.actionPass(
      "monitor_customer_demand",
      (r, c) => this.marketIntelligence.monitorCustomerDemand(r, c),
      input,
      config,
      "market_monitoring",
    );
  }

  monitorCompetitorActivity(
    input: OpportunityActionInput,
    config: BusinessOpportunityDiscoveryConfiguration,
  ): OpportunityRunReport {
    return this.actionPass(
      "monitor_competitor_activity",
      (r, c) => this.marketIntelligence.monitorCompetitorActivity(r, c),
      input,
      config,
      "market_monitoring",
    );
  }

  identifyUnderservedMarkets(
    input: OpportunityActionInput,
    config: BusinessOpportunityDiscoveryConfiguration,
  ): OpportunityRunReport {
    return this.actionPass(
      "identify_underserved_markets",
      (r, c) => this.industryMonitoring.identifyUnderservedMarkets(r, c),
      input,
      config,
      "opportunity_discovery",
    );
  }

  identifyProfitableNiches(
    input: OpportunityActionInput,
    config: BusinessOpportunityDiscoveryConfiguration,
  ): OpportunityRunReport {
    return this.actionPass(
      "identify_profitable_niches",
      (r, c) => this.industryMonitoring.identifyProfitableNiches(r, c),
      input,
      config,
      "opportunity_discovery",
    );
  }

  scoreOpportunities(
    input: OpportunityActionInput,
    config: BusinessOpportunityDiscoveryConfiguration,
  ): OpportunityRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    if (!config.opportunityScoringRulesEnabled) {
      return this.metadataGenerator.buildRunReport({
        action: "score_opportunities",
        engineRecord: engine,
        opportunityRecords: [],
        validation: {
          validationReportId: `bod-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Opportunity scoring rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: BOD_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }

    let record = this.ensureRecord(input, config);
    record = this.scoring.score(record, this.frameworkHealthScore(), config.minOpportunityScore);
    this.discovery.persist(record);

    appendBodLog({
      event: "opportunity_scoring",
      level: "info",
      details: `Scored opportunity · id=${record.opportunityId} · score=${record.opportunityScore}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "score_opportunities",
      engineRecord: engine,
      opportunityRecords: [record],
      validation: this.validator.validateOpportunityRecord(record),
      durationMs: Date.now() - started,
    });
  }

  rankOpportunities(
    input: OpportunityActionInput,
    config: BusinessOpportunityDiscoveryConfiguration,
  ): OpportunityRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    if (!config.rankingRulesEnabled) {
      return this.metadataGenerator.buildRunReport({
        action: "rank_opportunities",
        engineRecord: engine,
        opportunityRecords: [],
        validation: {
          validationReportId: `bod-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Ranking rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: BOD_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }

    this.ensureRecord(input, config);
    const ranked = this.ranking.rank(this.discovery.list());
    for (const record of ranked) {
      this.discovery.persist(record);
    }

    appendBodLog({
      event: "ranking_generation",
      level: "info",
      details: `Ranked ${ranked.length} opportunity record(s)`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "rank_opportunities",
      engineRecord: engine,
      opportunityRecords: ranked.slice(0, config.maxOpportunitiesPerCycle),
      validation:
        ranked.length > 0
          ? this.validator.validateOpportunityRecord(ranked[0]!)
          : {
              validationReportId: `bod-val-${Date.now()}`,
              validationTimestamp: new Date().toISOString(),
              decision: "partial",
              errors: [],
              warnings: ["No opportunities to rank"],
              durationMs: 0,
              metadataVersion: BOD_METADATA_VERSION,
            },
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.discovery.resetForTesting();
  }
}
