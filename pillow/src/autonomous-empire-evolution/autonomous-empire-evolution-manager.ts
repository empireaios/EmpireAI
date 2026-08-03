import type { CivilizationKnowledgeEngine } from "../civilization-knowledge-engine/engine.js";
import type { EmpireIntelligenceFrameworkEngine } from "../empire-intelligence-framework/engine.js";
import type { EmpireSelfImprovementEngine } from "../empire-self-improvement-engine/engine.js";
import type { AutonomousEmpireEvolutionConfiguration } from "./configuration.js";
import { logEvolutionEvent } from "./aee-logging.js";
import {
  BusinessModelEvolutionEngine,
  EvolutionMetadataGenerator,
  EvolutionRecommendationEngine,
  EvolutionSimulationEngine,
  EvolutionValidator,
  HealthMonitor,
  RecoveryManager,
  StructureEvaluationEngine,
  WorkflowEvolutionEngine,
} from "./evolution-components.js";
import { AEE_CAPABILITIES, AEE_METADATA_VERSION, AUTONOMOUS_EMPIRE_EVOLUTION_ID } from "./paths.js";
import { toStructuralTargetComponent } from "./structural-signals.js";
import type {
  AutonomousEmpireEvolutionEngineRecord,
  AutonomousEmpireEvolutionInput,
  AutonomousEmpireEvolutionRunReport,
  EvolutionRecommendation,
  EvolutionRecord,
  EvolutionValidationReport,
} from "./types.js";

export type AutonomousEmpireEvolutionDependencies = {
  empireIntelligenceFramework?: EmpireIntelligenceFrameworkEngine | null;
  empireSelfImprovementEngine?: EmpireSelfImprovementEngine | null;
  civilizationKnowledgeEngine?: CivilizationKnowledgeEngine | null;
};

export class AutonomousEmpireEvolutionManager {
  private engineRecord: AutonomousEmpireEvolutionEngineRecord | null = null;
  private records: EvolutionRecord[] = [];
  private recommendations: EvolutionRecommendation[] = [];
  private readonly structure = new StructureEvaluationEngine();
  private readonly workflow = new WorkflowEvolutionEngine();
  private readonly businessModel = new BusinessModelEvolutionEngine();
  private readonly simulation = new EvolutionSimulationEngine();
  private readonly recommendationEngine = new EvolutionRecommendationEngine();
  private readonly metadata = new EvolutionMetadataGenerator();
  private readonly validator = new EvolutionValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  constructor(private readonly dependencies: AutonomousEmpireEvolutionDependencies = {}) {}

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          dependencyPresence: { ...this.engineRecord.dependencyPresence },
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
        }
      : null;
  }

  getEvolutionRecords() {
    return this.records.map((r) => ({ ...r }));
  }

  getRecommendations() {
    return this.recommendations.map((r) => ({ ...r }));
  }

  private validation(input: AutonomousEmpireEvolutionInput): EvolutionValidationReport {
    const decision = this.validator.decide(input);
    logEvolutionEvent("validation_results");
    return {
      validationReportId: `aee-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors:
        decision === "fail"
          ? ["Governance-approved enterprise architecture cannot be modified automatically; constitutional governance cannot be bypassed."]
          : [],
      warnings:
        decision === "partial"
          ? ["Structural evolution signal is not independently validated; architecture remains unmodified automatically."]
          : [],
      durationMs: 0,
      metadataVersion: this.metadata.version(),
    };
  }

  private report(action: string, records: EvolutionRecord[], validation: EvolutionValidationReport): AutonomousEmpireEvolutionRunReport {
    return {
      evolutionRunReportId: `aee-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord: this.engineRecord!,
      evolutionRecords: records,
      recommendations: this.getRecommendations(),
      validation,
      durationMs: 0,
      metadataVersion: AEE_METADATA_VERSION,
    };
  }

  connect(_input: Record<string, unknown>, _config: AutonomousEmpireEvolutionConfiguration): AutonomousEmpireEvolutionRunReport {
    const framework = this.dependencies.empireIntelligenceFramework;
    let frameworkModuleId: string | null = null;
    if (framework) {
      const registration = framework.registerEmpireIntelligenceModule({
        definition: {
          intelligenceModuleIdentifier: AUTONOMOUS_EMPIRE_EVOLUTION_ID,
          moduleVersion: "PILLOW-AEE-001",
          moduleType: "intelligence",
          supportedCapabilities: ["health_monitoring"],
        },
        forceRegister: true,
      });
      frameworkModuleId = registration.records[0]?.frameworkId ?? null;
      if (registration.validation.decision !== "fail") {
        framework.manageEnterpriseIntelligenceLifecycle(AUTONOMOUS_EMPIRE_EVOLUTION_ID, "start");
      }
    }
    this.engineRecord = {
      engineRecordId: `aee-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: AUTONOMOUS_EMPIRE_EVOLUTION_ID,
      engineVersion: "PILLOW-AEE-001",
      currentOperationalState: "connected",
      healthStatus: this.healthMonitor.health(Boolean(framework)),
      validationStatus: framework ? "passed" : "partial",
      supportedCapabilities: [...AEE_CAPABILITIES],
      frameworkModuleId,
      dependencyPresence: {
        empireIntelligenceFramework: Boolean(framework),
        empireSelfImprovementEngine: Boolean(this.dependencies.empireSelfImprovementEngine),
        civilizationKnowledgeEngine: Boolean(this.dependencies.civilizationKnowledgeEngine),
      },
      metadataVersion: AEE_METADATA_VERSION,
    };
    logEvolutionEvent("evolution_connect");
    return this.report("connect", [], this.validation({ validated: Boolean(framework) }));
  }

  run(action: string, input: AutonomousEmpireEvolutionInput, config: AutonomousEmpireEvolutionConfiguration): AutonomousEmpireEvolutionRunReport {
    if (!this.engineRecord) {
      throw new Error("Autonomous Empire Evolution not connected — call connectAutonomousEmpireEvolution first");
    }

    if (action === "recommend" || action === "generate_evolution_recommendations") {
      this.recommendations = this.records
        .filter((r) => r.priorityScore >= config.priorityThreshold)
        .sort((a, b) => b.priorityScore - a.priorityScore)
        .map((r) => ({
          recommendationId: `aee-rec-${r.evolutionId}`,
          timestamp: new Date().toISOString(),
          evolutionId: r.evolutionId,
          recommendationSummary: r.recommendationSummary,
          priorityScore: r.priorityScore,
          structuralSignalOnly: true,
          neverModifyGovernanceApprovedEnterpriseArchitectureAutomatically: true,
          neverBypassConstitutionalGovernance: true,
          approvedForArchitectureModification: false,
        }));
      logEvolutionEvent("recommendation_generation");
      return this.report(action, [], this.validation({ validated: true }));
    }

    const target = toStructuralTargetComponent(input.targetComponent);
    const category = this.structure.resolveCategory(action, input);
    const currentState = this.structure.currentState(input);
    const proposedState = this.workflow.proposedState(input, category);
    const expectedImprovement = this.businessModel.expectedImprovement(input);
    const priorityScore = this.simulation.priorityScore(input, expectedImprovement);
    const validation = this.validation(input);

    const record: EvolutionRecord = {
      evolutionId: `aee-${Date.now()}-${this.records.length}`,
      timestamp: new Date().toISOString(),
      evolutionCategory: category,
      targetComponent: target,
      currentState,
      proposedState,
      expectedImprovement,
      priorityScore,
      recommendationSummary: this.recommendationEngine.summarize(input, target, category),
      validationStatus: validation.decision === "pass" ? "passed" : validation.decision === "fail" ? "failed" : "partial",
      metadataVersion: this.metadata.version(),
      structuralSignalOnly: true,
      neverExposeCredentials: true,
      neverExposeAuthenticationTokens: true,
      neverModifyGovernanceApprovedEnterpriseArchitectureAutomatically: true,
      neverBypassConstitutionalGovernance: true,
      approvedForArchitectureModification: false,
      preserveEvolutionTraceability: true,
      preserveAuditability: true,
      preserveEnterpriseIntegrity: true,
      evolutionTraceId: this.metadata.traceId(this.records.length),
      maskSensitiveValues: true,
    };

    this.records.push(record);
    this.engineRecord.currentOperationalState = "active";
    this.engineRecord.timestamp = record.timestamp;
    this.engineRecord.healthStatus = this.healthMonitor.health(config.enabled);

    if (validation.decision === "fail") {
      logEvolutionEvent("evolution_failures");
      this.recovery.attempt();
    }

    if (action.includes("simulat")) logEvolutionEvent("simulation_execution");
    else if (action.includes("evaluat") || action.includes("detect")) logEvolutionEvent("evolution_evaluation");
    else logEvolutionEvent(action);

    return this.report(action, [record], validation);
  }

  diagnostics(config: AutonomousEmpireEvolutionConfiguration) {
    if (!this.engineRecord) return this.connect({}, config);
    const validation: EvolutionValidationReport = {
      ...this.validation({ validated: config.enabled }),
      decision: config.enabled ? "pass" : "fail",
      errors: config.enabled ? [] : ["Engine disabled"],
    };
    logEvolutionEvent("health_information");
    return this.report("diagnostics", this.records, validation);
  }
}
