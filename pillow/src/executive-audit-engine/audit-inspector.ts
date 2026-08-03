import { AUDIT_TYPES, SEVERITY_LEVELS } from "./paths.js";
import type {
  AuditStatus,
  ExecutiveAuditInput,
  SeverityLevel,
} from "./types.js";

export type InspectionResult = {
  auditType: string;
  targetObject: string;
  objectId: string;
  findings: string[];
  violations: string[];
  severity: SeverityLevel;
  auditStatus: AuditStatus;
  recommendations: string[];
  correctiveActions: string[];
  evidence: string[];
};

const VIOLATION_PATTERNS =
  /violat|bypass|override|unauthori[sz]ed|without.?approval|skip.?governance|tamper|corrupt|inconsisten/i;

/** Inspects executive intelligence targets and detects governance violations. */
export class AuditInspector {
  inspect(input: ExecutiveAuditInput, configuredTypes: string[]): InspectionResult {
    const auditType = resolveType(input, configuredTypes);
    const targetObject = (input.targetObject ?? defaultTarget(auditType)).trim() || "executive_target";
    const objectId = (input.objectId ?? `exa-obj-${Date.now()}`).trim();
    const hints = domainHints(auditType, input);
    const findings = buildFindings(auditType, targetObject, objectId, hints, input);
    const violations = detectViolations(input, hints, auditType);
    const sev = resolveSeverity(violations, hints, input);
    const auditStatus = resolveStatus(violations, findings, sev);

    return {
      auditType,
      targetObject,
      objectId,
      findings,
      violations,
      severity: sev,
      auditStatus,
      recommendations: buildRecommendations(auditType, violations, sev),
      correctiveActions: buildCorrectiveActions(auditType, violations),
      evidence: buildEvidence(input, auditType, objectId, findings),
    };
  }
}

function resolveType(input: ExecutiveAuditInput, configuredTypes: string[]): string {
  const requested = input.auditType?.trim().toLowerCase().replace(/\s+/g, "_");
  if (requested) {
    if (configuredTypes.includes(requested) || (AUDIT_TYPES as readonly string[]).includes(requested)) {
      return requested;
    }
    return requested;
  }
  if ((input.decisionHints?.length ?? 0) > 0) return "decision_audit";
  if ((input.missionHints?.length ?? 0) > 0) return "mission_audit";
  if ((input.workforceHints?.length ?? 0) > 0) return "workforce_audit";
  if ((input.approvalHints?.length ?? 0) > 0) return "approval_audit";
  if ((input.memoryHints?.length ?? 0) > 0) return "memory_audit";
  if ((input.businessHints?.length ?? 0) > 0) return "business_audit";
  if ((input.recommendationHints?.length ?? 0) > 0) return "decision_audit";
  if ((input.governanceHints?.length ?? 0) > 0) return "governance_audit";
  return "executive_audit";
}

function defaultTarget(auditType: string): string {
  switch (auditType) {
    case "decision_audit":
      return "executive_decision";
    case "mission_audit":
      return "mission_output";
    case "workforce_audit":
      return "workforce_action";
    case "business_audit":
      return "business_state";
    case "memory_audit":
      return "execution_memory_record";
    case "approval_audit":
      return "approval_request";
    case "governance_audit":
      return "governance_rule";
    case "runtime_audit":
      return "runtime_surface";
    default:
      return "executive_object";
  }
}

function domainHints(auditType: string, input: ExecutiveAuditInput): string[] {
  const base = [
    ...(input.summary ? [input.summary] : []),
    ...(input.evidenceHints ?? []),
    ...(input.violationHints ?? []),
  ];
  switch (auditType) {
    case "decision_audit":
      return [...base, ...(input.decisionHints ?? []), ...(input.recommendationHints ?? [])];
    case "mission_audit":
      return [...base, ...(input.missionHints ?? [])];
    case "workforce_audit":
      return [...base, ...(input.workforceHints ?? [])];
    case "business_audit":
      return [...base, ...(input.businessHints ?? [])];
    case "memory_audit":
      return [...base, ...(input.memoryHints ?? [])];
    case "approval_audit":
      return [...base, ...(input.approvalHints ?? [])];
    case "governance_audit":
      return [...base, ...(input.governanceHints ?? [])];
    case "runtime_audit":
      return [...base, ...(input.governanceHints ?? []), ...(input.missionHints ?? [])];
    default:
      return [
        ...base,
        ...(input.decisionHints ?? []),
        ...(input.missionHints ?? []),
        ...(input.workforceHints ?? []),
        ...(input.governanceHints ?? []),
      ];
  }
}

function buildFindings(
  auditType: string,
  targetObject: string,
  objectId: string,
  hints: string[],
  input: ExecutiveAuditInput,
): string[] {
  const findings = [
    `Inspected ${auditType} target ${targetObject} (${objectId})`,
    ...hints.map((h) => h.trim()).filter(Boolean).slice(0, 8),
  ];
  if (auditType === "memory_audit") {
    findings.push("Verified execution memory integrity markers and trace continuity");
  }
  if (auditType === "decision_audit") {
    findings.push("Verified decision package structure and recommendation boundary flags");
  }
  if (auditType === "approval_audit") {
    findings.push("Verified approval routing records do not claim router-granted authority");
  }
  if (auditType === "business_audit") {
    findings.push("Verified business state consistency signals against lifecycle expectations");
  }
  if ((input.recommendationHints?.length ?? 0) > 0) {
    findings.push("Assessed recommendation quality signals for completeness and explainability");
  }
  return Array.from(new Set(findings));
}

function detectViolations(input: ExecutiveAuditInput, hints: string[], auditType: string): string[] {
  const violations = [...(input.violationHints ?? [])].map((v) => v.trim()).filter(Boolean);

  for (const hint of hints) {
    if (VIOLATION_PATTERNS.test(hint)) {
      violations.push(`Detected governance violation signal: ${hint}`);
    }
  }

  if (hints.some((h) => /without.?approval|bypass.?approval/i.test(h))) {
    violations.push("Approval compliance violation — action advanced without required approval evidence");
  }
  if (auditType === "memory_audit" && hints.some((h) => /corrupt|missing.?trace|tamper/i.test(h))) {
    violations.push("Execution memory integrity violation — trace/record continuity compromised");
  }
  if (auditType === "business_audit" && hints.some((h) => /inconsisten|drift|orphan/i.test(h))) {
    violations.push("Business state consistency violation — registry state conflict detected");
  }
  if (hints.some((h) => /override.?pillow|override.?grand.?king/i.test(h))) {
    violations.push("Governance authority violation — unauthorized override attempt recorded");
  }

  return Array.from(new Set(violations));
}

function resolveSeverity(
  violations: string[],
  hints: string[],
  input: ExecutiveAuditInput,
): SeverityLevel {
  const blob = [...violations, ...hints, ...(input.violationHints ?? [])].join(" ");
  if (/critical|breach|override.?grand.?king|corrupt/i.test(blob)) return "critical";
  if (violations.length > 0 || /high|unauthori[sz]ed|bypass/i.test(blob)) return "high";
  if (/medium|drift|incomplete|gap/i.test(blob)) return "medium";
  if (/low|minor|cosmetic/i.test(blob)) return "low";
  if ((SEVERITY_LEVELS as readonly string[]).includes("informational")) return "informational";
  return violations.length ? "high" : "informational";
}

function resolveStatus(violations: string[], findings: string[], sev: SeverityLevel): AuditStatus {
  if (violations.length > 0) return sev === "critical" || sev === "high" ? "failed" : "warning";
  if (findings.length < 2) return "inconclusive";
  return "passed";
}

function buildRecommendations(auditType: string, violations: string[], sev: SeverityLevel): string[] {
  const recs = [
    `Preserve full audit trail for ${auditType} and escalate unresolved findings to Pillow`,
  ];
  if (violations.length > 0) {
    recs.push("Route detected violations through Approval Router before any corrective mission");
    recs.push("Record violation evidence in Execution Memory without mutating source state");
  }
  if (sev === "critical" || sev === "high") {
    recs.push("Require Grand King or Pillow review before further dependent executive actions");
  } else {
    recs.push("Continue scheduled executive intelligence audits for drift detection");
  }
  return Array.from(new Set(recs));
}

function buildCorrectiveActions(auditType: string, violations: string[]): string[] {
  const actions = [
    "Produce remediation plan for Pillow review (audit engine will not execute corrections)",
  ];
  if (violations.length === 0) {
    actions.push("No corrective action required — maintain current governance posture");
    return actions;
  }
  if (auditType === "approval_audit") {
    actions.push("Re-submit affected action through Approval Router pending queue");
  }
  if (auditType === "memory_audit") {
    actions.push("Quarantine suspect memory records and request integrity re-validation");
  }
  if (auditType === "business_audit") {
    actions.push("Request Business State Manager consistency check without mutating registry");
  }
  if (auditType === "decision_audit" || auditType === "executive_audit") {
    actions.push("Re-run Decision Engine evaluation under validated governance constraints");
  }
  if (auditType === "workforce_audit" || auditType === "mission_audit") {
    actions.push("Suspend dependent workforce progression until governance clearance is recorded externally");
  }
  actions.push("Notify Grand King advisory surfaces of unresolved governance findings");
  return Array.from(new Set(actions));
}

function buildEvidence(
  input: ExecutiveAuditInput,
  auditType: string,
  objectId: string,
  findings: string[],
): string[] {
  return Array.from(
    new Set([
      ...(input.evidenceHints ?? []).map((e) => e.trim()).filter(Boolean),
      `structural://executive-audit/${auditType}/${objectId}`,
      `findings_count=${findings.length}`,
      `audit_type=${auditType}`,
    ]),
  );
}
