/**
 * G6-09 — Production simulation validators.
 */

import type {
  ProductionSimulationResult,
  ProductionSimulationResultState,
  SimulationBlocker,
  SimulationEvidence,
  SimulationRisk,
  SimulationStep,
} from "../contracts/production-simulation-types.js";
import { isSimulationTypeSafe } from "../contracts/production-simulation-types.js";
import type { ProductionSimulationScenario } from "../registry/simulation-scenario-registry-resolver.js";
import { resolveSimulationSignals } from "../registry/simulation-safety-signal-resolver.js";
import type { ProductionSimulationType } from "../contracts/production-simulation-types.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import { getRegistryLoader } from "../../../../registry/registry-loader.js";
import { randomUUID } from "node:crypto";

function toBlocker(
  scenario: ProductionSimulationScenario,
  message: string,
  severity: SimulationBlocker["severity"],
  suffix: string,
): SimulationBlocker {
  return {
    blockerId: `sim-${suffix}-${scenario.scenarioId}`,
    scenarioId: scenario.scenarioId,
    scenarioKind: scenario.scenarioKind,
    simulationDomain: scenario.simulationDomain,
    severity,
    message,
    recommendation: `Resolve simulation for ${scenario.simulationDomain}`,
  };
}

const BLOCKER_HANDLERS: Record<string, (scenario: ProductionSimulationScenario) => SimulationBlocker | undefined> = {
  unsafe_live_execution: (scenario) =>
    process.env.SIM_UNSAFE_LIVE_EXECUTION === "true"
      ? toBlocker(scenario, "Unsafe live execution attempted", "critical", "unsafe")
      : undefined,
  missing_scenario: (scenario) =>
    process.env.SIM_MISSING_SCENARIO === "true"
      ? toBlocker(scenario, "Missing simulation scenario", "critical", "missing")
      : undefined,
  blocked_sandbox: (scenario) =>
    process.env.SIM_BLOCKED_SANDBOX === "true"
      ? toBlocker(scenario, "Sandbox not eligible", "critical", "sandbox")
      : undefined,
  missing_evidence: (scenario) =>
    process.env.SIM_MISSING_EVIDENCE === "true"
      ? toBlocker(scenario, "Missing simulation evidence", "high", "evidence")
      : undefined,
  commerce_simulation_failed: (scenario) =>
    process.env.SIM_COMMERCE_UNSAFE === "true"
      ? toBlocker(scenario, "Commerce simulation unsafe", "critical", "commerce")
      : undefined,
  automation_simulation_failed: (scenario) =>
    process.env.SIM_AUTOMATION_UNSAFE === "true"
      ? toBlocker(scenario, "Automation simulation unsafe", "critical", "automation")
      : undefined,
  identity_simulation_failed: (scenario) =>
    process.env.SIM_IDENTITY_UNSAFE === "true"
      ? toBlocker(scenario, "Identity simulation unsafe", "critical", "identity")
      : undefined,
  cockpit_simulation_failed: (scenario) =>
    process.env.SIM_COCKPIT_UNSAFE === "true"
      ? toBlocker(scenario, "Cockpit simulation unsafe", "critical", "cockpit")
      : undefined,
  failure_simulation_failed: (scenario) =>
    process.env.SIM_FAILURE_SIM_FAILED === "true"
      ? toBlocker(scenario, "Failure simulation failed", "critical", "failure")
      : undefined,
  recovery_simulation_failed: (scenario) =>
    process.env.SIM_RECOVERY_SIM_FAILED === "true"
      ? toBlocker(scenario, "Recovery simulation failed", "critical", "recovery")
      : undefined,
  missing_mock_provider: (scenario) =>
    process.env.SIM_MISSING_MOCK_PROVIDER === "true"
      ? toBlocker(scenario, "Missing mock provider", "high", "mock")
      : undefined,
};

function deriveStepStatus(satisfied: boolean, hasBlocker: boolean): ProductionSimulationResultState {
  if (hasBlocker) return "fail";
  if (!satisfied) return "warning";
  return "pass";
}

export function runSimulationScenarioValidation(input: {
  scenario: ProductionSimulationScenario;
  context: RegistryLoaderContext;
  simulationType: ProductionSimulationType;
  correlationId: string;
  governanceState: string;
}): ProductionSimulationResult {
  const startedAt = new Date().toISOString();
  const { scenario, context, simulationType, correlationId, governanceState } = input;

  if (!isSimulationTypeSafe(simulationType)) {
    return {
      simulationId: randomUUID(),
      scenarioId: scenario.scenarioId,
      scope: scenario.simulationDomain,
      simulationType,
      status: "blocked",
      steps: [],
      evidence: [],
      blockers: [toBlocker(scenario, "Unsafe simulation type rejected", "critical", "type")],
      risks: [],
      recommendations: ["Use dry_run, sandbox, mocked, replay, synthetic, or safe_live_check only"],
      startedAt,
      completedAt: new Date().toISOString(),
      correlationId,
      governanceState,
    };
  }

  const signals = resolveSimulationSignals(scenario.safetySignals, context, scenario, simulationType);
  const blockers: SimulationBlocker[] = [];
  const warnings: SimulationBlocker[] = [];

  const missing = signals.filter((s) => !s.satisfied);
  if (missing.length > 0) {
    const finding = toBlocker(
      scenario,
      `Simulation failed for ${scenario.serviceId}: missing ${missing.map((s) => s.signalRef).join(", ")}`,
      missing.length === signals.length ? "critical" : "high",
      "signal",
    );
    if (finding.severity === "critical") blockers.push(finding);
    else warnings.push(finding);
  }

  if (scenario.registryRef) {
    try {
      const result = getRegistryLoader().resolve(
        context,
        scenario.registryRef as Parameters<ReturnType<typeof getRegistryLoader>["resolve"]>[1],
      );
      if (!result.meta.wired) {
        warnings.push(toBlocker(scenario, `Registry ${scenario.registryRef} not fully wired`, "medium", "registry"));
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      blockers.push(toBlocker(scenario, `Registry failure: ${reason}`, "critical", "registry-fail"));
    }
  }

  for (const condition of scenario.blockerConditions) {
    const finding = BLOCKER_HANDLERS[condition]?.(scenario);
    if (!finding) continue;
    if (finding.severity === "critical") blockers.push(finding);
    else warnings.push(finding);
  }

  const steps: SimulationStep[] = scenario.simulationStepRefs.map((stepRef) => ({
    stepId: `${scenario.scenarioId}:${stepRef}`,
    stepRef,
    status: deriveStepStatus(missing.length === 0, blockers.length > 0),
    summary: `Simulated step ${stepRef} via ${simulationType}`,
  }));

  const evidence: SimulationEvidence[] = [
    ...signals.map((signal) => ({
      evidenceId: `${scenario.scenarioId}:${signal.signalRef}`,
      kind: "signal" as const,
      summary: signal.summary,
      ref: signal.signalRef,
    })),
    ...steps.map((step) => ({
      evidenceId: step.stepId,
      kind: "step" as const,
      summary: step.summary,
      ref: step.stepRef,
    })),
  ];

  const status = deriveScenarioStatus({ blockers, warnings });
  const risks: SimulationRisk[] = [...blockers, ...warnings]
    .filter((f) => f.severity === "critical" || f.severity === "high")
    .map((finding) => ({
      riskId: `risk-${finding.blockerId}`,
      scenarioId: finding.scenarioId,
      simulationDomain: finding.simulationDomain,
      severity: finding.severity,
      summary: finding.message,
      mitigation: finding.recommendation,
    }));

  const recommendations: string[] = [];
  if (blockers.length === 0 && warnings.length === 0) {
    recommendations.push(`Scenario ${scenario.scenarioKind} simulated successfully via ${simulationType}`);
  } else if (blockers.length > 0) {
    recommendations.push(`Resolve blockers before live operation for ${scenario.simulationDomain}`);
  }

  return {
    simulationId: randomUUID(),
    scenarioId: scenario.scenarioId,
    scope: scenario.simulationDomain,
    simulationType,
    status,
    steps,
    evidence,
    blockers,
    risks,
    recommendations,
    startedAt,
    completedAt: new Date().toISOString(),
    correlationId,
    governanceState,
  };
}

function deriveScenarioStatus(input: {
  blockers: SimulationBlocker[];
  warnings: SimulationBlocker[];
}): ProductionSimulationResultState {
  if (input.blockers.some((b) => b.severity === "critical")) return "fail";
  if (input.blockers.length > 0) return "warning";
  if (input.warnings.some((w) => w.severity === "high")) return "warning";
  if (input.warnings.length > 0) return "pass_with_conditions";
  return "pass";
}

export function validateCommerceSimulation(
  scenarios: ProductionSimulationScenario[],
  context: RegistryLoaderContext,
  simulationType: ProductionSimulationType,
  correlationId: string,
  governanceState: string,
): ProductionSimulationResult[] {
  const kinds = new Set([
    "commerce_readiness", "marketplace_operation", "supplier_operation",
    "storefront_operation", "payment_flow", "logistics_flow",
  ]);
  return scenarios
    .filter((s) => kinds.has(s.scenarioKind))
    .map((scenario) => runSimulationScenarioValidation({ scenario, context, simulationType, correlationId, governanceState }));
}

export function validateAutomationSimulation(
  scenarios: ProductionSimulationScenario[],
  context: RegistryLoaderContext,
  simulationType: ProductionSimulationType,
  correlationId: string,
  governanceState: string,
): ProductionSimulationResult[] {
  return scenarios
    .filter((s) => s.scenarioKind === "automation_workflow" || s.scenarioKind === "approval_flow")
    .map((scenario) => runSimulationScenarioValidation({ scenario, context, simulationType, correlationId, governanceState }));
}

export function validateIdentitySimulation(
  scenarios: ProductionSimulationScenario[],
  context: RegistryLoaderContext,
  simulationType: ProductionSimulationType,
  correlationId: string,
  governanceState: string,
): ProductionSimulationResult[] {
  return scenarios
    .filter((s) => s.scenarioKind === "grand_king_login" || s.scenarioKind === "authorization_readiness")
    .map((scenario) => runSimulationScenarioValidation({ scenario, context, simulationType, correlationId, governanceState }));
}

export function validateCockpitSimulation(
  scenarios: ProductionSimulationScenario[],
  context: RegistryLoaderContext,
  simulationType: ProductionSimulationType,
  correlationId: string,
  governanceState: string,
): ProductionSimulationResult[] {
  return scenarios
    .filter((s) =>
      s.scenarioKind === "cockpit_access" ||
      s.scenarioKind === "executive_dashboard" ||
      s.scenarioKind === "executive_reporting",
    )
    .map((scenario) => runSimulationScenarioValidation({ scenario, context, simulationType, correlationId, governanceState }));
}

export function validateFailureSimulation(
  scenarios: ProductionSimulationScenario[],
  context: RegistryLoaderContext,
  simulationType: ProductionSimulationType,
  correlationId: string,
  governanceState: string,
): ProductionSimulationResult[] {
  return scenarios
    .filter((s) => s.scenarioKind === "incident_flow")
    .map((scenario) => runSimulationScenarioValidation({ scenario, context, simulationType, correlationId, governanceState }));
}

export function validateRecoverySimulation(
  scenarios: ProductionSimulationScenario[],
  context: RegistryLoaderContext,
  simulationType: ProductionSimulationType,
  correlationId: string,
  governanceState: string,
): ProductionSimulationResult[] {
  return scenarios
    .filter((s) => s.scenarioKind === "recovery_flow")
    .map((scenario) => runSimulationScenarioValidation({ scenario, context, simulationType, correlationId, governanceState }));
}

export function validateSimulationEvidence(simulations: ProductionSimulationResult[]): {
  evidence: SimulationEvidence[];
  blockers: SimulationBlocker[];
} {
  const evidence = simulations.flatMap((sim) => sim.evidence);
  const blockers = simulations.flatMap((sim) => sim.blockers);
  if (process.env.SIM_MISSING_EVIDENCE === "true") {
    blockers.push({
      blockerId: "sim-evidence-missing",
      scenarioId: "evidence-validator",
      scenarioKind: "evidence",
      simulationDomain: "evidence",
      severity: "high",
      message: "Simulation evidence incomplete",
    });
  }
  return { evidence, blockers };
}

export function analyseSimulationRisks(input: {
  blockers: SimulationBlocker[];
  warnings: SimulationBlocker[];
}): { riskRegister: SimulationRisk[]; executiveRecommendations: string[] } {
  const all = [...input.blockers, ...input.warnings];
  const riskRegister = all
    .filter((f) => f.severity === "critical" || f.severity === "high" || f.severity === "medium")
    .map((finding) => ({
      riskId: `risk-${finding.blockerId}`,
      scenarioId: finding.scenarioId,
      simulationDomain: finding.simulationDomain,
      severity: finding.severity,
      summary: finding.message,
      mitigation: finding.recommendation,
    }));

  const recommendations = new Set<string>();
  if (input.blockers.some((b) => b.message.includes("Unsafe live"))) {
    recommendations.add("Halt unsafe live execution — use sandbox or mocked simulation only");
  }
  if (input.blockers.some((b) => b.scenarioKind.includes("payment") || b.simulationDomain.includes("payment"))) {
    recommendations.add("Verify payment flows use mock providers before production go-live");
  }
  if (input.blockers.length === 0 && input.warnings.length === 0) {
    recommendations.add("Production simulation certified — proceed with Grand King live readiness");
  } else if (recommendations.size === 0) {
    recommendations.add("Review simulation blockers before beginning live operations");
  }

  return { riskRegister, executiveRecommendations: [...recommendations] };
}
