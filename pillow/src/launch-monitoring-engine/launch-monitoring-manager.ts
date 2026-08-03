/** X1-13 — Launch Monitoring Manager. */

import { createHash } from "node:crypto";
import type { CompanyFactoryFrameworkEngine } from "../company-factory-framework/engine.js";
import type { BusinessLaunchOrchestrator } from "../business-launch-orchestrator/engine.js";
import type { GrowthInitializationEngine } from "../growth-initialization-engine/engine.js";
import { LAUNCH_MONITORING_ENGINE_ID, LME_METADATA_VERSION } from "./paths.js";
import { appendLmeLog } from "./lme-logging.js";
import { MonitoringRecordStore } from "./monitoring-record-store.js";
import { OperationalMonitoringEngine } from "./operational-monitoring-engine.js";
import { SalesMonitoringEngine } from "./sales-monitoring-engine.js";
import { CustomerActivityMonitor } from "./customer-activity-monitor.js";
import { LaunchHealthAnalyzer } from "./launch-health-analyzer.js";
import { LaunchRecommendationEngine } from "./launch-recommendation-engine.js";
import { LaunchMonitoringValidator } from "./launch-monitoring-validator.js";
import { LaunchMonitoringMetadataGenerator } from "./launch-monitoring-metadata-generator.js";
import type { LaunchMonitoringEngineConfiguration } from "./configuration.js";
import type {
  ConnectLaunchMonitoringEngineInput,
  LaunchMonitoringActionInput,
  LaunchMonitoringEngineRecord,
  LaunchMonitoringRecord,
  LaunchMonitoringRunReport,
  MonitorLaunchInput,
} from "./types.js";

export type LaunchMonitoringEngineDependencies = {
  companyFactoryFramework: CompanyFactoryFrameworkEngine | null;
  businessLaunchOrchestrator: BusinessLaunchOrchestrator | null;
  growthInitializationEngine: GrowthInitializationEngine | null;
};

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export class LaunchMonitoringManager {
  private engineRecord: LaunchMonitoringEngineRecord | null = null;
  private readonly store = new MonitoringRecordStore();
  private readonly operational = new OperationalMonitoringEngine();
  private readonly sales = new SalesMonitoringEngine();
  private readonly customers = new CustomerActivityMonitor();
  private readonly analyzer = new LaunchHealthAnalyzer();
  private readonly recommendations = new LaunchRecommendationEngine();
  private readonly validator = new LaunchMonitoringValidator();
  private readonly metadataGenerator = new LaunchMonitoringMetadataGenerator();

  constructor(private readonly deps: LaunchMonitoringEngineDependencies) {}

  getEngineRecord(): LaunchMonitoringEngineRecord | null {
    return this.engineRecord;
  }

  getMonitoringRecords(): LaunchMonitoringRecord[] {
    return this.store.list();
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.store.resetForTesting();
  }

  private probe(getter: () => unknown): boolean {
    try {
      getter();
      return true;
    } catch {
      return false;
    }
  }

  private dependencyPresence(): LaunchMonitoringEngineRecord["dependencyPresence"] {
    return {
      companyFactoryFramework: this.deps.companyFactoryFramework
        ? this.probe(() => this.deps.companyFactoryFramework!.getState())
        : false,
      businessLaunchOrchestrator: this.deps.businessLaunchOrchestrator
        ? this.probe(() => this.deps.businessLaunchOrchestrator!.getState())
        : false,
      growthInitializationEngine: this.deps.growthInitializationEngine
        ? this.probe(() => this.deps.growthInitializationEngine!.getState())
        : false,
    };
  }

  private requireConnected(): LaunchMonitoringEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Launch Monitoring Engine not connected — call connectLaunchMonitoringEngine first",
      );
    }
    return this.engineRecord;
  }

  private resolveContext(input: MonitorLaunchInput | LaunchMonitoringActionInput): {
    companyReference: string;
    launchReference: string;
    growthPlanReference: string;
    industry: string;
    hasLaunch: boolean;
    hasGrowthPlan: boolean;
    growthScore: number | null;
  } {
    const industry = input.industry?.trim() || "general-structural";

    const launch = safe(() => {
      const records = this.deps.businessLaunchOrchestrator?.getLaunchRecords() ?? [];
      return records.length ? records[records.length - 1]! : null;
    }, null);
    const growth = safe(() => {
      const records = this.deps.growthInitializationEngine?.getGrowthRecords() ?? [];
      return records.length ? records[records.length - 1]! : null;
    }, null);

    const launchReference =
      input.launchReference?.trim() ||
      launch?.launchId ||
      `structural://launch/${industry}`;
    const growthPlanReference =
      input.growthPlanReference?.trim() ||
      growth?.growthPlanId ||
      `structural://growth-plan/${industry}`;
    const companyReference =
      input.companyReference?.trim() ||
      launch?.companyReference ||
      growth?.companyReference ||
      `structural://company/${industry}`;

    return {
      companyReference,
      launchReference,
      growthPlanReference,
      industry,
      hasLaunch: Boolean(launch) || Boolean(input.launchReference),
      hasGrowthPlan: Boolean(growth) || Boolean(input.growthPlanReference),
      growthScore: growth?.growthScore ?? null,
    };
  }

  registerWithFramework(
    config: LaunchMonitoringEngineConfiguration,
  ): { frameworkModuleId: string | null; validation: LaunchMonitoringRunReport["validation"] } {
    if (!this.deps.companyFactoryFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.companyFactoryFramework.registerCompanyModule({
      definition: {
        companyModuleIdentifier: LAUNCH_MONITORING_ENGINE_ID,
        moduleVersion: LME_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X1-13",
        authenticationMethod: "none",
        credentialRef: "vault://launch-monitoring-engine",
        apiEndpointConfig: {
          baseUrl: "internal://launch-monitoring-engine",
          protocol: "rest",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: ["launch.monitored", "launch.anomaly", "launch.monitoring.failed"],
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
      this.deps.companyFactoryFramework.activateCompanyModule(LAUNCH_MONITORING_ENGINE_ID);
    }

    appendLmeLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Launch Monitoring Engine with Company Factory Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `lme-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: LME_METADATA_VERSION,
      },
    };
  }

  connectLaunchMonitoringEngine(
    _input: ConnectLaunchMonitoringEngineInput,
    config: LaunchMonitoringEngineConfiguration,
  ): LaunchMonitoringRunReport {
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

    appendLmeLog({
      event: "engine_connect",
      level: "info",
      details: `Launch Monitoring Engine connected · deps=${Object.values(deps).filter(Boolean).length}/3 · frequency=${config.monitoringFrequencySeconds}s`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      monitoringRecords: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  monitorLaunch(
    input: MonitorLaunchInput,
    config: LaunchMonitoringEngineConfiguration,
  ): LaunchMonitoringRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const validation = this.validator.validateMonitorInput(input, config);
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "monitor_launch",
        engineRecord: engine,
        monitoringRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (this.store.list().length >= config.maxMonitoringRecordsPerCycle) {
      return this.metadataGenerator.buildRunReport({
        action: "monitor_launch",
        engineRecord: engine,
        monitoringRecords: [],
        validation: {
          validationReportId: `lme-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: [
            `Max monitoring records per cycle reached (${config.maxMonitoringRecordsPerCycle})`,
          ],
          warnings: [],
          durationMs: 0,
          metadataVersion: LME_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const ctx = this.resolveContext(input);
    const fingerprint = createHash("sha256")
      .update(
        `${ctx.companyReference}|${ctx.launchReference}|${ctx.growthPlanReference}`.toLowerCase(),
      )
      .digest("hex")
      .slice(0, 16);
    if (this.store.hasFingerprint(fingerprint)) {
      return this.metadataGenerator.buildRunReport({
        action: "monitor_launch",
        engineRecord: engine,
        monitoringRecords: [],
        validation: {
          validationReportId: `lme-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Duplicate launch monitoring record detected — blocked"],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: LME_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const ops = this.operational.summarize({
      industry: ctx.industry,
      hasLaunch: ctx.hasLaunch,
      hasGrowthPlan: ctx.hasGrowthPlan,
      alertThreshold: config.alertThreshold,
    });
    const sales = this.sales.summarize({
      industry: ctx.industry,
      growthScore: ctx.growthScore,
      hasLaunch: ctx.hasLaunch,
    });
    const customer = this.customers.summarize({
      industry: ctx.industry,
      hasGrowthPlan: ctx.hasGrowthPlan,
      hasLaunch: ctx.hasLaunch,
    });

    const operationalHealthScore = this.analyzer.computeOperationalHealthScore({
      operational: ops.scoreContribution,
      sales: sales.scoreContribution,
      customer: customer.scoreContribution,
      scoringEnabled: config.healthScoringRulesEnabled,
    });

    const anomalySummary = config.anomalyDetectionEnabled
      ? this.analyzer.detectAnomalies({
          operationalHealthScore,
          alertThreshold: config.alertThreshold,
          hasLaunch: ctx.hasLaunch,
          hasGrowthPlan: ctx.hasGrowthPlan,
        })
      : "detection-disabled";

    const detectedIssues = this.analyzer.detectOperationalFailures({
      operationalHealthScore,
      alertThreshold: config.alertThreshold,
      anomalySummary,
    });

    const healthRecommendations = config.recommendationRulesEnabled
      ? this.recommendations.recommend({
          operationalHealthScore,
          alertThreshold: config.alertThreshold,
          detectedIssues,
          anomalySummary,
        })
      : "recommendations-disabled";

    const record = this.store.create({
      companyReference: ctx.companyReference,
      launchReference: ctx.launchReference,
      growthPlanReference: ctx.growthPlanReference,
      operationalHealthScore,
      salesSummary: sales.summary,
      customerActivitySummary: customer.summary,
      orderActivitySummary: this.sales.orderActivity({
        salesIndex: sales.scoreContribution,
        industry: ctx.industry,
      }),
      systemStabilitySummary: this.operational.systemStability({
        operationalScore: operationalHealthScore,
        alertThreshold: config.alertThreshold,
      }),
      detectedIssues,
      anomalySummary,
      healthRecommendations,
      validationStatus: "pending",
    });

    const recordValidation = this.validator.validateMonitoringRecord(record);
    record.validationStatus =
      recordValidation.decision === "fail"
        ? "failed"
        : recordValidation.decision === "partial"
          ? "partial"
          : "passed";
    this.store.persist(record);

    appendLmeLog({
      event: "launch_monitoring",
      level: "info",
      details: `Launch monitored · id=${record.launchMonitoringId} · score=${record.operationalHealthScore}`,
    });
    appendLmeLog({
      event: "operational_monitoring",
      level: "info",
      details: record.systemStabilitySummary,
    });
    appendLmeLog({
      event: "sales_monitoring",
      level: "info",
      details: record.salesSummary,
    });
    appendLmeLog({
      event: "alert_generation",
      level: record.anomalySummary === "none" ? "info" : "warn",
      details: `anomalies=${record.anomalySummary} · issues=${record.detectedIssues}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "monitor_launch",
      engineRecord: engine,
      monitoringRecords: [record],
      validation: recordValidation,
      durationMs: Date.now() - started,
    });
  }

  private requireRecord(launchMonitoringId?: string): LaunchMonitoringRecord {
    if (launchMonitoringId) {
      const found = this.store.get(launchMonitoringId);
      if (!found) throw new Error(`Launch monitoring record not found: ${launchMonitoringId}`);
      return found;
    }
    const all = this.store.list();
    if (all.length === 0) throw new Error("No launch monitoring records available");
    return all[all.length - 1]!;
  }

  private ensureRecord(
    input: LaunchMonitoringActionInput,
    config: LaunchMonitoringEngineConfiguration,
  ): LaunchMonitoringRecord {
    try {
      return this.requireRecord(input.launchMonitoringId);
    } catch {
      const created = this.monitorLaunch(
        {
          companyReference: input.companyReference,
          launchReference: input.launchReference,
          growthPlanReference: input.growthPlanReference,
          industry: input.industry,
          validated: true,
        },
        config,
      );
      return created.monitoringRecords[0]!;
    }
  }

  private actionPass(
    action: LaunchMonitoringRunReport["action"],
    transform: (
      record: LaunchMonitoringRecord,
      ctx: ReturnType<LaunchMonitoringManager["resolveContext"]>,
      config: LaunchMonitoringEngineConfiguration,
    ) => LaunchMonitoringRecord,
    input: LaunchMonitoringActionInput,
    config: LaunchMonitoringEngineConfiguration,
    event: string,
  ): LaunchMonitoringRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const ctx = this.resolveContext(input);
    let record = this.ensureRecord(input, config);
    record = transform(record, ctx, config);
    record.modifiedProductionOperationsWithoutValidation = false;
    record.structuralSignalOnly = true;
    record.fabricatedMonitoringFacts = false;
    this.store.persist(record);

    appendLmeLog({
      event,
      level: "info",
      details: `${action} · id=${record.launchMonitoringId}`,
    });

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord: engine,
      monitoringRecords: [record],
      validation: this.validator.validateMonitoringRecord(record),
      durationMs: Date.now() - started,
    });
  }

  monitorOperationalHealth(
    input: LaunchMonitoringActionInput,
    config: LaunchMonitoringEngineConfiguration,
  ): LaunchMonitoringRunReport {
    return this.actionPass(
      "monitor_operational_health",
      (r, ctx) => {
        const ops = this.operational.summarize({
          industry: ctx.industry,
          hasLaunch: ctx.hasLaunch,
          hasGrowthPlan: ctx.hasGrowthPlan,
          alertThreshold: config.alertThreshold,
        });
        const score = this.analyzer.computeOperationalHealthScore({
          operational: ops.scoreContribution,
          sales: 50,
          customer: 50,
          scoringEnabled: config.healthScoringRulesEnabled,
        });
        return {
          ...r,
          operationalHealthScore: score,
          systemStabilitySummary: this.operational.systemStability({
            operationalScore: score,
            alertThreshold: config.alertThreshold,
          }),
        };
      },
      input,
      config,
      "operational_monitoring",
    );
  }

  monitorCustomerActivity(
    input: LaunchMonitoringActionInput,
    config: LaunchMonitoringEngineConfiguration,
  ): LaunchMonitoringRunReport {
    return this.actionPass(
      "monitor_customer_activity",
      (r, ctx) => {
        const customer = this.customers.summarize({
          industry: ctx.industry,
          hasGrowthPlan: ctx.hasGrowthPlan,
          hasLaunch: ctx.hasLaunch,
        });
        return { ...r, customerActivitySummary: customer.summary };
      },
      input,
      config,
      "launch_monitoring",
    );
  }

  monitorSalesPerformance(
    input: LaunchMonitoringActionInput,
    config: LaunchMonitoringEngineConfiguration,
  ): LaunchMonitoringRunReport {
    return this.actionPass(
      "monitor_sales_performance",
      (r, ctx) => {
        const sales = this.sales.summarize({
          industry: ctx.industry,
          growthScore: ctx.growthScore,
          hasLaunch: ctx.hasLaunch,
        });
        return {
          ...r,
          salesSummary: sales.summary,
          orderActivitySummary: this.sales.orderActivity({
            salesIndex: sales.scoreContribution,
            industry: ctx.industry,
          }),
        };
      },
      input,
      config,
      "sales_monitoring",
    );
  }

  monitorOrderActivity(
    input: LaunchMonitoringActionInput,
    config: LaunchMonitoringEngineConfiguration,
  ): LaunchMonitoringRunReport {
    return this.actionPass(
      "monitor_order_activity",
      (r, ctx) => {
        const sales = this.sales.summarize({
          industry: ctx.industry,
          growthScore: ctx.growthScore,
          hasLaunch: ctx.hasLaunch,
        });
        return {
          ...r,
          orderActivitySummary: this.sales.orderActivity({
            salesIndex: sales.scoreContribution,
            industry: ctx.industry,
          }),
        };
      },
      input,
      config,
      "sales_monitoring",
    );
  }

  monitorSystemStability(
    input: LaunchMonitoringActionInput,
    config: LaunchMonitoringEngineConfiguration,
  ): LaunchMonitoringRunReport {
    return this.actionPass(
      "monitor_system_stability",
      (r) => ({
        ...r,
        systemStabilitySummary: this.operational.systemStability({
          operationalScore: r.operationalHealthScore,
          alertThreshold: config.alertThreshold,
        }),
      }),
      input,
      config,
      "operational_monitoring",
    );
  }

  detectLaunchAnomalies(
    input: LaunchMonitoringActionInput,
    config: LaunchMonitoringEngineConfiguration,
  ): LaunchMonitoringRunReport {
    if (!config.anomalyDetectionEnabled) {
      const engine = this.requireConnected();
      return this.metadataGenerator.buildRunReport({
        action: "detect_launch_anomalies",
        engineRecord: engine,
        monitoringRecords: [],
        validation: {
          validationReportId: `lme-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Anomaly detection disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: LME_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }
    return this.actionPass(
      "detect_launch_anomalies",
      (r, ctx) => ({
        ...r,
        anomalySummary: this.analyzer.detectAnomalies({
          operationalHealthScore: r.operationalHealthScore,
          alertThreshold: config.alertThreshold,
          hasLaunch: ctx.hasLaunch,
          hasGrowthPlan: ctx.hasGrowthPlan,
        }),
      }),
      input,
      config,
      "alert_generation",
    );
  }

  detectOperationalFailures(
    input: LaunchMonitoringActionInput,
    config: LaunchMonitoringEngineConfiguration,
  ): LaunchMonitoringRunReport {
    return this.actionPass(
      "detect_operational_failures",
      (r) => ({
        ...r,
        detectedIssues: this.analyzer.detectOperationalFailures({
          operationalHealthScore: r.operationalHealthScore,
          alertThreshold: config.alertThreshold,
          anomalySummary: r.anomalySummary,
        }),
      }),
      input,
      config,
      "alert_generation",
    );
  }

  generateLaunchHealthRecommendations(
    input: LaunchMonitoringActionInput,
    config: LaunchMonitoringEngineConfiguration,
  ): LaunchMonitoringRunReport {
    if (!config.recommendationRulesEnabled) {
      const engine = this.requireConnected();
      return this.metadataGenerator.buildRunReport({
        action: "generate_launch_health_recommendations",
        engineRecord: engine,
        monitoringRecords: [],
        validation: {
          validationReportId: `lme-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Recommendation rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: LME_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }
    return this.actionPass(
      "generate_launch_health_recommendations",
      (r) => ({
        ...r,
        healthRecommendations: this.recommendations.recommend({
          operationalHealthScore: r.operationalHealthScore,
          alertThreshold: config.alertThreshold,
          detectedIssues: r.detectedIssues,
          anomalySummary: r.anomalySummary,
        }),
      }),
      input,
      config,
      "alert_generation",
    );
  }
}
