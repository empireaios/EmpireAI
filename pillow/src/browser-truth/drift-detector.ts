import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import type { BrowserDriftReport, BrowserVerificationResult } from "./types.js";

export function detectBrowserDrift(input: {
  bootstrap: EmpireBootstrapContext;
  verification: BrowserVerificationResult;
}): BrowserDriftReport {
  const { bootstrap, verification } = input;
  const findings: string[] = [];

  const failedChecks = verification.checks.filter((c) => c.status === "failed");
  const failedScenarios = verification.scenarios.filter((s) => s.status === "failed");

  if (failedChecks.length > 0) {
    findings.push(`${failedChecks.length} browser verification dimension(s) failed`);
  }
  if (failedScenarios.length > 0) {
    findings.push(`${failedScenarios.length} production scenario(s) failed`);
  }
  if (!bootstrap.repositoryHealth.healthy) {
    findings.push("Repository health degraded vs production expectations");
  }
  if (verification.driftDetected?.findings?.length) {
    findings.push(...verification.driftDetected.findings);
  }

  const browserDrift = failedChecks.some((c) =>
    ["rendering", "visual_accuracy", "interaction"].includes(c.dimension),
  );
  const productionDrift = !verification.success && verification.dryRun === false;
  const uxDrift = failedChecks.some((c) =>
    ["navigation", "business_logic", "session_continuity"].includes(c.dimension),
  );
  const regression = failedScenarios.length > 0 || failedChecks.length >= 3;

  return {
    browserDrift,
    productionDrift,
    uxDrift,
    regression,
    findings,
  };
}

export function compareBehaviourLayers(input: {
  repositoryBehaviour: string;
  productionBehaviour: string;
  browserBehaviour: string;
  expectedBehaviour: string;
}): import("./types.js").BrowserTruthComparison {
  const aligned =
    input.repositoryBehaviour.includes("healthy") &&
    (input.productionBehaviour.includes("reachable") ||
      input.productionBehaviour.includes("dry-run")) &&
    input.browserBehaviour.includes("ready");

  const findings: string[] = [];
  if (!input.repositoryBehaviour.includes("healthy")) {
    findings.push("Repository behaviour misaligned");
  }
  if (!input.productionBehaviour.includes("reachable") && !input.productionBehaviour.includes("dry-run")) {
    findings.push("Production behaviour unreachable");
  }
  if (input.browserBehaviour.includes("degraded")) {
    findings.push("Browser behaviour degraded vs expected");
  }

  return {
    ...input,
    aligned,
    findings,
  };
}
