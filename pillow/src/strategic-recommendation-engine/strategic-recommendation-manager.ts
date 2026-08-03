import type { StrategicRecommendationEngineConfiguration } from "./configuration.js";
import { appendRecLog } from "./rec-logging.js";
import { EmpireStateAnalyzer } from "./empire-state-analyzer.js";
import { RecommendationGenerator } from "./recommendation-generator.js";
import { RecommendationRanker } from "./recommendation-ranker.js";
import {
  HealthMonitor,
  RecommendationMetadataGenerator,
  RecommendationValidator,
  RecoveryManager,
} from "./recommendation-validator.js";
import {
  REC_CAPABILITIES,
  REC_METADATA_VERSION,
  STRATEGIC_RECOMMENDATION_ENGINE_ID,
} from "./paths.js";
import type {
  EmpireStateAnalysis,
  OperationalState,
  RecommendationPackage,
  StrategicRecommendationEngineRecord,
  StrategicRecommendationInput,
  StrategicRecommendationRunReport,
} from "./types.js";

export class StrategicRecommendationManager {
  private engineRecord: StrategicRecommendationEngineRecord | null = null;
  private recommendations: RecommendationPackage[] = [];
  private latestAnalysis: EmpireStateAnalysis | null = null;
  private readonly analyzer = new EmpireStateAnalyzer();
  private readonly generator = new RecommendationGenerator();
  private readonly ranker = new RecommendationRanker();
  private readonly validator = new RecommendationValidator();
  private readonly metadata = new RecommendationMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
        }
      : null;
  }

  getRecommendations() {
    return this.recommendations.map((r) => this.clone(r));
  }

  getLatestRecommendations() {
    return this.getRecommendations();
  }

  getLatestAnalysis() {
    return this.latestAnalysis
      ? {
          ...this.latestAnalysis,
          dimensions: this.latestAnalysis.dimensions.map((d) => ({
            ...d,
            findings: [...d.findings],
          })),
          opportunitiesDetected: [...this.latestAnalysis.opportunitiesDetected],
          risksDetected: [...this.latestAnalysis.risksDetected],
          bottlenecksDetected: [...this.latestAnalysis.bottlenecksDetected],
        }
      : null;
  }

  connect(
    _input: Record<string, unknown>,
    config: StrategicRecommendationEngineConfiguration,
  ): StrategicRecommendationRunReport {
    const started = Date.now();
    this.ensureRecord("connected", config);
    appendRecLog({ event: "connect", details: "Strategic Recommendation Engine connected; recommend-only mode" });
    return this.report("connect", null, [], {
      validationReportId: `rec-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: config.enabled ? "pass" : "fail",
      errors: config.enabled ? [] : ["Strategic Recommendation Engine is disabled"],
      warnings: [],
      durationMs: Date.now() - started,
      metadataVersion: REC_METADATA_VERSION,
    }, started);
  }

  analyseState(
    input: StrategicRecommendationInput,
    config: StrategicRecommendationEngineConfiguration,
  ): StrategicRecommendationRunReport {
    return this.produce("analyse_state", input, config);
  }

  generateRecommendations(
    input: StrategicRecommendationInput,
    config: StrategicRecommendationEngineConfiguration,
  ): StrategicRecommendationRunReport {
    return this.produce("generate_recommendations", input, config);
  }

  rankRecommendations(
    input: StrategicRecommendationInput,
    config: StrategicRecommendationEngineConfiguration,
  ): StrategicRecommendationRunReport {
    return this.produce("rank_recommendations", input, config);
  }

  producePackages(
    input: StrategicRecommendationInput,
    config: StrategicRecommendationEngineConfiguration,
  ): StrategicRecommendationRunReport {
    return this.produce("produce_packages", input, config);
  }

  validateRecommendations(
    input: StrategicRecommendationInput,
    config: StrategicRecommendationEngineConfiguration,
  ): StrategicRecommendationRunReport {
    const started = Date.now();
    this.ensureRecord("active", config);
    const validation = this.validator.validatePackages(
      this.recommendations,
      Object.keys(input).length
        ? input
        : {
            validated: true,
            empireStateHints: this.latestAnalysis ? ["prior analysis available"] : [],
          },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    appendRecLog({ event: "validate_recommendations", details: `decision=${validation.decision}` });
    return this.report(
      "validate_recommendations",
      this.getLatestAnalysis(),
      this.getRecommendations(),
      validation,
      started,
    );
  }

  diagnostics(config: StrategicRecommendationEngineConfiguration): StrategicRecommendationRunReport {
    const started = Date.now();
    this.ensureRecord("active", config);
    const validation = this.recommendations.length
      ? this.validator.validatePackages(this.recommendations, { validated: true, empireStateHints: ["diagnostics"] }, started)
      : {
          validationReportId: `rec-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: config.enabled ? ("pass" as const) : ("fail" as const),
          errors: config.enabled ? [] : ["Strategic Recommendation Engine is disabled"],
          warnings: [] as string[],
          durationMs: Date.now() - started,
          metadataVersion: REC_METADATA_VERSION,
        };
    appendRecLog({
      event: "health_information",
      details: `recommendations=${this.recommendations.length}; health=${this.healthMonitor.status(validation.decision, config.enabled)}`,
    });
    return this.report(
      "diagnostics",
      this.getLatestAnalysis(),
      this.getRecommendations().slice(0, 20),
      validation,
      started,
    );
  }

  private produce(
    action: StrategicRecommendationRunReport["action"],
    input: StrategicRecommendationInput,
    config: StrategicRecommendationEngineConfiguration,
  ): StrategicRecommendationRunReport {
    const started = Date.now();
    this.ensureRecord("active", config);
    appendRecLog({
      event: "analyse_empire_state",
      details: `action=${action}; signalKeys=${Object.keys(input).length}`,
    });

    const decision = this.validator.decide(input);
    if (
      decision === "fail" ||
      !config.enabled ||
      !config.analysisRulesEnabled ||
      !config.generationRulesEnabled
    ) {
      if (decision === "fail") this.recovery.recordFailure();
      const validation = this.validator.validatePackages(null, input, started);
      appendRecLog({
        event: "validation_failure",
        details: `action=${action}; errors=${validation.errors.join("|")}`,
      });
      return this.report(action, null, [], validation, started);
    }

    const analysis = this.analyzer.analyse(input);
    this.latestAnalysis = analysis;
    appendRecLog({
      event: "analyse_complete",
      details: `analysisId=${analysis.analysisId}; health=${analysis.overallHealthScore}`,
    });

    const status = decision === "partial" ? "partial" : "passed";
    let packages = this.generator.generate(input, analysis, config, status);
    if (config.rankingRulesEnabled) {
      packages = this.ranker.rank(packages);
    }
    this.recommendations = packages;
    this.ensureRecord("active", config);

    const validation = this.validator.validatePackages(packages, input, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();

    appendRecLog({
      event: "produce_recommendation_packages",
      details: `count=${packages.length}; top=${packages[0]?.recommendationId ?? "none"}; executed=false`,
    });
    this.metadata.generate(this.recommendations.length, analysis.analysisId);
    return this.report(action, analysis, packages, validation, started);
  }

  private ensureRecord(
    state: OperationalState,
    config: StrategicRecommendationEngineConfiguration,
  ) {
    const latest = this.recommendations[0]?.validationStatus ?? "pending";
    const mapped =
      latest === "passed" ? "passed" : latest === "partial" ? "partial" : latest === "failed" ? "failed" : "pending";
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `rec-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: STRATEGIC_RECOMMENDATION_ENGINE_ID,
      engineVersion: "PILLOW-REC-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        mapped === "passed" ? "pass" : mapped === "partial" ? "partial" : mapped === "failed" ? "fail" : null,
        config.enabled,
      ),
      validationStatus: mapped,
      supportedCapabilities: [...REC_CAPABILITIES],
      totalRecommendations: this.recommendations.length,
      lastAnalysisId: this.latestAnalysis?.analysisId ?? null,
      metadataVersion: REC_METADATA_VERSION,
    };
  }

  private report(
    action: StrategicRecommendationRunReport["action"],
    analysis: EmpireStateAnalysis | null,
    recommendations: RecommendationPackage[],
    validation: StrategicRecommendationRunReport["validation"],
    started: number,
  ): StrategicRecommendationRunReport {
    return {
      recommendationRunReportId: `rec-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord: this.getEngineRecord()!,
      analysis: analysis
        ? {
            ...analysis,
            dimensions: analysis.dimensions.map((d) => ({ ...d, findings: [...d.findings] })),
            opportunitiesDetected: [...analysis.opportunitiesDetected],
            risksDetected: [...analysis.risksDetected],
            bottlenecksDetected: [...analysis.bottlenecksDetected],
          }
        : null,
      recommendations: recommendations.map((r) => this.clone(r)),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: REC_METADATA_VERSION,
    };
  }

  private clone(pkg: RecommendationPackage): RecommendationPackage {
    return {
      ...pkg,
      riskAssessment: [...pkg.riskAssessment],
      supportingEvidence: [...pkg.supportingEvidence],
      dependencies: [...pkg.dependencies],
    };
  }
}
