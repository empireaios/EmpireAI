import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import type { ContextSynchronizationEngine } from "../context-synchronization/engine.js";
import type { MissionPlannerEngine } from "../planner/engine.js";
import type { BrowserTruthEngine } from "../browser-truth/engine.js";
import type { E2eTestingEngine } from "../e2e-testing/engine.js";
import type { JourneySystemEngine } from "../journey-system/engine.js";
import type { BrainRuntimeEngine } from "../brain-runtime/engine.js";
import type { ProductionModeEngine } from "../production-mode/engine.js";
import type { DurableSessionEngine } from "../durable-sessions/engine.js";
import type { GuardianMonitoringEngine } from "../guardian-monitoring/engine.js";
import type { ScalingArchitectureEngine } from "../scaling-architecture/engine.js";
import type { PerformanceGovernanceEngine } from "../performance-governance/engine.js";
import type { ExecutionControlCenterEngine } from "../execution-control-center/engine.js";
import type { VisionIntegrityEngine } from "../vision-integrity-engine/engine.js";
import type { RecoveryDoctrineEngine } from "../recovery-doctrine/engine.js";
import type { VisionSynchronizationEngine } from "../vision-synchronization/engine.js";
import type { PreMissionCheckResult, PreMissionCheckStatus } from "./types.js";

function statusFromGate(allowed: boolean, degraded = false): PreMissionCheckStatus {
  if (allowed && !degraded) return "passed";
  if (degraded) return "degraded";
  return "failed";
}

export function runPreMissionChecks(input: {
  bootstrap: EmpireBootstrapContext;
  planner: MissionPlannerEngine;
  visionSync: VisionSynchronizationEngine;
  contextSync: ContextSynchronizationEngine;
  recoveryDoctrine?: RecoveryDoctrineEngine | null;
  browserTruth?: BrowserTruthEngine | null;
  e2eTesting?: E2eTestingEngine | null;
  journeySystem?: JourneySystemEngine | null;
  brainRuntime?: BrainRuntimeEngine | null;
  productionMode?: ProductionModeEngine | null;
  durableSessions?: DurableSessionEngine | null;
  guardianMonitoring?: GuardianMonitoringEngine | null;
  scalingArchitecture?: ScalingArchitectureEngine | null;
  performanceGovernance?: PerformanceGovernanceEngine | null;
  executionControlCenter?: ExecutionControlCenterEngine | null;
  visionIntegrity?: VisionIntegrityEngine | null;
  missionId?: string | null;
  missionTitle?: string | null;
  grandKingOverride?: boolean;
}): PreMissionCheckResult[] {
  const request = {
    missionId: input.missionId,
    missionTitle: input.missionTitle,
    grandKingOverride: input.grandKingOverride,
  };

  const visionGate = input.visionSync.evaluateBuilderGateSync(request);
  const contextGate = input.contextSync.evaluateBuilderGateSync(request);
  const next = input.planner.determineNextMission();
  const pipeline = contextGate.pipeline;

  const roadmapOk =
    Boolean(pipeline.contextPackage.currentRoadmapItem) &&
    !pipeline.contextPackage.currentRoadmapItem.includes("Unscoped");
  const archOk = pipeline.steps.some(
    (s) => s.step === "canonical_architecture" && s.status !== "failed",
  );
  const repoOk =
    input.bootstrap.repositoryHealth.healthy &&
    pipeline.steps.some((s) => s.step === "repository_structure" && s.status !== "failed");
  const prodOk = pipeline.steps.some(
    (s) => s.step === "production_truth" && s.status !== "failed",
  );
  const depsOk =
    !next ||
    next.blockedBy.length === 0 ||
    (next.readiness === "ready" && next.blockedBy.length === 0);

  const recoveryGate = input.recoveryDoctrine?.evaluateBuilderGateSync(request);
  const browserGate = input.browserTruth?.evaluateBuilderGateSync(request);
  const e2eGate = input.e2eTesting?.evaluateBuilderGateSync(request);
  const journeyGate = input.journeySystem?.evaluateBuilderGateSync(request);
  const brainRuntimeGate = input.brainRuntime?.evaluateBuilderGateSync(request);
  const productionModeGate = input.productionMode?.evaluateBuilderGateSync(request);
  const durableSessionGate = input.durableSessions?.evaluateBuilderGateSync(request);
  const guardianMonitoringGate = input.guardianMonitoring?.evaluateBuilderGateSync(request);
  const scalingArchitectureGate = input.scalingArchitecture?.evaluateBuilderGateSync(request);
  const performanceGovernanceGate = input.performanceGovernance?.evaluateBuilderGateSync(request);
  const executionControlCenterGate = input.executionControlCenter?.evaluateBuilderGateSync(request);
  const visionIntegrityGate = input.visionIntegrity?.evaluateBuilderGateSync(request);

  const checks: PreMissionCheckResult[] = [
    {
      id: "vision_synchronization",
      label: "Vision Synchronization",
      status: statusFromGate(visionGate.allowed),
      detail: visionGate.reason,
    },
    {
      id: "context_synchronization",
      label: "Context Synchronization",
      status: statusFromGate(
        contextGate.allowed,
        pipeline.contextCompletenessPercent < 100 && pipeline.contextCompletenessPercent >= 75,
      ),
      detail: `${contextGate.reason} · ${pipeline.contextCompletenessPercent}% complete`,
    },
    {
      id: "roadmap_validation",
      label: "Roadmap Validation",
      status: roadmapOk ? "passed" : "degraded",
      detail: pipeline.contextPackage.currentRoadmapItem,
    },
    {
      id: "architecture_validation",
      label: "Architecture Validation",
      status: archOk ? "passed" : "failed",
      detail: pipeline.architectureVersion,
    },
    {
      id: "repository_validation",
      label: "Repository Validation",
      status: repoOk ? "passed" : "degraded",
      detail: `${input.bootstrap.repositoryHealth.mandatoryPresent}/${input.bootstrap.repositoryHealth.mandatoryTotal} mandatory artifacts`,
    },
    {
      id: "production_validation",
      label: "Production Validation",
      status: prodOk ? "passed" : "degraded",
      detail: pipeline.productionAlignment,
    },
    {
      id: "dependency_validation",
      label: "Dependency Validation",
      status: depsOk ? "passed" : "failed",
      detail: next?.blockedBy.length
        ? `Blocked by: ${next.blockedBy.join(", ")}`
        : "Dependencies satisfied per repository",
    },
  ];

  if (recoveryGate) {
    checks.push({
      id: "recovery_readiness",
      label: "Recovery Readiness",
      status: statusFromGate(
        recoveryGate.allowed,
        recoveryGate.readinessScore >= 75 && recoveryGate.readinessScore < 100,
      ),
      detail: `${recoveryGate.reason} · ${recoveryGate.readinessScore}/100`,
    });
  }

  if (browserGate) {
    checks.push({
      id: "browser_truth_readiness",
      label: "Browser Truth Readiness",
      status: statusFromGate(
        browserGate.allowed,
        browserGate.readinessScore >= 75 && browserGate.readinessScore < 100,
      ),
      detail: `${browserGate.reason} · ${browserGate.readinessScore}/100`,
    });
  }

  if (e2eGate) {
    checks.push({
      id: "e2e_testing_readiness",
      label: "E2E Testing Readiness",
      status: statusFromGate(
        e2eGate.allowed,
        e2eGate.readinessScore >= 75 && e2eGate.readinessScore < 100,
      ),
      detail: `${e2eGate.reason} · ${e2eGate.readinessScore}/100`,
    });
  }

  if (journeyGate) {
    checks.push({
      id: "journey_readiness",
      label: "Journey Readiness",
      status: statusFromGate(
        journeyGate.allowed,
        journeyGate.readinessScore >= 75 && journeyGate.readinessScore < 100,
      ),
      detail: `${journeyGate.reason} · ${journeyGate.readinessScore}/100`,
    });
  }

  if (brainRuntimeGate) {
    checks.push({
      id: "brain_runtime_readiness",
      label: "Brain Runtime Readiness",
      status: statusFromGate(
        brainRuntimeGate.allowed,
        brainRuntimeGate.readinessScore >= 75 && brainRuntimeGate.readinessScore < 100,
      ),
      detail: `${brainRuntimeGate.reason} · ${brainRuntimeGate.readinessScore}/100`,
    });
  }

  if (productionModeGate) {
    checks.push({
      id: "production_mode_readiness",
      label: "Production Mode Readiness",
      status: statusFromGate(
        productionModeGate.allowed,
        productionModeGate.readinessScore >= 75 && productionModeGate.readinessScore < 100,
      ),
      detail: `${productionModeGate.reason} · ${productionModeGate.readinessScore}/100`,
    });
  }

  if (durableSessionGate) {
    checks.push({
      id: "durable_session_readiness",
      label: "Durable Session Readiness",
      status: statusFromGate(
        durableSessionGate.allowed,
        durableSessionGate.readinessScore >= 75 && durableSessionGate.readinessScore < 100,
      ),
      detail: `${durableSessionGate.reason} · ${durableSessionGate.readinessScore}/100`,
    });
  }

  if (guardianMonitoringGate) {
    checks.push({
      id: "guardian_monitoring_readiness",
      label: "Guardian Monitoring Readiness",
      status: statusFromGate(
        guardianMonitoringGate.allowed,
        guardianMonitoringGate.readinessScore >= 75 && guardianMonitoringGate.readinessScore < 100,
      ),
      detail: `${guardianMonitoringGate.reason} · ${guardianMonitoringGate.readinessScore}/100`,
    });
  }

  if (scalingArchitectureGate) {
    checks.push({
      id: "scaling_architecture_readiness",
      label: "Scaling Architecture Readiness",
      status: statusFromGate(
        scalingArchitectureGate.allowed,
        scalingArchitectureGate.readinessScore >= 75 && scalingArchitectureGate.readinessScore < 100,
      ),
      detail: `${scalingArchitectureGate.reason} · ${scalingArchitectureGate.readinessScore}/100`,
    });
  }

  if (performanceGovernanceGate) {
    checks.push({
      id: "performance_governance_readiness",
      label: "Performance Governance Readiness",
      status: statusFromGate(
        performanceGovernanceGate.allowed,
        performanceGovernanceGate.readinessScore >= 75 && performanceGovernanceGate.readinessScore < 100,
      ),
      detail: `${performanceGovernanceGate.reason} · ${performanceGovernanceGate.readinessScore}/100`,
    });
  }

  if (executionControlCenterGate) {
    checks.push({
      id: "execution_control_center_readiness",
      label: "Execution Control Center Readiness",
      status: statusFromGate(
        executionControlCenterGate.allowed,
        executionControlCenterGate.readinessScore >= 75 && executionControlCenterGate.readinessScore < 100,
      ),
      detail: `${executionControlCenterGate.reason} · ${executionControlCenterGate.readinessScore}/100`,
    });
  }

  if (visionIntegrityGate) {
    checks.push({
      id: "vision_integrity_readiness",
      label: "Vision Integrity Readiness",
      status: statusFromGate(
        visionIntegrityGate.allowed,
        visionIntegrityGate.readinessScore >= 75 && visionIntegrityGate.readinessScore < 100,
      ),
      detail: `${visionIntegrityGate.reason} · ${visionIntegrityGate.readinessScore}/100`,
    });
  }

  return checks;
}

export function allPreMissionChecksPassed(
  checks: PreMissionCheckResult[],
  grandKingOverride?: boolean,
): boolean {
  if (grandKingOverride) return true;
  return checks.every((c) => c.status === "passed" || c.status === "degraded");
}
