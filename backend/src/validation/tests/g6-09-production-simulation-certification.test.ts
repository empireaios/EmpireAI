import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  PRODUCTION_SIMULATION_CERTIFICATION_VERSION,
  PRODUCTION_SIMULATION_EKLS_KINDS,
  PRODUCTION_SIMULATION_RESULT_STATES,
  PRODUCTION_SIMULATION_TYPES,
  buildCockpitProductionSimulationView,
  createProductionCertificationModuleContract,
  getProductionSimulationOverview,
  isSimulationTypeSafe,
  listProductionSimulationEklsKinds,
  productionSimulationTools,
  registerProductionSimulationPlugin,
  resetProductionCertificationHarnessForTests,
  resolveProductionSimulationScenarios,
  runFullProductionSimulation,
  runSimulationScenario,
  searchProductionSimulationEklsObservations,
  validateAutomationSimulation,
  validateCommerceSimulation,
  validateProductionSimulationPillowGovernance,
} from "../../orchestration/production-certification/index.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

const TEST_CONTEXT = { workspaceId: "ws-foundation" } as const;
const TEST_ACTOR = {
  actorId: "grand-king",
  workspaceId: "ws-foundation",
  pillowGovernance: true as const,
};

function configureSimulationTestEnvironment(): void {
  process.env.SIM_UNSAFE_LIVE_EXECUTION = "false";
  process.env.SIM_MISSING_SCENARIO = "false";
  process.env.SIM_BLOCKED_SANDBOX = "false";
  process.env.SIM_MISSING_EVIDENCE = "false";
  process.env.SIM_COMMERCE_UNSAFE = "false";
  process.env.SIM_AUTOMATION_UNSAFE = "false";
  process.env.SIM_IDENTITY_UNSAFE = "false";
  process.env.SIM_COCKPIT_UNSAFE = "false";
  process.env.SIM_FAILURE_SIM_FAILED = "false";
  process.env.SIM_RECOVERY_SIM_FAILED = "false";
  process.env.SIM_MISSING_MOCK_PROVIDER = "false";
}

describe("G6-09 — Production Simulation Certification", () => {
  it("exposes production simulation certification version, types and result states", () => {
    assert.equal(PRODUCTION_SIMULATION_CERTIFICATION_VERSION, "g6-09-v1");
    assert.ok(PRODUCTION_SIMULATION_RESULT_STATES.includes("pass"));
    assert.ok(PRODUCTION_SIMULATION_RESULT_STATES.includes("not_applicable"));
    assert.ok(PRODUCTION_SIMULATION_RESULT_STATES.includes("unknown"));
    assert.equal(PRODUCTION_SIMULATION_TYPES.length, 7);
    assert.equal(isSimulationTypeSafe("dry_run"), true);
    assert.equal(isSimulationTypeSafe("sandbox"), true);
  });

  it("retains G6-09 production simulation subsystem after G6-10 module advance", () => {
    const contract = createProductionCertificationModuleContract();
    assert.equal(contract.missionId, "G6-10");
    assert.equal(contract.programmeStatus, "production-readiness-certified");
    assert.ok(contract.capabilities.includes("production-certification.run_full_production_simulation"));
  });

  it("resolves simulation scenarios from REG-CERTIFICATION-SIMULATION", () => {
    resetProductionCertificationHarnessForTests();
    configureSimulationTestEnvironment();
    const scenarios = resolveProductionSimulationScenarios(TEST_CONTEXT);
    assert.ok(scenarios.length >= 16);
    assert.ok(scenarios.some((s) => s.scenarioKind === "grand_king_login"));
    assert.ok(scenarios.some((s) => s.scenarioKind === "payment_flow"));
    assert.ok(scenarios.some((s) => s.defaultSimulationType === "mocked"));
  });

  it("validates simulation contract fields on each scenario result", () => {
    resetProductionCertificationHarnessForTests();
    configureSimulationTestEnvironment();
    const run = runFullProductionSimulation(TEST_ACTOR);
    assert.ok(run.simulations.length >= 16);
    for (const sim of run.simulations) {
      assert.ok(sim.simulationId);
      assert.ok(sim.scenarioId);
      assert.ok(sim.scope);
      assert.ok(sim.simulationType);
      assert.ok(sim.status);
      assert.ok(Array.isArray(sim.steps));
      assert.ok(Array.isArray(sim.evidence));
      assert.ok(sim.startedAt);
      assert.ok(sim.completedAt);
      assert.ok(sim.correlationId);
      assert.ok(sim.governanceState);
    }
  });

  it("validates commerce and automation simulations without live execution", () => {
    resetProductionCertificationHarnessForTests();
    configureSimulationTestEnvironment();
    const scenarios = resolveProductionSimulationScenarios(TEST_CONTEXT);
    const commerce = validateCommerceSimulation(scenarios, TEST_CONTEXT, "sandbox", "corr-test", "pillow-approved");
    const automation = validateAutomationSimulation(scenarios, TEST_CONTEXT, "mocked", "corr-test", "pillow-approved");
    assert.ok(commerce.length >= 6);
    assert.ok(automation.length >= 2);
    assert.ok(commerce.every((s) => s.simulationType === "sandbox"));
    assert.ok(commerce.every((s) => s.status !== "blocked" || process.env.SIM_UNSAFE_LIVE_EXECUTION === "true"));
  });

  it("blocks unsafe live execution", () => {
    resetProductionCertificationHarnessForTests();
    process.env.SIM_UNSAFE_LIVE_EXECUTION = "true";
    const run = runFullProductionSimulation(TEST_ACTOR);
    assert.ok(run.blockers.length >= 1 || run.warnings.length >= 1);
    assert.equal(run.safeExecutionVerified, false);
    process.env.SIM_UNSAFE_LIVE_EXECUTION = "false";
  });

  it("registers all required production simulation Brain tools", () => {
    const names = new Set(productionSimulationTools.map((tool) => tool.name));
    for (const toolName of [
      "production_simulation_overview",
      "run_simulation_scenario",
      "run_full_production_simulation",
      "simulation_status",
      "simulation_evidence",
      "simulation_blockers",
      "simulation_recommendations",
    ]) {
      assert.equal(names.has(toolName), true, `Missing Brain tool: ${toolName}`);
    }
  });

  it("passes Pillow governance for simulation operations", () => {
    resetProductionCertificationHarnessForTests();
    configureSimulationTestEnvironment();
    const result = validateProductionSimulationPillowGovernance({
      ...TEST_ACTOR,
      operation: "run_full",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.simulationAuthority, true);
    assert.equal(result.safeExecutionBoundary, true);
    assert.equal(result.sandboxEligibility, true);
    assert.equal(result.evidenceIntegrity, true);
  });

  it("runs full production simulation with safe execution verified", () => {
    resetProductionCertificationHarnessForTests();
    configureSimulationTestEnvironment();
    const run = runFullProductionSimulation(TEST_ACTOR);
    assert.ok(run.runId);
    assert.ok(["pass", "pass_with_conditions", "warning"].includes(run.status));
    assert.equal(run.safeExecutionVerified, true);
    assert.equal(run.discoverySource, "REG-CERTIFICATION-SIMULATION");

    const overview = getProductionSimulationOverview(TEST_CONTEXT);
    assert.equal(overview.lastRunId, run.runId);
  });

  it("runs a single simulation scenario by registry id", () => {
    resetProductionCertificationHarnessForTests();
    configureSimulationTestEnvironment();
    const run = runSimulationScenario({
      ...TEST_ACTOR,
      scenarioId: "sim-scenario-payment",
      simulationType: "mocked",
    });
    assert.ok(run.simulations.length >= 1);
    assert.ok(run.simulations.some((s) => s.scenarioId === "sim-scenario-payment"));
  });

  it("records simulation EKLS observations through Pillow", () => {
    resetProductionCertificationHarnessForTests();
    configureSimulationTestEnvironment();
    assert.deepEqual(listProductionSimulationEklsKinds(), [...PRODUCTION_SIMULATION_EKLS_KINDS]);
    runFullProductionSimulation(TEST_ACTOR);

    const search = searchProductionSimulationEklsObservations({
      actorId: TEST_ACTOR.actorId,
      workspaceId: TEST_ACTOR.workspaceId,
      kind: "simulation_started",
      pillowGovernance: true,
    });
    assert.ok(search.length >= 1);
  });

  it("exposes Cockpit production simulation backend contract", () => {
    resetProductionCertificationHarnessForTests();
    configureSimulationTestEnvironment();
    const run = runFullProductionSimulation(TEST_ACTOR);
    const overview = getProductionSimulationOverview(TEST_CONTEXT);
    const view = buildCockpitProductionSimulationView({ overview, run });
    assert.equal(view.viewId, "cockpit-production-simulation");
    assert.equal(view.certificationStatus, run.status);
    assert.equal(view.dataMode, "simulation");
    assert.ok(view.simulationScenarios.length >= 16);
    assert.ok(view.simulationRecommendations.length >= 1);
  });

  it("supports simulation plugins without modifying simulation core", () => {
    resetProductionCertificationHarnessForTests();
    configureSimulationTestEnvironment();
    const registered = registerProductionSimulationPlugin({
      manifest: {
        pluginId: "test-simulation-plugin",
        pluginName: "Test Simulation Plugin",
        pluginKind: "validator",
        pillowGovernance: true,
      },
      hooks: {
        pluginId: "test-simulation-plugin",
        pluginKind: "validator",
        validate: () => [],
      },
      ...TEST_ACTOR,
    });
    assert.equal(registered.accepted, true);
    runFullProductionSimulation(TEST_ACTOR);
  });

  it("runs full simulation via Brain tool handler", async () => {
    resetProductionCertificationHarnessForTests();
    configureSimulationTestEnvironment();
    const tool = productionSimulationTools.find((entry) => entry.name === "run_full_production_simulation");
    assert.ok(tool);
    const result = await tool!.handler(
      { workspaceId: TEST_ACTOR.workspaceId, actorId: TEST_ACTOR.actorId },
      { workspaceId: TEST_ACTOR.workspaceId, agentId: "test-agent", correlationId: "corr-g6-09" },
    );
    assert.ok((result as { runId: string }).runId);
  });

  it("runs certification probe for production simulation scan check", async () => {
    resetProductionCertificationHarnessForTests();
    configureSimulationTestEnvironment();
    const { runCertificationCheck } = await import(
      "../../orchestration/production-certification/services/certification-runner-service.js"
    );
    const result = await runCertificationCheck({
      context: TEST_CONTEXT,
      checkId: "cert-check-production-simulation-scan",
      ...TEST_ACTOR,
    });
    assert.ok(["pass", "pass_with_conditions", "warning"].includes(result.status));
  });

  it("does not expose credentials or sensitive payloads in simulation output", () => {
    resetProductionCertificationHarnessForTests();
    configureSimulationTestEnvironment();
    const run = runFullProductionSimulation(TEST_ACTOR);
    const serialized = JSON.stringify(run);
    assert.equal(serialized.includes("sk_live"), false);
    assert.equal(serialized.includes("api_key"), false);
    assert.equal(serialized.includes("password"), false);
    assert.equal(serialized.includes("token"), false);
  });
});
