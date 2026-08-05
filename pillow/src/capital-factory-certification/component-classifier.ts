import type { MissionEvidence, Q9Mission, WorkerProbeResult, WorkerCertificationStatus } from "./types.js";

export type ClassificationResult = { status: WorkerCertificationStatus; reason: string };

function repositoryComplete(evidence: MissionEvidence): boolean {
  return (
    evidence.engineExists &&
    evidence.configExists &&
    evidence.governanceExists &&
    evidence.bridgeExists &&
    evidence.testExists &&
    evidence.sessionReferenced &&
    evidence.registryReferenced &&
    evidence.q911ContractPresent
  );
}

/**
 * Maps observed repository evidence + optional runtime probe to worker certification
 * status. Decision mapping to overall CertificationDecision (in certification-gates):
 *   all Certified → Certified
 *   any Failed Certification → Failed
 *   any Blocked → Not_Certified
 *   else if any Partially Certified → Conditionally_Certified
 *   else Deferred
 */
export function classifyComponent(
  evidence: MissionEvidence,
  probe: WorkerProbeResult,
  deferred: boolean = evidence.deferred,
): ClassificationResult {
  if (deferred) {
    return {
      status: "Deferred",
      reason: evidence.deferred
        ? "Repository evidence explicitly marks this mission as deferred"
        : "Input explicitly marked this mission as deferred",
    };
  }
  if (evidence.evidenceContradiction) {
    return {
      status: "Failed Certification",
      reason: evidence.evidenceContradiction,
    };
  }
  if (probe.error) {
    return {
      status: "Failed Certification",
      reason: `Runtime probe threw: ${probe.error}`,
    };
  }
  if (!evidence.engineExists) {
    return {
      status: "Blocked",
      reason: "engine.ts not found — worker implementation blocked",
    };
  }
  if (!evidence.configExists || !evidence.governanceExists) {
    return {
      status: "Blocked",
      reason: "Missing required config or governance document",
    };
  }

  const complete = repositoryComplete(evidence);
  if (complete && probe.reachable) {
    return {
      status: "Certified",
      reason:
        "Engine, config, governance, bridge, test, session, registry, and Q911 contract (if Q9-10) observed; runtime probe reachable",
    };
  }
  if (complete) {
    return {
      status: "Certified",
      reason:
        "All repository evidence checks passed (engine, config, governance, bridge, test, session, registry, Q911 contract when applicable)",
    };
  }

  const gaps: string[] = [];
  if (!evidence.bridgeExists) gaps.push("backend bridge not found");
  if (!evidence.testExists) gaps.push("validation test not found");
  if (!evidence.sessionReferenced) gaps.push("no session.ts reference observed");
  if (!evidence.registryReferenced) gaps.push("no subsystem registry reference observed");
  if (!evidence.q911ContractPresent) gaps.push("Q911ConsumableContract not observed in capital-risk-worker");
  if (probe.reachable === false && probe.evidence !== "No injected worker handle") {
    gaps.push(`runtime not reachable (${probe.evidence})`);
  }
  return {
    status: "Partially Certified",
    reason: gaps.length ? gaps.join("; ") : "Repository evidence incomplete",
  };
}

export function classifyMissionDeferred(
  mission: Q9Mission,
  deferredMissionIds: readonly string[] | undefined,
): boolean {
  return Boolean(deferredMissionIds?.includes(mission.missionId));
}
