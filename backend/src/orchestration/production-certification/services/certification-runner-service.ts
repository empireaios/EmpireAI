/**
 * G6-00 — Production certification runner service.
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import { certificationCheckConfigurationSchema } from "../../../registry/types/certification-registry-types.js";
import type {
  CertificationCheckResult,
  CertificationDomainResult,
  CertificationGovernanceState,
  CertificationOverview,
  CertificationResultState,
  CertificationRunResult,
} from "../contracts/production-certification-types.js";
import { PRODUCTION_CERTIFICATION_VERSION } from "../contracts/production-certification-types.js";
import { validateCertificationPillowGovernance } from "../governance/certification-pillow-governance.js";
import { recordCertificationEklsObservation } from "../ekls/certification-ekls-integration.js";
import {
  getCertificationCheckRow,
  listCertificationDomains,
  listCertificationGates,
  listChecksForDomain,
  resolveCertificationRegistrySnapshot,
} from "../registry/certification-registry-resolver.js";
import { assertNoSecretsInEvidence } from "../services/certification-evidence-service.js";
import { executeCertificationProbe } from "../services/certification-probe-registry.js";
import {
  aggregateCertificationScore,
  deriveOverallCertificationStatus,
  isProductionEligibleFromChecks,
  scoreCertificationStatus,
} from "../services/certification-scoring-service.js";
import { certificationCheckResultSchema } from "../contracts/production-certification-types.js";

const runStore = new Map<string, CertificationRunResult>();
let lastRunId: string | undefined;

function nowIso(): string {
  return new Date().toISOString();
}

function deriveGovernanceState(status: CertificationResultState): CertificationGovernanceState {
  switch (status) {
    case "pass":
    case "pass_with_conditions":
      return "production_eligible";
    case "blocked":
      return "production_blocked";
    case "fail":
      return "pillow_blocked";
    case "warning":
      return "pillow_validated";
    default:
      return "pending";
  }
}

async function runCheckInternal(input: {
  context: RegistryLoaderContext;
  checkId: string;
  actorId: string;
  workspaceId: string;
  correlationId: string;
}): Promise<CertificationCheckResult> {
  const row = getCertificationCheckRow(input.context, input.checkId);
  if (!row) {
    throw new Error(`Certification check not found: ${input.checkId}`);
  }

  const config = certificationCheckConfigurationSchema.parse(row.configuration.certificationCheck);
  const probeOutput = await executeCertificationProbe(config.probeRef, {
    checkId: row.id,
    checkName: row.name,
    domainId: config.domainId,
    workspaceId: input.workspaceId,
    actorId: input.actorId,
    programmeRef: config.programmeRef,
    artifactRef: config.artifactRef,
    registryRef: config.registryRef,
    toolNames: config.toolNames,
    blockerOnFail: config.blockerOnFail,
    severityDefault: config.severityDefault,
  });

  const redaction = assertNoSecretsInEvidence(probeOutput.evidence);
  const status = redaction.valid ? probeOutput.status : "blocked";

  const result: CertificationCheckResult = {
    certificationId: randomUUID(),
    domain: config.domainId,
    checkId: row.id,
    checkName: row.name,
    scope: `domain:${config.domainId}`,
    status,
    severity: config.severityDefault,
    evidence: probeOutput.evidence,
    blockers: redaction.valid ? probeOutput.blockers : probeOutput.blockers,
    risks: probeOutput.risks,
    recommendations: redaction.valid
      ? probeOutput.recommendations
      : [...probeOutput.recommendations, redaction.reason],
    owner: row.owner,
    timestamp: nowIso(),
    correlationId: input.correlationId,
    governanceState: deriveGovernanceState(status),
    score: scoreCertificationStatus(status),
  };

  return certificationCheckResultSchema.parse(result);
}

export function getCertificationOverview(context: RegistryLoaderContext = {}): CertificationOverview {
  const snapshot = resolveCertificationRegistrySnapshot(context);
  const lastRun = lastRunId ? runStore.get(lastRunId) : undefined;
  return {
    frameworkVersion: PRODUCTION_CERTIFICATION_VERSION,
    domainCount: snapshot.domains.length,
    checkCount: snapshot.checks.length,
    gateCount: snapshot.gates.length,
    lastRunId,
    lastOverallStatus: lastRun?.overallStatus,
    productionEligible: lastRun?.productionEligible ?? false,
    generatedAt: nowIso(),
  };
}

export async function runCertificationCheck(input: {
  context?: RegistryLoaderContext;
  checkId: string;
  actorId: string;
  workspaceId: string;
  pillowGovernance: true;
}): Promise<CertificationCheckResult> {
  const governance = validateCertificationPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "run_check",
    pillowGovernance: true,
  });
  if (!governance.allowed) {
    throw new Error(governance.reason);
  }

  const correlationId = randomUUID();
  const result = await runCheckInternal({
    context: input.context ?? { workspaceId: input.workspaceId },
    checkId: input.checkId,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    correlationId,
  });

  recordCertificationEklsObservation({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    runId: correlationId,
    kind:
      result.status === "pass" || result.status === "pass_with_conditions"
        ? "certification_passed"
        : result.status === "blocked"
          ? "certification_blocked"
          : "certification_failed",
    summary: `Check ${input.checkId} → ${result.status}`,
    signalValue: result.score,
    pillowGovernance: true,
  });

  return result;
}

export async function runCertificationDomain(input: {
  context?: RegistryLoaderContext;
  domainId: string;
  actorId: string;
  workspaceId: string;
  pillowGovernance: true;
}): Promise<CertificationDomainResult> {
  const governance = validateCertificationPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "run_domain",
    pillowGovernance: true,
  });
  if (!governance.allowed) {
    throw new Error(governance.reason);
  }

  const context = input.context ?? { workspaceId: input.workspaceId };
  const correlationId = randomUUID();
  const domainRows = listCertificationDomains(context);
  const domain = domainRows.find((entry) => entry.domainId === input.domainId);
  const checks = listChecksForDomain(context, input.domainId);

  const results: CertificationCheckResult[] = [];
  for (const check of checks) {
    results.push(
      await runCheckInternal({
        context,
        checkId: check.id,
        actorId: input.actorId,
        workspaceId: input.workspaceId,
        correlationId,
      }),
    );
  }

  const blockers = results.flatMap((entry) => entry.blockers);
  const risks = results.flatMap((entry) => entry.risks);
  const status = deriveOverallCertificationStatus(results);

  return {
    domainId: input.domainId as CertificationDomainResult["domainId"],
    domainName: domain?.displayName ?? input.domainId,
    status,
    score: aggregateCertificationScore(results),
    checks: results,
    blockers,
    risks,
  };
}

export async function runFullCertification(input: {
  context?: RegistryLoaderContext;
  actorId: string;
  workspaceId: string;
  pillowGovernance: true;
}): Promise<CertificationRunResult> {
  const governance = validateCertificationPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "run_full",
    pillowGovernance: true,
  });
  if (!governance.allowed) {
    throw new Error(governance.reason);
  }

  const context = input.context ?? { workspaceId: input.workspaceId };
  const runId = randomUUID();
  const correlationId = runId;
  const startedAt = nowIso();

  recordCertificationEklsObservation({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    runId,
    kind: "certification_started",
    summary: "Full production certification run started",
    pillowGovernance: true,
  });

  const domains = listCertificationDomains(context);
  const domainResults: CertificationDomainResult[] = [];
  for (const domain of domains) {
    domainResults.push(
      await runCertificationDomain({
        context,
        domainId: domain.domainId,
        actorId: input.actorId,
        workspaceId: input.workspaceId,
        pillowGovernance: true,
      }),
    );
  }

  const allChecks = domainResults.flatMap((domain) => domain.checks);
  const gates = listCertificationGates(context);
  const requiredCheckIds = gates.filter((gate) => gate.requiredForProduction).flatMap((gate) => gate.checkIds);

  const overallStatus = deriveOverallCertificationStatus(allChecks);
  const overallScore = aggregateCertificationScore(allChecks);
  const productionEligible = isProductionEligibleFromChecks(allChecks, requiredCheckIds);

  const result: CertificationRunResult = {
    runId,
    correlationId,
    startedAt,
    completedAt: nowIso(),
    overallStatus,
    overallScore,
    productionEligible,
    domains: domainResults,
    blockers: allChecks.flatMap((check) => check.blockers),
    risks: allChecks.flatMap((check) => check.risks),
    governanceState: deriveGovernanceState(overallStatus),
    discoverySource: "REG-CERTIFICATION-DOMAIN|REG-CERTIFICATION-CHECK|REG-CERTIFICATION-GATE",
  };

  runStore.set(runId, result);
  lastRunId = runId;

  recordCertificationEklsObservation({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    runId,
    kind: productionEligible
      ? "certification_passed"
      : overallStatus === "blocked"
        ? "certification_blocked"
        : "certification_failed",
    summary: `Full certification ${overallStatus} score=${overallScore}`,
    signalValue: overallScore,
    pillowGovernance: true,
  });

  return result;
}

export function getCertificationStatus(runId?: string): CertificationRunResult | undefined {
  const id = runId ?? lastRunId;
  return id ? runStore.get(id) : undefined;
}

export function getCertificationBlockers(runId?: string) {
  return getCertificationStatus(runId)?.blockers ?? [];
}

export function getCertificationRiskRegister(runId?: string) {
  return getCertificationStatus(runId)?.risks ?? [];
}

export function getCertificationEvidence(runId?: string) {
  const run = getCertificationStatus(runId);
  if (!run) return [];
  return run.domains.flatMap((domain) => domain.checks.flatMap((check) => check.evidence));
}

export function resetProductionCertificationStateForTests(): void {
  runStore.clear();
  lastRunId = undefined;
}

export { listCertificationDomains, listCertificationGates };
export { listCertificationRegistryIds } from "../registry/certification-registry-resolver.js";
