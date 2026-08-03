import { AEE_METADATA_VERSION } from "./paths.js";
import type { AutonomousEmpireEvolutionInput } from "./types.js";

export class StructureEvaluationEngine {
  resolveCategory(action: string, input: AutonomousEmpireEvolutionInput): string {
    return input.evolutionCategory?.trim() || action.replaceAll("_", " ");
  }
  currentState(input: AutonomousEmpireEvolutionInput): string {
    return input.currentState?.trim() || "baseline structural state";
  }
}

export class WorkflowEvolutionEngine {
  proposedState(input: AutonomousEmpireEvolutionInput, category: string): string {
    return input.proposedState?.trim() || `evolved ${category}`;
  }
}

export class BusinessModelEvolutionEngine {
  expectedImprovement(input: AutonomousEmpireEvolutionInput): number {
    return Math.max(0, Math.min(100, input.expectedImprovement ?? 15));
  }
}

export class EvolutionSimulationEngine {
  priorityScore(input: AutonomousEmpireEvolutionInput, expectedImprovement: number): number {
    if (typeof input.priorityScore === "number") return Math.max(0, Math.min(100, input.priorityScore));
    return Math.max(0, Math.min(100, Math.round(expectedImprovement * 2.5)));
  }
}

export class EvolutionRecommendationEngine {
  summarize(input: AutonomousEmpireEvolutionInput, target: string, category: string): string {
    return input.recommendationSummary?.trim() || `Review empire evolution for ${target} (${category})`;
  }
}

export class EvolutionMetadataGenerator {
  version() {
    return AEE_METADATA_VERSION;
  }
  traceId(index: number) {
    return `aee-trace-${Date.now()}-${index}`;
  }
}

export class EvolutionValidator {
  decide(input: AutonomousEmpireEvolutionInput): "pass" | "partial" | "fail" {
    if (input.bypassConstitutionalGovernance === true) return "fail";
    if (input.approvedForArchitectureModification === true) return "fail";
    if (input.validated === true) return "pass";
    return "partial";
  }
}

export class HealthMonitor {
  health(enabled: boolean) {
    return enabled ? ("healthy" as const) : ("failed" as const);
  }
}

export class RecoveryManager {
  readonly automaticRecoveryEnabled = true as const;
  private attempts = 0;
  attempt() {
    this.attempts += 1;
    return { recovered: true as const, attempt: this.attempts };
  }
  getAttempts() {
    return this.attempts;
  }
}
