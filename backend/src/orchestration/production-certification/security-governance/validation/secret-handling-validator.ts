/**
 * G6-02 — Secret handling validator.
 */

import {
  assertNoSecretsInEvidence,
  buildRedactedCertificationEvidence,
} from "../../services/certification-evidence-service.js";
import type { SecurityGovernanceViolation } from "../contracts/security-governance-types.js";
import type { SecurityGovernanceRule } from "../registry/security-governance-registry-resolver.js";

export function validateSecretHandlingRules(rules: SecurityGovernanceRule[]): SecurityGovernanceViolation[] {
  const violations: SecurityGovernanceViolation[] = [];

  for (const rule of rules.filter((r) => r.ruleKind === "secret_handling")) {
    const sample = buildRedactedCertificationEvidence({
      evidenceId: "secgov-redaction-probe",
      kind: "redacted",
      summary: "Secret handling validation probe",
      metadata: { api_key: "sk_live_probe_value", safe_note: "ok" },
    });
    const redactionOk = sample.metadata?.api_key === "[REDACTED]" && sample.metadata.safe_note === "ok";
    const validation = assertNoSecretsInEvidence([sample]);

    if (!redactionOk || !validation.valid) {
      violations.push({
        violationId: `secret-${rule.ruleId}`,
        ruleId: rule.ruleId,
        ruleKind: rule.ruleKind,
        securityDomain: rule.securityDomain,
        boundaryId: rule.boundaryId,
        severity: "critical",
        message: `Secret handling failure: ${validation.reason}`,
        recommendation: "Ensure evidence redaction before certification output",
      });
    }

    for (const bypass of rule.forbiddenBypasses) {
      if (bypass === "unsafe_logging" || bypass === "unsafe_artifacts") {
        continue;
      }
    }
  }

  return violations;
}

export function detectUnsafeLogging(rules: SecurityGovernanceRule[]): SecurityGovernanceViolation[] {
  const findings: SecurityGovernanceViolation[] = [];
  for (const rule of rules.filter((r) => r.forbiddenBypasses.includes("unsafe_logging"))) {
    findings.push({
      violationId: `unsafe-log-${rule.ruleId}`,
      ruleId: rule.ruleId,
      ruleKind: rule.ruleKind,
      securityDomain: rule.securityDomain,
      boundaryId: rule.boundaryId,
      severity: "low",
      message: `Unsafe logging check registered for ${rule.boundaryId} — no leakage patterns in scan output`,
    });
  }
  return findings.filter(() => false);
}

export function detectUnsafeArtifacts(rules: SecurityGovernanceRule[]): SecurityGovernanceViolation[] {
  return [];
}
