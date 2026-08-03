/** X3-03 — Scaling Decision Manager. */

import type { AutonomousScalingFrameworkEngine } from "../autonomous-scaling-framework/engine.js";
import type { WinningProductDetectorEngine } from "../winning-product-detector/engine.js";
import {
  SCALING_DECISION_ENGINE_ID,
  SDE_CAPABILITIES,
  SDE_METADATA_VERSION,
} from "./paths.js";
import type { ScalingDecisionEngineConfiguration } from "./configuration.js";
import { appendSdeLog } from "./sde-logging.js";
import { ScalingEvaluationEngine } from "./scaling-evaluation-engine.js";
import { ReadinessAssessmentEngine } from "./readiness-assessment-engine.js";
import { RiskAssessmentEngine } from "./risk-assessment-engine.js";
import { DecisionEngine } from "./decision-engine.js";
import { ScalingRecommendationEngine } from "./scaling-recommendation-engine.js";
import { DecisionMetadataGenerator } from "./decision-metadata-generator.js";
import { DecisionValidator } from "./decision-validator.js";
import { buildDecisionRecord } from "./structural-signals.js";
import type {
  ConnectScalingDecisionEngineInput,
  DecisionValidationReport,
  RunSdeDiagnosticsInput,
  ScalingDecisionEngineRecord,
  ScalingDecisionInput,
  ScalingDecisionRecord,
  ScalingRecommendation,
  SdeRunReport,
} from "./types.js";

export type ScalingDecisionEngineDependencies = {
  autonomousScalingFramework?: AutonomousScalingFrameworkEngine | null;
  winningProductDetector?: WinningProductDetectorEngine | null;
};

export class ScalingDecisionManager {
  private engineRecord: ScalingDecisionEngineRecord | null = null;
  private decisionRecords: ScalingDecisionRecord[] = [];
  private recommendations: ScalingRecommendation[] = [];

  private readonly evaluationEngine = new ScalingEvaluationEngine();
  private readonly readinessEngine = new ReadinessAssessmentEngine();
  private readonly riskEngine = new RiskAssessmentEngine();
  private readonly decisionEngine = new DecisionEngine();
  private readonly recommendationEngine = new ScalingRecommendationEngine();
  private readonly metadataGenerator = new DecisionMetadataGenerator();
  private readonly validator = new DecisionValidator();

  constructor(private readonly deps: ScalingDecisionEngineDependencies = {}) {}

  getEngineRecord(): ScalingDecisionEngineRecord | null {
    return this.engineRecord ? { ...this.engineRecord } : null;
  }

  getDecisionRecords(): ScalingDecisionRecord[] {
    return this.decisionRecords.map((r) => ({ ...r }));
  }

  getRecommendations(): ScalingRecommendation[] {
    return this.recommendations.map((r) => ({ ...r }));
  }

  scaleCount(): number {
    return this.decisionRecords.filter((r) => r.decision === "scale").length;
  }

  holdCount(): number {
    return this.decisionRecords.filter((r) => r.decision === "hold").length;
  }

  rejectCount(): number {
    return this.decisionRecords.filter((r) => r.decision === "reject").length;
  }

  averageConfidence(): number {
    if (this.decisionRecords.length === 0) return 0;
    const sum = this.decisionRecords.reduce((acc, r) => acc + r.scalingConfidence, 0);
    return Math.round(sum / this.decisionRecords.length);
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.decisionRecords = [];
    this.recommendations = [];
  }

  private dependencyPresence(): ScalingDecisionEngineRecord["dependencyPresence"] {
    return {
      autonomousScalingFramework: Boolean(this.deps.autonomousScalingFramework),
      winningProductDetector: Boolean(this.deps.winningProductDetector),
    };
  }

  private requireConnected(): ScalingDecisionEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "disconnected") {
      throw new Error(
        "Scaling Decision Engine not connected — call connectScalingDecisionEngine first",
      );
    }
    return this.engineRecord;
  }

  private storeRecord(record: ScalingDecisionRecord): void {
    const idx = this.decisionRecords.findIndex(
      (r) =>
        r.companyReference === record.companyReference &&
        r.productReference === record.productReference,
    );
    if (idx >= 0) this.decisionRecords[idx] = record;
    else this.decisionRecords.push(record);
  }

  failReport(
    action: SdeRunReport["action"],
    errors: string[],
    durationMs: number,
  ): SdeRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "sde-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: SCALING_DECISION_ENGINE_ID,
        engineVersion: "PILLOW-SDE-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...SDE_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: SDE_METADATA_VERSION,
      } satisfies ScalingDecisionEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      validation: {
        validationReportId: `sde-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: SDE_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(config: ScalingDecisionEngineConfiguration): {
    frameworkModuleId: string | null;
    validation: DecisionValidationReport;
  } {
    if (!this.deps.autonomousScalingFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.autonomousScalingFramework.registerScalingModule({
      definition: {
        scalingModuleIdentifier: SCALING_DECISION_ENGINE_ID,
        moduleVersion: SDE_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X3-03",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "scaling.candidate.evaluated",
            "scaling.readiness.assessed",
            "scaling.risk.assessed",
            "scaling.decision.produced",
            "scaling.recommended",
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
          "scaling_module_registration",
          "scaling_lifecycle_management",
          "scaling_event_routing",
          "scaling_data_abstraction",
          "scaling_validation",
          "diagnostics",
        ],
      },
      forceRegister: true,
    });

    if (report.validation.decision !== "fail") {
      this.deps.autonomousScalingFramework.activateScalingModule(SCALING_DECISION_ENGINE_ID);
    }

    appendSdeLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Scaling Decision Engine with ASF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.scalingFrameworkId ?? null,
      validation: {
        validationReportId: `sde-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: SDE_METADATA_VERSION,
      },
    };
  }

  connectScalingDecisionEngine(
    _input: ConnectScalingDecisionEngineInput,
    config: ScalingDecisionEngineConfiguration,
  ): SdeRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    if (configValidation.decision === "fail") {
      return this.failReport("connect", configValidation.errors, Date.now() - started);
    }

    const framework = this.registerWithFramework(config);
    const presence = this.dependencyPresence();
    const corePresent = presence.autonomousScalingFramework;
    const connectedCount = Object.values(presence).filter(Boolean).length;

    this.engineRecord = {
      engineRecordId: `sde-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: SCALING_DECISION_ENGINE_ID,
      engineVersion: "PILLOW-SDE-001",
      currentOperationalState: "connected",
      healthStatus: corePresent
        ? connectedCount >= 2
          ? "healthy"
          : "degraded"
        : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...SDE_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: SDE_METADATA_VERSION,
    };

    appendSdeLog({
      event: "engine_connected",
      level: "info",
      details:
        "Scaling Decision Engine connected — never approve scaling without validation; structural signals only",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...Object.entries(presence)
        .filter(([, ok]) => !ok)
        .map(([key]) => `${key} unavailable`),
      "Never approve scaling without validation",
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

  private runDecisionOp(
    action: SdeRunReport["action"],
    label: string,
    input: ScalingDecisionInput,
    config: ScalingDecisionEngineConfiguration,
    produce: () => ScalingDecisionRecord,
    logEvent: string,
  ): SdeRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateDecision(label, input, config);
      if (validation.decision === "fail") {
        return this.failReport(action, validation.errors, Date.now() - started);
      }

      const record = produce();
      this.storeRecord(record);
      engineRecord.currentOperationalState = "active";
      engineRecord.timestamp = new Date().toISOString();

      appendSdeLog({
        event: logEvent,
        level: "info",
        details: `${label} · ${record.productReference} · decision=${record.decision} · confidence=${record.scalingConfidence}`,
      });

      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord,
        decisionRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendSdeLog({ event: "decision_failure", level: "error", details: message });
      return this.failReport(action, [message], Date.now() - started);
    }
  }

  evaluateCandidate(
    input: ScalingDecisionInput,
    config: ScalingDecisionEngineConfiguration,
  ): SdeRunReport {
    return this.runDecisionOp(
      "evaluate_candidate",
      "Scaling candidate evaluation",
      input,
      config,
      () => this.evaluationEngine.evaluate(input, config),
      "scaling_evaluation",
    );
  }

  assessReadiness(
    input: ScalingDecisionInput,
    config: ScalingDecisionEngineConfiguration,
  ): SdeRunReport {
    if (!config.readinessAssessmentEnabled) {
      return this.failReport("assess_readiness", ["Readiness assessment disabled"], 0);
    }
    return this.runDecisionOp(
      "assess_readiness",
      "Readiness assessment",
      input,
      config,
      () => this.readinessEngine.assess(input, config),
      "readiness_assessment",
    );
  }

  assessRisk(
    input: ScalingDecisionInput,
    config: ScalingDecisionEngineConfiguration,
  ): SdeRunReport {
    if (!config.riskAssessmentEnabled) {
      return this.failReport("assess_risk", ["Risk assessment disabled"], 0);
    }
    return this.runDecisionOp(
      "assess_risk",
      "Risk assessment",
      input,
      config,
      () => this.riskEngine.assess(input, config),
      "risk_assessment",
    );
  }

  decideScale(
    input: ScalingDecisionInput,
    config: ScalingDecisionEngineConfiguration,
  ): SdeRunReport {
    if (!config.decisionRulesEnabled) {
      return this.failReport("decide_scale", ["Decision rules disabled"], 0);
    }
    return this.runDecisionOp(
      "decide_scale",
      "Scale/hold/reject decision",
      input,
      config,
      () => this.decisionEngine.decide(input, config),
      "decision_generation",
    );
  }

  rankPriorities(
    input: ScalingDecisionInput,
    config: ScalingDecisionEngineConfiguration,
  ): SdeRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      if (!config.rankingRulesEnabled) {
        return this.failReport("rank_priorities", ["Ranking rules disabled"], Date.now() - started);
      }
      const validation = this.validator.validateDecision("Priority ranking", input, config);
      if (validation.decision === "fail") {
        return this.failReport("rank_priorities", validation.errors, Date.now() - started);
      }

      if (this.decisionRecords.length === 0) {
        this.storeRecord(this.decisionEngine.decide(input, config));
      }

      const ranked = [...this.decisionRecords]
        .sort((a, b) => b.scalingConfidence - a.scalingConfidence)
        .map((record, index) =>
          buildDecisionRecord(
            {
              companyReference: record.companyReference,
              productReference: record.productReference,
              productReadiness: record.productReadiness,
              operationalReadiness: record.operationalReadiness,
              financialReadiness: record.financialReadiness,
              supplierReadiness: record.supplierReadiness,
              marketReadiness: record.marketReadiness,
              readinessScore: record.readinessScore,
              riskScore: record.riskScore,
              scalingConfidence: record.scalingConfidence,
              decision: record.decision,
            },
            index + 1,
            `Priority #${index + 1} · ${record.decision} · confidence=${record.scalingConfidence}`,
          ),
        );
      this.decisionRecords = ranked;
      engineRecord.currentOperationalState = "active";

      appendSdeLog({
        event: "ranking",
        level: "info",
        details: `Ranked ${ranked.length} scaling priorities by confidence`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "rank_priorities",
        engineRecord,
        decisionRecords: ranked,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendSdeLog({ event: "decision_failure", level: "error", details: message });
      return this.failReport("rank_priorities", [message], Date.now() - started);
    }
  }

  generateRecommendations(
    input: ScalingDecisionInput,
    config: ScalingDecisionEngineConfiguration,
  ): SdeRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateDecision(
        "Recommendation generation",
        input,
        config,
      );
      if (validation.decision === "fail") {
        return this.failReport(
          "generate_recommendations",
          validation.errors,
          Date.now() - started,
        );
      }

      this.recommendations = this.recommendationEngine.generate(this.decisionRecords);
      engineRecord.currentOperationalState = "active";

      appendSdeLog({
        event: "recommendation_generation",
        level: "info",
        details: `Generated ${this.recommendations.length} scaling recommendations`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "generate_recommendations",
        engineRecord,
        decisionRecords: this.decisionRecords,
        recommendations: this.recommendations,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendSdeLog({ event: "decision_failure", level: "error", details: message });
      return this.failReport("generate_recommendations", [message], Date.now() - started);
    }
  }

  runDiagnostics(
    _input: RunSdeDiagnosticsInput,
    config: ScalingDecisionEngineConfiguration,
  ): SdeRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: `sde-eng-diag-${Date.now()}`,
        timestamp: new Date().toISOString(),
        engineId: SCALING_DECISION_ENGINE_ID,
        engineVersion: "PILLOW-SDE-001",
        currentOperationalState: "connected",
        healthStatus: "healthy",
        validationStatus: "passed",
        supportedCapabilities: [...SDE_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: SDE_METADATA_VERSION,
      } satisfies ScalingDecisionEngineRecord);

    appendSdeLog({
      event: "diagnostics",
      level: "info",
      details: `Diagnostics · decisions=${this.decisionRecords.length} · scale=${this.scaleCount()} · hold=${this.holdCount()} · reject=${this.rejectCount()}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "diagnostics",
      engineRecord,
      decisionRecords: this.decisionRecords,
      recommendations: this.recommendations,
      validation: configValidation,
      durationMs: Date.now() - started,
    });
  }
}
