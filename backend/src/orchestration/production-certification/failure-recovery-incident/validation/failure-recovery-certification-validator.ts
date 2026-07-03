/**
 * G6-08 — Failure, recovery & incident validators.
 */

import type {
  EscalationStatusSummary,
  FailureCertificationFinding,
  IncidentCertificationEntry,
  IncidentRiskEntry,
  RecoveryCertificationEntry,
  RecoveryReadinessSummary,
  RollbackCertificationEntry,
  RollbackReadinessSummary,
} from "../contracts/failure-recovery-incident-types.js";
import type { FailureRecoveryRule } from "../registry/failure-recovery-registry-resolver.js";
import { resolveRecoverySignals } from "../registry/recovery-signal-resolver.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import { getRegistryLoader } from "../../../../registry/registry-loader.js";

function toFinding(
  rule: FailureRecoveryRule,
  message: string,
  severity: FailureCertificationFinding["severity"],
  suffix: string,
): FailureCertificationFinding {
  return {
    findingId: `fri-${suffix}-${rule.ruleId}`,
    ruleId: rule.ruleId,
    ruleKind: rule.ruleKind,
    certificationDomain: rule.certificationDomain,
    serviceId: rule.serviceId,
    severity,
    message,
    recommendation: `Resolve failure recovery certification for ${rule.certificationDomain}`,
  };
}

const FAILURE_HANDLERS: Record<string, (rule: FailureRecoveryRule) => FailureCertificationFinding | undefined> = {
  missing_recovery_path: (rule) =>
    process.env.FRI_MISSING_RECOVERY_PATH === "true"
      ? toFinding(rule, "Missing recovery path", "critical", "recovery")
      : undefined,
  missing_rollback_path: (rule) =>
    process.env.FRI_MISSING_ROLLBACK_PATH === "true"
      ? toFinding(rule, "Missing rollback path", "critical", "rollback")
      : undefined,
  missing_incident_classification: (rule) =>
    process.env.FRI_MISSING_INCIDENT_CLASSIFICATION === "true"
      ? toFinding(rule, "Missing incident classification", "critical", "incident")
      : undefined,
  missing_escalation_route: (rule) =>
    process.env.FRI_MISSING_ESCALATION_ROUTE === "true"
      ? toFinding(rule, "Missing escalation route", "critical", "escalation")
      : undefined,
  missing_guardian_event: (rule) =>
    process.env.FRI_MISSING_GUARDIAN_EVENT === "true"
      ? toFinding(rule, "Missing Guardian event capture", "critical", "guardian")
      : undefined,
  missing_ekls_evidence: (rule) =>
    process.env.FRI_MISSING_EKLS_EVIDENCE === "true"
      ? toFinding(rule, "Missing EKLS evidence", "critical", "ekls")
      : undefined,
  unsafe_retry: (rule) =>
    process.env.FRI_UNSAFE_RETRY === "true"
      ? toFinding(rule, "Unsafe retry behaviour detected", "critical", "retry")
      : undefined,
  unsafe_rollback: (rule) =>
    process.env.FRI_UNSAFE_ROLLBACK === "true"
      ? toFinding(rule, "Unsafe rollback detected", "critical", "rollback-unsafe")
      : undefined,
  unrecoverable_without_escalation: (rule) =>
    process.env.FRI_UNRECOVERABLE_NO_ESCALATION === "true"
      ? toFinding(rule, "Unrecoverable failure without escalation", "critical", "unrecoverable")
      : undefined,
  silent_failure: (rule) =>
    process.env.FRI_SILENT_FAILURE === "true"
      ? toFinding(rule, "Silent failure detected", "critical", "silent")
      : undefined,
  unreported_failure: (rule) =>
    process.env.FRI_UNREPORTED_FAILURE === "true"
      ? toFinding(rule, "Unreported failure detected", "high", "unreported")
      : undefined,
  manual_intervention_required: (rule) =>
    process.env.FRI_MANUAL_INTERVENTION === "true"
      ? toFinding(rule, "Manual intervention required", "high", "manual")
      : undefined,
};

export function validateFailureRecoveryRules(
  rules: FailureRecoveryRule[],
  context: RegistryLoaderContext,
): {
  blockers: FailureCertificationFinding[];
  warnings: FailureCertificationFinding[];
  incidents: IncidentCertificationEntry[];
  recoveryPaths: RecoveryCertificationEntry[];
  rollbackPaths: RollbackCertificationEntry[];
} {
  const blockers: FailureCertificationFinding[] = [];
  const warnings: FailureCertificationFinding[] = [];
  const incidents: IncidentCertificationEntry[] = [];
  const recoveryPaths: RecoveryCertificationEntry[] = [];
  const rollbackPaths: RollbackCertificationEntry[] = [];

  for (const rule of rules) {
    const signals = resolveRecoverySignals(rule.recoverySignals, context, rule);
    for (const signal of signals) {
      if (signal.signalRef.includes("incident") || signal.signalRef.includes("classification")) {
        incidents.push({
          incidentId: `${rule.ruleId}:${signal.signalRef}`,
          ruleId: rule.ruleId,
          certificationDomain: rule.certificationDomain,
          classified: signal.satisfied,
          signalRef: signal.signalRef,
        });
      }
      if (signal.signalRef.includes("recovery-path")) {
        recoveryPaths.push({
          recoveryId: `${rule.ruleId}:${signal.signalRef}`,
          certificationDomain: rule.certificationDomain,
          pathReady: signal.satisfied,
          pathRef: rule.recoveryPathRef ?? signal.signalRef,
        });
      }
      if (signal.signalRef.includes("rollback")) {
        rollbackPaths.push({
          rollbackId: `${rule.ruleId}:${signal.signalRef}`,
          certificationDomain: rule.certificationDomain,
          pathReady: signal.satisfied,
          pathRef: rule.rollbackPathRef ?? signal.signalRef,
        });
      }
    }

    const missing = signals.filter((s) => !s.satisfied);
    if (missing.length > 0) {
      const finding = toFinding(
        rule,
        `Failure recovery certification failed for ${rule.serviceId}: missing ${missing.map((s) => s.signalRef).join(", ")}`,
        missing.length === signals.length ? "critical" : "high",
        "signal",
      );
      if (finding.severity === "critical") blockers.push(finding);
      else warnings.push(finding);
    }

    if (rule.registryRef) {
      try {
        const result = getRegistryLoader().resolve(
          context,
          rule.registryRef as Parameters<ReturnType<typeof getRegistryLoader>["resolve"]>[1],
        );
        if (!result.meta.wired) {
          warnings.push(toFinding(rule, `Registry ${rule.registryRef} not fully wired`, "medium", "registry"));
        }
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        blockers.push(toFinding(rule, `Registry failure: ${reason}`, "critical", "registry-fail"));
      }
    }

    for (const condition of rule.failureConditions) {
      const finding = FAILURE_HANDLERS[condition]?.(rule);
      if (!finding) continue;
      if (finding.severity === "critical") blockers.push(finding);
      else warnings.push(finding);
    }
  }

  return { blockers, warnings, incidents, recoveryPaths, rollbackPaths };
}

export const validateFailureDetection = (rules: FailureRecoveryRule[], ctx: RegistryLoaderContext) =>
  validateFailureRecoveryRules(rules.filter((r) => r.ruleKind === "failure_detection" || r.ruleKind === "failure_classification"), ctx);

export const validateIncidentClassification = (rules: FailureRecoveryRule[], ctx: RegistryLoaderContext) =>
  validateFailureRecoveryRules(rules.filter((r) => r.ruleKind === "incident_classification"), ctx);

export const validateRecoveryPath = (rules: FailureRecoveryRule[], ctx: RegistryLoaderContext) =>
  validateFailureRecoveryRules(
    rules.filter((r) =>
      r.ruleKind === "recovery_path" ||
      r.ruleKind === "automation_recovery" ||
      r.ruleKind === "commerce_recovery" ||
      r.ruleKind === "infrastructure_recovery" ||
      r.ruleKind === "plugin_recovery",
    ),
    ctx,
  );

export const validateRollbackPath = (rules: FailureRecoveryRule[], ctx: RegistryLoaderContext) =>
  validateFailureRecoveryRules(rules.filter((r) => r.ruleKind === "rollback_path"), ctx);

export const validateEscalation = (rules: FailureRecoveryRule[], ctx: RegistryLoaderContext) =>
  validateFailureRecoveryRules(rules.filter((r) => r.ruleKind === "escalation_behaviour" || r.ruleKind === "retry_behaviour"), ctx);

export const validateGuardianIntegration = (rules: FailureRecoveryRule[], ctx: RegistryLoaderContext) =>
  validateFailureRecoveryRules(rules.filter((r) => r.ruleKind === "guardian_event_capture"), ctx);

export const validateEklsEvidence = (rules: FailureRecoveryRule[], ctx: RegistryLoaderContext) =>
  validateFailureRecoveryRules(rules.filter((r) => r.ruleKind === "ekls_evidence_capture" || r.ruleKind === "pillow_governance"), ctx);

export function deriveRecoveryReadiness(
  recoveryPaths: RecoveryCertificationEntry[],
  rollbackPaths: RollbackCertificationEntry[],
  incidents: IncidentCertificationEntry[],
): RecoveryReadinessSummary {
  const ready = (entries: { pathReady: boolean }[]) => entries.length === 0 || entries.some((e) => e.pathReady);
  return {
    recoveryPathsReady: ready(recoveryPaths),
    rollbackPathsReady: ready(rollbackPaths),
    escalationRoutesReady: incidents.some((i) => i.classified) || incidents.length === 0,
  };
}

export function deriveRollbackReadiness(rollbackPaths: RollbackCertificationEntry[]): RollbackReadinessSummary {
  const validated = rollbackPaths.filter((entry) => entry.pathReady);
  return {
    rollbackSafe: validated.length > 0 || rollbackPaths.length === 0,
    rollbackPathsValidated: validated.length > 0,
  };
}

export function deriveEscalationStatus(blockers: FailureCertificationFinding[]): EscalationStatusSummary {
  return {
    escalationRoutesReady: !blockers.some((b) => b.message.includes("escalation")),
    manualInterventionRequired: process.env.FRI_MANUAL_INTERVENTION === "true",
  };
}

export function analyseFailureRecoveryRisks(input: {
  blockers: FailureCertificationFinding[];
  warnings: FailureCertificationFinding[];
}): { riskRegister: IncidentRiskEntry[]; executiveRecommendations: string[] } {
  const all = [...input.blockers, ...input.warnings];
  const riskRegister = all
    .filter((f) => f.severity === "critical" || f.severity === "high" || f.severity === "medium")
    .map((finding) => ({
      riskId: `risk-${finding.findingId}`,
      ruleId: finding.ruleId,
      certificationDomain: finding.certificationDomain,
      severity: finding.severity,
      summary: finding.message,
      mitigation: finding.recommendation,
    }));

  const recommendations = new Set<string>();
  if (input.blockers.some((b) => b.ruleKind === "recovery_path")) {
    recommendations.add("Define and validate recovery paths before production incidents");
  }
  if (input.blockers.some((b) => b.ruleKind === "rollback_path")) {
    recommendations.add("Validate rollback paths and safety gates");
  }
  if (input.blockers.some((b) => b.ruleKind === "guardian_event_capture")) {
    recommendations.add("Ensure Guardian captures failure, recovery, rollback, and escalation events");
  }
  if (input.blockers.some((b) => b.ruleKind === "ekls_evidence_capture")) {
    recommendations.add("Restore EKLS evidence capture for incident audit trail");
  }
  if (input.blockers.length === 0 && input.warnings.length === 0) {
    recommendations.add("Failure, recovery & incident handling certified — proceed with Grand King readiness");
  } else if (recommendations.size === 0) {
    recommendations.add("Review failure recovery blockers and warnings before live incident response");
  }

  return { riskRegister, executiveRecommendations: [...recommendations] };
}
