/** X2-17 — Company Lifecycle Manager (orchestration core). */

import type { EnterprisePortfolioFrameworkEngine } from "../enterprise-portfolio-framework/engine.js";
import type { MultiCompanyRegistry } from "../multi-company-registry/engine.js";
import type { PortfolioPerformanceEngine } from "../portfolio-performance-engine/engine.js";
import type { BusinessHealthRanking } from "../business-health-ranking/engine.js";
import type { PortfolioForecastEngine } from "../portfolio-forecast-engine/engine.js";
import type { PortfolioOptimizationEngine } from "../portfolio-optimization-engine/engine.js";
import {
  CLM_CAPABILITIES,
  CLM_METADATA_VERSION,
  COMPANY_LIFECYCLE_MANAGER_ID,
} from "./paths.js";
import { appendClmLog } from "./clm-logging.js";
import { LifecycleStateEngine } from "./lifecycle-state-engine.js";
import { LifecycleTransitionEngine } from "./lifecycle-transition-engine.js";
import { MaturityAssessmentEngine } from "./maturity-assessment-engine.js";
import { LifecycleRecommendationEngine } from "./lifecycle-recommendation-engine.js";
import { LifecycleAnalyticsEngine } from "./lifecycle-analytics-engine.js";
import { LifecycleValidator } from "./lifecycle-validator.js";
import { LifecycleMetadataGenerator } from "./lifecycle-metadata-generator.js";
import type { CompanyLifecycleManagerConfiguration } from "./configuration.js";
import type {
  AssessMaturityInput,
  CompanyLifecycleEngineRecord,
  ConnectCompanyLifecycleManagerInput,
  DetectTransitionsInput,
  GenerateLifecycleRecommendationsInput,
  LifecycleRecord,
  LifecycleRunReport,
  LifecycleStage,
  ManageLifecycleStageInput,
  ManageStageActionInput,
  RunLifecycleAnalyticsInput,
  RunLifecycleDiagnosticsInput,
} from "./types.js";

export type CompanyLifecycleManagerDependencies = {
  enterprisePortfolioFramework: EnterprisePortfolioFrameworkEngine | null;
  multiCompanyRegistry: MultiCompanyRegistry | null;
  portfolioPerformanceEngine: PortfolioPerformanceEngine | null;
  businessHealthRanking: BusinessHealthRanking | null;
  portfolioForecastEngine: PortfolioForecastEngine | null;
  portfolioOptimizationEngine: PortfolioOptimizationEngine | null;
};

export class CompanyLifecycleManagerCore {
  private engineRecord: CompanyLifecycleEngineRecord | null = null;
  private records = new Map<string, LifecycleRecord>();
  private readonly stateEngine = new LifecycleStateEngine();
  private readonly transitionEngine = new LifecycleTransitionEngine();
  private readonly maturityEngine = new MaturityAssessmentEngine();
  private readonly recommendations = new LifecycleRecommendationEngine();
  private readonly analytics = new LifecycleAnalyticsEngine();
  private readonly validator = new LifecycleValidator();
  private readonly metadataGenerator = new LifecycleMetadataGenerator();

  constructor(private readonly deps: CompanyLifecycleManagerDependencies) {}

  getEngineRecord(): CompanyLifecycleEngineRecord | null {
    return this.engineRecord;
  }

  getLifecycleRecords(): LifecycleRecord[] {
    return [...this.records.values()];
  }

  pendingTransitionCount(): number {
    return this.getLifecycleRecords().filter(
      (r) =>
        r.lifecycleStatus === "transition_pending" ||
        r.lifecycleStatus === "transition_recommended",
    ).length;
  }

  averageMaturityScore(): number {
    const list = this.getLifecycleRecords();
    if (!list.length) return 0;
    return Math.round(list.reduce((sum, r) => sum + r.maturityScore, 0) / list.length);
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.records.clear();
  }

  private probe(getter: () => unknown): boolean {
    try {
      getter();
      return true;
    } catch {
      return false;
    }
  }

  private dependencyPresence(): CompanyLifecycleEngineRecord["dependencyPresence"] {
    return {
      enterprisePortfolioFramework: this.deps.enterprisePortfolioFramework
        ? this.probe(() => this.deps.enterprisePortfolioFramework!.getState())
        : false,
      multiCompanyRegistry: this.deps.multiCompanyRegistry
        ? this.probe(() => this.deps.multiCompanyRegistry!.getState())
        : false,
      portfolioPerformanceEngine: this.deps.portfolioPerformanceEngine
        ? this.probe(() => this.deps.portfolioPerformanceEngine!.getState())
        : false,
      businessHealthRanking: this.deps.businessHealthRanking
        ? this.probe(() => this.deps.businessHealthRanking!.getState())
        : false,
      portfolioForecastEngine: this.deps.portfolioForecastEngine
        ? this.probe(() => this.deps.portfolioForecastEngine!.getState())
        : false,
      portfolioOptimizationEngine: this.deps.portfolioOptimizationEngine
        ? this.probe(() => this.deps.portfolioOptimizationEngine!.getState())
        : false,
    };
  }

  private requireConnected(): CompanyLifecycleEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Company Lifecycle Manager not connected — call connectCompanyLifecycleManager first",
      );
    }
    return this.engineRecord;
  }

  private store(record: LifecycleRecord): LifecycleRecord {
    this.records.set(record.companyReference, { ...record });
    return { ...record };
  }

  private failReport(
    action: LifecycleRunReport["action"],
    errors: string[],
    durationMs: number,
  ): LifecycleRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "clm-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: COMPANY_LIFECYCLE_MANAGER_ID,
        engineVersion: "PILLOW-CLM-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...CLM_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: CLM_METADATA_VERSION,
      } satisfies CompanyLifecycleEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      validation: {
        validationReportId: `clm-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: CLM_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(config: CompanyLifecycleManagerConfiguration): {
    frameworkModuleId: string | null;
    validation: LifecycleRunReport["validation"];
  } {
    if (!this.deps.enterprisePortfolioFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.enterprisePortfolioFramework.registerPortfolioModule({
      definition: {
        portfolioModuleIdentifier: COMPANY_LIFECYCLE_MANAGER_ID,
        moduleVersion: CLM_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X2-17",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "lifecycle.assessed",
            "lifecycle.transition_recommended",
            "lifecycle.stage_managed",
            "lifecycle.recommended",
          ],
          maxEventsPerMinute: 60,
          windowMs: 60000,
        },
        retryConfig: {
          enabled: true,
          maxAttempts: config.maxRetryAttempts,
          delayMs: config.retryDelayMs,
          backoffMultiplier: config.retryBackoffMultiplier,
        },
        supportedCapabilities: [
          "portfolio_module_registration",
          "portfolio_event_routing",
          "portfolio_validation",
          "diagnostics",
        ],
      },
      forceRegister: true,
    });

    if (report.validation.decision !== "fail") {
      this.deps.enterprisePortfolioFramework.activatePortfolioModule(
        COMPANY_LIFECYCLE_MANAGER_ID,
      );
    }

    appendClmLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Company Lifecycle Manager with EPF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.portfolioFrameworkId ?? null,
      validation: {
        validationReportId: `clm-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: CLM_METADATA_VERSION,
      },
    };
  }

  connectCompanyLifecycleManager(
    _input: ConnectCompanyLifecycleManagerInput,
    config: CompanyLifecycleManagerConfiguration,
  ): LifecycleRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    if (configValidation.decision === "fail") {
      return this.failReport("connect", configValidation.errors, Date.now() - started);
    }

    const framework = this.registerWithFramework(config);
    const presence = this.dependencyPresence();
    const connectedCount = Object.values(presence).filter(Boolean).length;
    const corePresent =
      presence.enterprisePortfolioFramework && presence.multiCompanyRegistry;

    this.engineRecord = {
      engineRecordId: `clm-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: COMPANY_LIFECYCLE_MANAGER_ID,
      engineVersion: "PILLOW-CLM-001",
      currentOperationalState: "connected",
      healthStatus: corePresent ? (connectedCount >= 4 ? "healthy" : "degraded") : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...CLM_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: CLM_METADATA_VERSION,
    };

    appendClmLog({
      event: "engine_connected",
      level: "info",
      details: "Company Lifecycle Manager connected",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...Object.entries(presence)
        .filter(([, ok]) => !ok)
        .map(([key]) => `${key} unavailable`),
      "Automatic lifecycle transitions blocked beyond approval policies",
    ];

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: this.engineRecord,
      validation: {
        ...framework.validation,
        warnings,
        decision:
          framework.validation.decision === "fail"
            ? "fail"
            : !corePresent
              ? "partial"
              : framework.validation.decision,
      },
      durationMs: Date.now() - started,
    });
  }

  private upsertStage(
    action: LifecycleRunReport["action"],
    input: ManageLifecycleStageInput | ManageStageActionInput,
    config: CompanyLifecycleManagerConfiguration,
    stage: LifecycleStage,
  ): LifecycleRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateManage(input, config);
      if (validation.decision === "fail") {
        return this.failReport(action, validation.errors, Date.now() - started);
      }

      const existing = this.records.get(input.companyReference.trim()) ?? null;
      const maturityScore = this.maturityEngine.assess({
        maturityHint: input.maturityHint ?? existing?.maturityScore,
        currentStage: stage,
        config,
      });
      const draft = this.stateEngine.createOrUpdate({
        existing,
        companyReference: input.companyReference,
        currentLifecycleStage: stage,
        previousLifecycleStage: existing?.currentLifecycleStage ?? null,
        maturityScore,
        transitionRecommendation: `Stage managed as ${stage} — approval policy retained`,
        lifecycleStatus: stage === "retirement" ? "retired" : "stable",
        requiresApproval: config.requireApprovalForLifecycleTransitions,
      });
      const suggestion = this.transitionEngine.suggestNextStage(draft, config);
      const record = this.store({
        ...draft,
        transitionRecommendation: suggestion.transitionRecommendation,
        lifecycleStatus:
          suggestion.nextStage && suggestion.lifecycleStatus === "transition_recommended"
            ? "transition_recommended"
            : draft.lifecycleStatus,
        requiresApproval: suggestion.requiresApproval || draft.requiresApproval,
      });

      appendClmLog({
        event: "lifecycle_assessment",
        level: "info",
        details: `${action} company=${record.companyReference} stage=${record.currentLifecycleStage} maturity=${record.maturityScore}`,
      });

      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord,
        lifecycleRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        action,
        [error instanceof Error ? error.message : String(error)],
        Date.now() - started,
      );
    }
  }

  manageStage(
    input: ManageLifecycleStageInput,
    config: CompanyLifecycleManagerConfiguration,
  ): LifecycleRunReport {
    const stage = input.lifecycleStage ?? "launch";
    return this.upsertStage("manage_stage", input, config, stage);
  }

  assessMaturity(
    input: AssessMaturityInput,
    config: CompanyLifecycleManagerConfiguration,
  ): LifecycleRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateManage(input, config);
      if (validation.decision === "fail") {
        return this.failReport("assess_maturity", validation.errors, Date.now() - started);
      }

      const existing = this.records.get(input.companyReference.trim());
      if (!existing) {
        return this.failReport(
          "assess_maturity",
          ["Company lifecycle record not found — manage stage first"],
          Date.now() - started,
        );
      }

      const maturityScore = this.maturityEngine.assess({
        maturityHint: input.maturityHint,
        currentStage: existing.currentLifecycleStage,
        config,
      });
      const updated = this.store({
        ...existing,
        timestamp: new Date().toISOString(),
        maturityScore,
        transitionRecommendation: `Maturity assessed at ${maturityScore}`,
      });

      appendClmLog({
        event: "maturity_calculation",
        level: "info",
        details: `company=${updated.companyReference} maturity=${updated.maturityScore}`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "assess_maturity",
        engineRecord,
        lifecycleRecords: [updated],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "assess_maturity",
        [error instanceof Error ? error.message : String(error)],
        Date.now() - started,
      );
    }
  }

  detectTransitions(
    input: DetectTransitionsInput,
    config: CompanyLifecycleManagerConfiguration,
  ): LifecycleRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateDetect(input, config);
      if (validation.decision === "fail") {
        return this.failReport("detect_transitions", validation.errors, Date.now() - started);
      }

      const scoped = this.getLifecycleRecords().filter((r) =>
        input.companyReference ? r.companyReference === input.companyReference : true,
      );
      const updated = scoped.map((record) => {
        const suggestion = this.transitionEngine.suggestNextStage(record, config);
        // Recommend only — never auto-apply stage change
        return this.store({
          ...record,
          timestamp: new Date().toISOString(),
          transitionRecommendation: suggestion.nextStage
            ? `${suggestion.transitionRecommendation} (suggested next: ${suggestion.nextStage})`
            : suggestion.transitionRecommendation,
          lifecycleStatus: suggestion.lifecycleStatus,
          requiresApproval: suggestion.requiresApproval || record.requiresApproval,
          autoTransitionBlocked: true,
        });
      });

      appendClmLog({
        event: "lifecycle_transition",
        level: "info",
        details: `Detected transition signals for ${updated.length} companies (auto-apply blocked)`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "detect_transitions",
        engineRecord,
        lifecycleRecords: updated,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "detect_transitions",
        [error instanceof Error ? error.message : String(error)],
        Date.now() - started,
      );
    }
  }

  manageLaunch(
    input: ManageStageActionInput,
    config: CompanyLifecycleManagerConfiguration,
  ): LifecycleRunReport {
    return this.upsertStage("manage_launch", input, config, "launch");
  }

  manageGrowth(
    input: ManageStageActionInput,
    config: CompanyLifecycleManagerConfiguration,
  ): LifecycleRunReport {
    return this.upsertStage("manage_growth", input, config, "growth");
  }

  manageMature(
    input: ManageStageActionInput,
    config: CompanyLifecycleManagerConfiguration,
  ): LifecycleRunReport {
    return this.upsertStage("manage_mature", input, config, "mature");
  }

  manageRetirement(
    input: ManageStageActionInput,
    config: CompanyLifecycleManagerConfiguration,
  ): LifecycleRunReport {
    if (!config.retirementPoliciesEnabled) {
      return this.failReport(
        "manage_retirement",
        ["Retirement policies disabled"],
        0,
      );
    }
    return this.upsertStage("manage_retirement", input, config, "retirement");
  }

  generateRecommendations(
    input: GenerateLifecycleRecommendationsInput,
    config: CompanyLifecycleManagerConfiguration,
  ): LifecycleRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateRecommendations(input, config);
      if (validation.decision === "fail") {
        return this.failReport(
          "generate_recommendations",
          validation.errors,
          Date.now() - started,
        );
      }

      const recommendations = this.recommendations.recommend(
        this.getLifecycleRecords(),
        input.companyReference,
      );

      appendClmLog({
        event: "recommendation_generation",
        level: "info",
        details: `Generated ${recommendations.length} lifecycle recommendations`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "generate_recommendations",
        engineRecord,
        lifecycleRecords: this.getLifecycleRecords(),
        recommendations,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "generate_recommendations",
        [error instanceof Error ? error.message : String(error)],
        Date.now() - started,
      );
    }
  }

  runAnalytics(
    input: RunLifecycleAnalyticsInput,
    _config: CompanyLifecycleManagerConfiguration,
  ): LifecycleRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      if (input.validated !== true) {
        return this.failReport(
          "run_analytics",
          ["Lifecycle analytics requires validated=true"],
          Date.now() - started,
        );
      }
      const scoped = this.getLifecycleRecords().filter((r) =>
        input.companyReference ? r.companyReference === input.companyReference : true,
      );
      const summary = this.analytics.summarize(scoped);

      appendClmLog({
        event: "lifecycle_analytics",
        level: "info",
        details: summary.notes.join(" · "),
      });

      return this.metadataGenerator.buildRunReport({
        action: "run_analytics",
        engineRecord,
        lifecycleRecords: scoped,
        validation: {
          validationReportId: `clm-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "pass",
          errors: [],
          warnings: summary.notes,
          durationMs: Date.now() - started,
          metadataVersion: CLM_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "run_analytics",
        [error instanceof Error ? error.message : String(error)],
        Date.now() - started,
      );
    }
  }

  runDiagnostics(
    _input: RunLifecycleDiagnosticsInput,
    _config: CompanyLifecycleManagerConfiguration,
  ): LifecycleRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const records = this.getLifecycleRecords();
      return this.metadataGenerator.buildRunReport({
        action: "diagnostics",
        engineRecord,
        lifecycleRecords: records,
        validation: {
          validationReportId: `clm-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "pass",
          errors: [],
          warnings: records.length ? [] : ["No lifecycle records yet"],
          durationMs: Date.now() - started,
          metadataVersion: CLM_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "diagnostics",
        [error instanceof Error ? error.message : String(error)],
        Date.now() - started,
      );
    }
  }
}
