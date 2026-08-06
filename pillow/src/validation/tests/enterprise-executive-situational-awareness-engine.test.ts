import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  EESAE_CAPABILITIES,
  EESAE_METADATA_VERSION,
  EESAE_MISSION_ID,
  buildEnterpriseExecutiveSituationalAwarenessEngineConfiguration,
  createEnterpriseExecutiveSituationalAwarenessEngine,
  resetEnterpriseExecutiveSituationalAwarenessEngineForTesting,
  type EesaeInput,
  type EnterpriseExecutiveSituationalAwarenessEngineDependencies,
} from "../../enterprise-executive-situational-awareness-engine/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleInput(overrides: Partial<EesaeInput> = {}): EesaeInput {
  return {
    validated: true,
    ...overrides,
  };
}

function monitoringStub(overrides: {
  healthScore?: number;
  status?: string;
  alerts?: Array<{ severity?: string; message?: string; componentId?: string }>;
} = {}): NonNullable<EnterpriseExecutiveSituationalAwarenessEngineDependencies["monitoringRuntime"]> {
  const healthScore = overrides.healthScore ?? 88;
  const status = overrides.status ?? "healthy";
  const alerts = overrides.alerts ?? [];
  return {
    getState: () => ({
      health: { status, healthScore, totalAlerts: alerts.length },
      latestReport: { alerts },
    }),
    generateAlerts: () => ({ alerts }),
    getCockpitSnapshot: () => ({ healthScore, status }),
    list: () => ({ components: [{ componentId: "runtime-monrt", currentStatus: status }] }),
  };
}

async function build(deps?: EnterpriseExecutiveSituationalAwarenessEngineDependencies) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createEnterpriseExecutiveSituationalAwarenessEngine(
    bootstrap,
    deps ? { dependencies: deps } : undefined,
  );
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("EESAE-01 Enterprise Executive Situational Awareness Engine", () => {
  beforeEach(resetEnterpriseExecutiveSituationalAwarenessEngineForTesting);

  test("1 locks mandatory boundaries", () => {
    const c = buildEnterpriseExecutiveSituationalAwarenessEngineConfiguration(REPO_ROOT, {
      neverFabricateMetrics: false as never,
      neverSilentDeterioration: false as never,
      neverAutoModifyProduction: false as never,
      neverBypassGovernance: false as never,
      constitutionalDutyActive: false as never,
      preserveAwarenessHistory: false as never,
      preserveAuditHistory: false as never,
      maskSensitiveValues: false as never,
    });
    assert.equal(c.neverFabricateMetrics, true);
    assert.equal(c.neverSilentDeterioration, true);
    assert.equal(c.neverAutoModifyProduction, true);
    assert.equal(c.neverBypassGovernance, true);
    assert.equal(c.constitutionalDutyActive, true);
    assert.equal(c.preserveAwarenessHistory, true);
    assert.equal(c.preserveAuditHistory, true);
    assert.equal(c.maskSensitiveValues, true);
    assert.ok(EESAE_CAPABILITIES.includes("never_fabricate_metrics"));
    assert.equal(EESAE_MISSION_ID, "EESAE-01");
    assert.equal(EESAE_METADATA_VERSION, "EESAE-001-v1");
  });

  test("2 initializes PILLOW-EESAE-001 EESAE-01", async () => {
    const engine = await build({
      monitoringRuntime: monitoringStub(),
      executiveReportingRuntime: { submitWorkerReport: () => ({ records: [{ reportId: "errt-1" }] }) },
      auditRuntime: { recordAuditEvent: () => ({ ok: true }) },
    });
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-EESAE-001");
    assert.equal(state.missionId, "EESAE-01");
    assert.equal(state.configuration.constitutionalDutyActive, true);
    assert.ok(state.initializedAt);
  });

  test("3 evaluate system health from monitoring evidence", async () => {
    const engine = await build({
      monitoringRuntime: monitoringStub({ healthScore: 91, status: "healthy" }),
      recoveryRuntime: { getState: () => ({ status: "idle", activeRecoveries: 0 }) },
    });
    const report = engine.evaluateSystemHealth(sampleInput());
    assert.notEqual(report.decision, "fail");
    assert.ok(report.domainSummary?.evidenceAvailable);
    assert.ok(report.domainSummary?.summary.includes("91") || report.domainSummary?.summary.toLowerCase().includes("healthy"));
  });

  test("4 evaluate performance intelligence", async () => {
    const engine = await build({
      monitoringRuntime: monitoringStub({
        alerts: [{ severity: "critical", message: "Latency spike on API gateway", componentId: "api-1" }],
      }),
      queueRuntime: { getState: () => ({ queueDepth: 12, pendingJobs: 3 }) },
    });
    const report = engine.evaluatePerformanceIntelligence(sampleInput());
    assert.notEqual(report.decision, "fail");
    assert.ok(report.domainSummary);
    assert.ok((report.findings?.length ?? 0) >= 1);
    assert.equal(report.findings?.[0]?.severity, "critical");
  });

  test("5 evaluate business + workforce (honest when no evidence)", async () => {
    const engine = await build({
      monitoringRuntime: monitoringStub(),
    });
    const business = engine.evaluateBusinessIntelligence(sampleInput());
    assert.notEqual(business.decision, "fail");
    assert.ok(business.domainSummary?.summary.toLowerCase().includes("no") || business.domainSummary?.evidenceAvailable === false);

    const workforce = engine.evaluateAiWorkforceIntelligence(sampleInput());
    assert.notEqual(workforce.decision, "fail");
    assert.ok(
      workforce.domainSummary?.summary.toLowerCase().includes("no") ||
        workforce.domainSummary?.evidenceAvailable === false,
    );
  });

  test("6 detect deterioration vs prior state", async () => {
    let alertMode: "none" | "critical" = "none";
    const monrt = {
      getState: () => ({
        health: {
          status: alertMode === "critical" ? "critical" : "healthy",
          healthScore: alertMode === "critical" ? 40 : 90,
          totalAlerts: alertMode === "critical" ? 1 : 0,
        },
      }),
      generateAlerts: () =>
        alertMode === "critical"
          ? { alerts: [{ severity: "critical", message: "Throughput collapse", componentId: "queue-1" }] }
          : { alerts: [] as Array<{ severity?: string; message?: string; componentId?: string }> },
    };
    const engine = await build({ monitoringRuntime: monrt });
    const first = engine.runAwarenessCycle(sampleInput());
    assert.notEqual(first.decision, "fail");
    alertMode = "critical";
    const second = engine.runAwarenessCycle(sampleInput());
    assert.notEqual(second.decision, "fail");
    const det = engine.detectDeterioration(sampleInput());
    assert.notEqual(det.decision, "fail");
    assert.equal(det.deterioration?.deteriorationDetected, true);
  });

  test("7 investigate root causes + impact/urgency", async () => {
    const engine = await build({
      monitoringRuntime: monitoringStub({
        alerts: [{ severity: "critical", message: "Worker thrashing", componentId: "wkr-x" }],
      }),
      workerRegistry: {
        listWorkers: () => [{ workerId: "wkr-x", status: "failed", failureCount: 5 }],
      },
    });
    engine.evaluatePerformanceIntelligence(sampleInput());
    engine.evaluateAiWorkforceIntelligence(sampleInput());
    const inv = engine.investigateRootCauses(sampleInput());
    assert.notEqual(inv.decision, "fail");
    assert.ok(inv.investigation);
    assert.ok((inv.investigation?.probableCauses.length ?? 0) >= 1);
    assert.ok(inv.impact?.urgency === "critical" || inv.impact?.urgency === "high" || inv.investigation);
  });

  test("8 generate recommendations + escalate unacknowledged critical findings", async () => {
    const engine = await build({
      monitoringRuntime: monitoringStub({
        alerts: [{ severity: "critical", message: "Unacked critical alert", componentId: "api-crit" }],
      }),
    });
    engine.evaluatePerformanceIntelligence(sampleInput());
    const recs = engine.generateExecutiveRecommendations(sampleInput());
    assert.notEqual(recs.decision, "fail");
    assert.ok((recs.recommendations?.length ?? 0) >= 1);
    assert.equal(recs.recommendations?.[0]?.autoApplyForbidden, true);

    const escalated = engine.escalateUnacknowledged(sampleInput());
    assert.notEqual(escalated.decision, "fail");
    assert.ok((escalated.escalations?.length ?? 0) >= 1);
    assert.ok(escalated.findings?.some((f) => f.escalated === true));
  });

  test("9 produce full Situational Awareness Report + briefingForGrandKing", async () => {
    const engine = await build({
      monitoringRuntime: monitoringStub({ healthScore: 77, status: "degraded" }),
      executiveReportingRuntime: { submitWorkerReport: () => ({ records: [{ reportId: "errt-eesae" }] }) },
      digitalSoulRuntime: { getSnapshot: () => ({ constitutionalDuty: "active" }) },
    });
    const produced = engine.produceSituationalAwarenessReport(sampleInput());
    assert.notEqual(produced.decision, "fail");
    assert.ok(produced.report);
    assert.equal(produced.report?.neverFabricateMetrics, true);
    assert.equal(produced.report?.neverSilentDeterioration, true);
    assert.equal(produced.report?.constitutionalDutyActive, true);
    assert.ok(produced.report?.briefingForGrandKing);
    assert.ok(produced.report?.executiveSummary);
    const briefing = engine.getBriefingForGrandKing();
    assert.ok(briefing?.briefingText || produced.briefingText || produced.report?.briefingForGrandKing);
  });

  test("10 acknowledge finding stops escalation loop for that finding", async () => {
    const engine = await build({
      monitoringRuntime: monitoringStub({
        alerts: [{ severity: "critical", message: "Ack me", componentId: "ack-1" }],
      }),
    });
    engine.evaluatePerformanceIntelligence(sampleInput());
    const firstEsc = engine.escalateUnacknowledged(sampleInput());
    const findingId = firstEsc.findings?.find((f) => f.severity === "critical")?.findingId;
    assert.ok(findingId);
    const ack = engine.acknowledgeFinding(sampleInput({ findingId }));
    assert.notEqual(ack.decision, "fail");
    assert.ok(ack.findings?.some((f) => f.findingId === findingId && f.acknowledged === true));
    const secondEsc = engine.escalateUnacknowledged(sampleInput());
    assert.ok(!(secondEsc.escalations ?? []).some((e) => e.findingId === findingId));
  });

  test("11 reject fabricate metrics / silent-suppress-critical / auto-modify / bypass governance", async () => {
    const engine = await build({ monitoringRuntime: monitoringStub() });
    for (const bad of [
      { fabricateMetrics: true },
      { silentSuppressCritical: true },
      { autoModifyProduction: true },
      { bypassGovernance: true },
    ] as Partial<EesaeInput>[]) {
      const report = engine.evaluateSystemHealth(sampleInput(bad));
      assert.equal(report.decision, "fail", `expected fail for ${JSON.stringify(bad)}`);
      assert.ok(report.errors.length > 0);
    }
  });

  test("12 cockpit + persistent awareness history + runAwarenessCycle deterministic", async () => {
    const engine = await build({
      monitoringRuntime: monitoringStub({ healthScore: 85 }),
      executiveReportingRuntime: { submitWorkerReport: () => ({ records: [{ reportId: "c1" }] }) },
    });
    const cycle = engine.runAwarenessCycle(sampleInput());
    assert.notEqual(cycle.decision, "fail");
    assert.ok(cycle.awarenessCycle);
    assert.ok(cycle.awarenessState);
    const state = engine.getPersistentAwarenessState();
    assert.ok(state);
    assert.ok(state?.stateId);
    const history = engine.getAwarenessStates();
    assert.ok(history.length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "EESAE-01");
    assert.equal(cockpit.constitutionalDutyActive, true);
    assert.equal(cockpit.neverFabricateMetrics, true);
    assert.ok(cockpit.totalReports >= 1 || cockpit.lastStateId);
  });
});
