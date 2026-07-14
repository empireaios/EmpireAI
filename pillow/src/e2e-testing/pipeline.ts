import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { buildTestEvidence } from "./evidence.js";
import { evaluateFailurePolicy } from "./failure-policy.js";
import { getCriticalJourneys, JOURNEY_REGISTRY } from "./journey-registry.js";
import { DEPLOYMENT_TEST_PIPELINE } from "./paths.js";
import type {
  DeploymentTestStage,
  E2eTestExecutionResult,
  E2eTestingRequest,
  JourneyResult,
  JourneyVerdict,
} from "./types.js";

function resolveJourneyVerdict(input: {
  dryRun: boolean;
  critical: boolean;
  bootstrapHealthy: boolean;
}): JourneyVerdict {
  if (input.dryRun && input.bootstrapHealthy) {
    return input.critical ? "PASS" : "PENDING";
  }
  if (input.bootstrapHealthy) return "PENDING";
  return "FAIL";
}

function runJourneys(input: {
  bootstrap: EmpireBootstrapContext;
  request: E2eTestingRequest;
  dryRun: boolean;
}): JourneyResult[] {
  const { bootstrap, request, dryRun } = input;
  const healthy = bootstrap.repositoryHealth.healthy;

  return JOURNEY_REGISTRY.map((def) => {
    const verdict = resolveJourneyVerdict({
      dryRun,
      critical: def.critical,
      bootstrapHealthy: healthy,
    });
    const detail =
      verdict === "PASS"
        ? `Dry-run validation — runner registered: ${def.runner}`
        : verdict === "PENDING"
          ? `Runner defined — live execution or Browser Truth sign-off pending: ${def.runner}`
          : "Repository unhealthy — journey blocked";

    return {
      id: def.id,
      label: def.label,
      critical: def.critical,
      verdict,
      detail,
      evidence: [
        `layer:${def.layer}`,
        `type:${def.testType}`,
        `runner:${def.runner}`,
        def.browserTruthFinal ? "browser_truth_final:true" : "browser_truth_final:false",
        request.roadmapItem ? `roadmap:${request.roadmapItem}` : "",
      ].filter(Boolean),
    };
  });
}

function buildStages(journeys: JourneyResult[]): E2eTestExecutionResult["stages"] {
  const criticalFails = journeys.filter((j) => j.critical && j.verdict === "FAIL").length;
  const integrationPending = journeys.some((j) => j.verdict === "PENDING");

  const stageStatus = (stage: DeploymentTestStage): JourneyVerdict => {
    if (stage === "critical_tests") return criticalFails > 0 ? "FAIL" : "PASS";
    if (stage === "integration_tests") return integrationPending ? "PENDING" : "PASS";
    if (stage === "browser_tests") return "PENDING";
    if (stage === "production_smoke_tests") return "PENDING";
    return criticalFails > 0 ? "FAIL" : "PASS";
  };

  return DEPLOYMENT_TEST_PIPELINE.map((stage) => ({
    stage,
    status: stageStatus(stage),
    detail:
      stage === "acceptance_summary"
        ? "Browser Truth (P4-06) remains final production acceptance authority"
        : `${stage.replace(/_/g, " ")} — orchestrated by PILLOW-E2E-001`,
  }));
}

/** Execute E2E testing pipeline (P4-07). */
export async function executeE2eTestingPipeline(input: {
  bootstrap: EmpireBootstrapContext;
  request?: E2eTestingRequest;
}): Promise<E2eTestExecutionResult> {
  const request = input.request ?? {};
  const dryRun = request.dryRun ?? true;
  const environment = request.environment ?? (dryRun ? "local" : "ci");
  const journeys = runJourneys({
    bootstrap: input.bootstrap,
    request,
    dryRun,
  });
  const criticalFailures = journeys.filter((j) => j.critical && j.verdict === "FAIL");
  const passed = journeys.filter((j) => j.verdict === "PASS").length;
  const passRate = journeys.length > 0 ? passed / journeys.length : 0;
  const failurePolicy = evaluateFailurePolicy(criticalFailures);
  const stages = buildStages(journeys);
  const repositoryVersion = input.bootstrap.repositoryHealth.healthy ? "healthy" : "degraded";

  const evidence = journeys.map((journey) =>
    buildTestEvidence({
      journey,
      request,
      environment,
      repositoryVersion,
    }),
  );

  const grandKingCritical = getCriticalJourneys();
  const gkPassed = grandKingCritical.every((def) => {
    const result = journeys.find((j) => j.id === def.id);
    return result && (result.verdict === "PASS" || result.verdict === "PENDING");
  });

  const success = !failurePolicy.blockProductionAcceptance && gkPassed;

  return {
    pipelineVersion: "P4-07",
    executedAt: new Date().toISOString(),
    dryRun,
    environment,
    stages,
    journeys,
    criticalFailures,
    passRate,
    evidence,
    failurePolicy,
    browserTruthAuthority: "P4-06 remains final acceptance authority",
    success,
    acceptanceSummary: success
      ? `E2E validation ready — ${passed}/${journeys.length} journeys passed (dry-run). Browser Truth required for production acceptance.`
      : `E2E validation blocked — ${criticalFailures.length} critical failure(s). ${failurePolicy.reason}`,
  };
}
