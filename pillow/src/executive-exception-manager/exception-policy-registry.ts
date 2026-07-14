/** E5-08 — Configurable exception policies. */

import type { ExceptionPolicyRecord, GovernedExceptionDomain } from "./types.js";

function policy(
  partial: Omit<ExceptionPolicyRecord, "domain"> & { domain: GovernedExceptionDomain },
): ExceptionPolicyRecord {
  return partial;
}

export function buildExceptionPolicyRegistry(): ExceptionPolicyRecord[] {
  return [
    policy({
      policyId: "excpol-governance",
      title: "Governance Exception Policy",
      description: "Temporary governance flexibility with constitutional validation",
      domain: "governance_exceptions",
      version: "1.0.0",
      enabled: true,
      maxDurationDays: 90,
      requiresExecutiveApproval: true,
      autoEscalationHours: 48,
      severity: "high",
      owner: "Governance Executive",
      metadata: { source: "E5-01" },
    }),
    policy({
      policyId: "excpol-mission",
      title: "Mission Exception Policy",
      description: "Mission documentation and execution exceptions",
      domain: "mission_exceptions",
      version: "1.0.0",
      enabled: true,
      maxDurationDays: 30,
      requiresExecutiveApproval: false,
      autoEscalationHours: 72,
      severity: "low",
      owner: "Mission Executive",
      metadata: { source: "Journey" },
    }),
    policy({
      policyId: "excpol-repository",
      title: "Repository Exception Policy",
      description: "Controlled repository evolution exceptions",
      domain: "repository_exceptions",
      version: "1.0.0",
      enabled: true,
      maxDurationDays: 60,
      requiresExecutiveApproval: true,
      autoEscalationHours: 24,
      severity: "medium",
      owner: "Engineering Executive",
      metadata: { source: "Guardian" },
    }),
    policy({
      policyId: "excpol-financial",
      title: "Financial Exception Policy",
      description: "Financial governance exceptions with need-to-know security",
      domain: "financial_exceptions",
      version: "1.0.0",
      enabled: true,
      maxDurationDays: 90,
      requiresExecutiveApproval: true,
      autoEscalationHours: 24,
      severity: "high",
      owner: "Financial Executive",
      metadata: { source: "E3-16" },
    }),
    policy({
      policyId: "excpol-ai",
      title: "AI Operations Exception Policy",
      description: "AI threshold and autonomous action exceptions",
      domain: "operational_exceptions",
      version: "1.0.0",
      enabled: true,
      maxDurationDays: 30,
      requiresExecutiveApproval: true,
      autoEscalationHours: 12,
      severity: "critical",
      owner: "AI Governance Executive",
      metadata: { source: "E2-15" },
    }),
    policy({
      policyId: "excpol-emergency",
      title: "Emergency Exception Policy",
      description: "Emergency exceptions requiring Grand King review",
      domain: "emergency_exceptions",
      version: "1.0.0",
      enabled: true,
      maxDurationDays: 7,
      requiresExecutiveApproval: true,
      autoEscalationHours: 4,
      severity: "emergency",
      owner: "Grand King",
      metadata: { source: "Constitution Hierarchy" },
    }),
    policy({
      policyId: "excpol-future",
      title: "Future Exception Domain Policy",
      description: "Provisioning for future exception types",
      domain: "future_exception_domains",
      version: "0.1.0",
      enabled: false,
      maxDurationDays: 30,
      requiresExecutiveApproval: true,
      autoEscalationHours: 48,
      severity: "low",
      owner: "Governance Executive",
      metadata: { source: "E5-08" },
    }),
  ];
}

export function getEnabledExceptionPolicies(registry: ExceptionPolicyRecord[]): ExceptionPolicyRecord[] {
  return registry.filter((p) => p.enabled);
}

export function findPolicyForDomain(
  registry: ExceptionPolicyRecord[],
  domain: GovernedExceptionDomain,
): ExceptionPolicyRecord | undefined {
  return registry.find((p) => p.domain === domain && p.enabled);
}
