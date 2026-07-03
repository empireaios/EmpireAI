/**
 * G6-02 — Credential exposure validator.
 */

import type { SecurityGovernanceViolation } from "../contracts/security-governance-types.js";
import type { SecurityGovernanceRule } from "../registry/security-governance-registry-resolver.js";
import { redactCertificationEvidenceValue } from "../../services/certification-evidence-service.js";

const CREDENTIAL_PROBE_VALUES = [
  "sk_live_exposed_key",
  "Bearer eyJhbGciOiJIUzI1NiJ9",
  "password=supersecret",
  "refresh_token=rt_abc123",
];

export function validateCredentialProtectionRules(
  rules: SecurityGovernanceRule[],
): SecurityGovernanceViolation[] {
  const violations: SecurityGovernanceViolation[] = [];

  for (const rule of rules.filter((r) => r.ruleKind === "credential_protection")) {
    for (const probe of CREDENTIAL_PROBE_VALUES) {
      const redacted = redactCertificationEvidenceValue("credential", probe);
      if (redacted !== "[REDACTED]") {
        violations.push({
          violationId: `cred-${rule.ruleId}-${probe.slice(0, 8)}`,
          ruleId: rule.ruleId,
          ruleKind: rule.ruleKind,
          securityDomain: rule.securityDomain,
          boundaryId: rule.boundaryId,
          severity: "critical",
          message: "Credential exposure detected — redaction failed for probe value",
          recommendation: "Enforce credential redaction on all certification outputs",
        });
      }
    }
  }

  return violations;
}

export function detectCredentialExposure(rules: SecurityGovernanceRule[]): SecurityGovernanceViolation[] {
  return validateCredentialProtectionRules(rules);
}

export function detectHardcodedCredentials(rules: SecurityGovernanceRule[]): SecurityGovernanceViolation[] {
  const violations: SecurityGovernanceViolation[] = [];
  for (const rule of rules.filter((r) => r.forbiddenBypasses.includes("hardcoded_credentials"))) {
    const probe = redactCertificationEvidenceValue("api_key", "hardcoded_sk_test_value");
    if (probe !== "[REDACTED]") {
      violations.push({
        violationId: `hardcoded-${rule.ruleId}`,
        ruleId: rule.ruleId,
        ruleKind: rule.ruleKind,
        securityDomain: rule.securityDomain,
        boundaryId: rule.boundaryId,
        severity: "critical",
        message: "Hardcoded credential pattern not redacted",
      });
    }
  }
  return violations;
}

export function detectTokenExposure(rules: SecurityGovernanceRule[]): SecurityGovernanceViolation[] {
  const violations: SecurityGovernanceViolation[] = [];
  for (const rule of rules.filter((r) => r.forbiddenBypasses.includes("token_exposure"))) {
    const probe = redactCertificationEvidenceValue("access_token", "token_value_exposed");
    if (probe !== "[REDACTED]") {
      violations.push({
        violationId: `token-${rule.ruleId}`,
        ruleId: rule.ruleId,
        ruleKind: rule.ruleKind,
        securityDomain: rule.securityDomain,
        boundaryId: rule.boundaryId,
        severity: "critical",
        message: "Token exposure not redacted",
      });
    }
  }
  return violations;
}
