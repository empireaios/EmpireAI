import type { DecisionEngineConfiguration } from "./configuration.js";
import { appendDeLog } from "./de-logging.js";
import {
  DecisionMetadataGenerator,
  DecisionValidator,
  HealthMonitor,
  RecoveryManager,
} from "./decision-validator.js";
import { OptionEvaluator } from "./option-evaluator.js";
import { OptionGenerator } from "./option-generator.js";
import {
  DE_CAPABILITIES,
  DE_METADATA_VERSION,
  DECISION_ENGINE_ID,
} from "./paths.js";
import type {
  DecisionEngineEngineRecord,
  DecisionEngineInput,
  DecisionEngineRunReport,
  DecisionPackage,
  OperationalState,
} from "./types.js";

export class DecisionEngineManager {
  private engineRecord: DecisionEngineEngineRecord | null = null;
  private packages: DecisionPackage[] = [];
  private readonly generator = new OptionGenerator();
  private readonly evaluator = new OptionEvaluator();
  private readonly validator = new DecisionValidator();
  private readonly metadata = new DecisionMetadataGenerator();
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

  getPackages() {
    return this.packages.map((pkg) => this.clonePackage(pkg));
  }

  getLatestPackage() {
    const packages = this.getPackages();
    return packages[packages.length - 1] ?? null;
  }

  connect(_input: Record<string, unknown>, config: DecisionEngineConfiguration): DecisionEngineRunReport {
    const started = Date.now();
    this.ensureRecord("connected", config);
    appendDeLog({ event: "connect", details: "Decision Engine connected; evaluation-only mode" });
    return this.report("connect", [], {
      validationReportId: `de-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: config.enabled ? "pass" : "fail",
      errors: config.enabled ? [] : ["Decision Engine is disabled"],
      warnings: [],
      durationMs: Date.now() - started,
      metadataVersion: DE_METADATA_VERSION,
    }, started);
  }

  submitProblem(input: DecisionEngineInput, config: DecisionEngineConfiguration): DecisionEngineRunReport {
    return this.produce("submit_problem", input, config);
  }

  generateOptions(input: DecisionEngineInput, config: DecisionEngineConfiguration): DecisionEngineRunReport {
    return this.produce("generate_options", input, config);
  }

  evaluateOptions(input: DecisionEngineInput, config: DecisionEngineConfiguration): DecisionEngineRunReport {
    return this.produce("evaluate_options", input, config);
  }

  produceDecisionPackage(input: DecisionEngineInput, config: DecisionEngineConfiguration): DecisionEngineRunReport {
    return this.produce("produce_decision_package", input, config);
  }

  validateDecision(input: DecisionEngineInput, config: DecisionEngineConfiguration): DecisionEngineRunReport {
    const latest = this.packages[this.packages.length - 1] ?? null;
    const started = Date.now();
    this.ensureRecord("active", config);
    const validation = this.validator.validatePackage(
      latest,
      input.executiveObjective
        ? input
        : { ...input, executiveObjective: latest?.executiveObjective ?? "" },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    appendDeLog({ event: "validate_decision", details: `decision=${validation.decision}` });
    return this.report("validate_decision", latest ? [latest] : [], validation, started);
  }

  diagnostics(config: DecisionEngineConfiguration): DecisionEngineRunReport {
    const started = Date.now();
    this.ensureRecord("active", config);
    const latest = this.packages[this.packages.length - 1] ?? null;
    const validation = latest
      ? this.validator.validatePackage(
          latest,
          { executiveObjective: latest.executiveObjective, validated: true },
          started,
        )
      : {
          validationReportId: `de-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: config.enabled ? ("pass" as const) : ("fail" as const),
          errors: config.enabled ? [] : ["Decision Engine is disabled"],
          warnings: [] as string[],
          durationMs: Date.now() - started,
          metadataVersion: DE_METADATA_VERSION,
        };
    appendDeLog({
      event: "health_information",
      details: `decisions=${this.packages.length}; health=${this.healthMonitor.status(validation.decision, config.enabled)}`,
    });
    return this.report("diagnostics", latest ? [latest] : [], validation, started);
  }

  private produce(
    action: DecisionEngineRunReport["action"],
    input: DecisionEngineInput,
    config: DecisionEngineConfiguration,
  ): DecisionEngineRunReport {
    const started = Date.now();
    this.ensureRecord("active", config);
    appendDeLog({
      event: "accept_executive_problem",
      details: `action=${action}; objectiveLength=${input.executiveObjective?.length ?? 0}`,
    });

    const decision = this.validator.decide(input);
    if (decision === "fail" || !config.enabled || !config.evaluationRulesEnabled) {
      if (decision === "fail") this.recovery.recordFailure();
      const validation = this.validator.validatePackage(null, input, started);
      appendDeLog({ event: "validation_failure", details: `action=${action}; errors=${validation.errors.join("|")}` });
      return this.report(action, [], validation, started);
    }

    const options = this.generator.generate(input, config);
    appendDeLog({
      event: "generate_candidate_options",
      details: `count=${options.length}; approaches=${options.map((o) => o.approach).join(",")}`,
    });

    const status = decision === "partial" ? "partial" : "passed";
    const pkg = this.evaluator.evaluate(input, options, config, status);
    this.packages.push(pkg);
    this.ensureRecord("active", config);
    const validation = this.validator.validatePackage(pkg, input, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();

    appendDeLog({
      event: "produce_decision_package",
      details: `decisionId=${pkg.decisionId}; recommended=${pkg.recommendedOption.optionId}; confidence=${pkg.confidenceScore}; workExecuted=false`,
    });
    this.metadata.generate(this.packages.length);
    return this.report(action, [pkg], validation, started);
  }

  private ensureRecord(state: OperationalState, config: DecisionEngineConfiguration) {
    const decision = this.packages[this.packages.length - 1]?.validationStatus ?? "pending";
    const mapped =
      decision === "passed" ? "passed" : decision === "partial" ? "partial" : decision === "failed" ? "failed" : "pending";
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `de-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: DECISION_ENGINE_ID,
      engineVersion: "PILLOW-DE-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        mapped === "passed" ? "pass" : mapped === "partial" ? "partial" : mapped === "failed" ? "fail" : null,
        config.enabled,
      ),
      validationStatus: mapped,
      supportedCapabilities: [...DE_CAPABILITIES],
      totalDecisions: this.packages.length,
      metadataVersion: DE_METADATA_VERSION,
    };
  }

  private report(
    action: DecisionEngineRunReport["action"],
    packages: DecisionPackage[],
    validation: DecisionEngineRunReport["validation"],
    started: number,
  ): DecisionEngineRunReport {
    return {
      decisionRunReportId: `de-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord: this.getEngineRecord()!,
      packages: packages.map((pkg) => this.clonePackage(pkg)),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: DE_METADATA_VERSION,
    };
  }

  private clonePackage(pkg: DecisionPackage): DecisionPackage {
    return {
      ...pkg,
      candidateOptions: pkg.candidateOptions.map((o) => ({ ...o, tags: [...o.tags] })),
      evaluationMatrix: pkg.evaluationMatrix.map((row) => ({
        ...row,
        scores: row.scores.map((s) => ({ ...s })),
      })),
      tradeOffAnalysis: {
        ...pkg.tradeOffAnalysis,
        comparisons: pkg.tradeOffAnalysis.comparisons.map((c) => ({ ...c })),
        dominantTradeOffs: [...pkg.tradeOffAnalysis.dominantTradeOffs],
      },
      recommendedOption: { ...pkg.recommendedOption },
      riskAssessment: [...pkg.riskAssessment],
      assumptions: [...pkg.assumptions],
      missingInformation: [...pkg.missingInformation],
      supportingEvidence: [...pkg.supportingEvidence],
    };
  }
}
