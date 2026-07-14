/** E5-04 — Centralized Compliance Policy Registry. */

import { COMPLIANCE_POLICY_CATEGORIES } from "./paths.js";
import type { CompliancePolicyCategory, CompliancePolicyRecord } from "./types.js";

function policy(
  partial: Omit<CompliancePolicyRecord, "category"> & { category: CompliancePolicyCategory },
): CompliancePolicyRecord {
  return partial;
}

export function buildCompliancePolicyRegistry(): CompliancePolicyRecord[] {
  const now = new Date().toISOString().slice(0, 10);
  return [
    policy({
      policyId: "cpol-constitution-hierarchy",
      title: "Constitution Hierarchy Compliance",
      description: "All executive actions must align with Vision, Soul, CTD and Constitution",
      category: "constitutional_policies",
      version: "1.0.0",
      enabled: true,
      priority: 100,
      severity: "critical",
      effectiveFrom: now,
      effectiveTo: null,
      owner: "Governance Executive",
      metadata: { source: "E5-02 Executive Constitutional Monitor" },
    }),
    policy({
      policyId: "cpol-governance-framework",
      title: "Enterprise Governance Framework",
      description: "Governance policies enforced through E5-01 framework",
      category: "governance_policies",
      version: "1.0.0",
      enabled: true,
      priority: 95,
      severity: "high",
      effectiveFrom: now,
      effectiveTo: null,
      owner: "Governance Executive",
      metadata: { source: "E5-01 Enterprise Governance Framework" },
    }),
    policy({
      policyId: "cpol-audit-evidence",
      title: "Evidence-Based Audit Standard",
      description: "All governance actions require evidence collection and audit trail",
      category: "governance_policies",
      version: "1.0.0",
      enabled: true,
      priority: 90,
      severity: "high",
      effectiveFrom: now,
      effectiveTo: null,
      owner: "Audit Executive",
      metadata: { source: "E5-03 Enterprise Audit Engine" },
    }),
    policy({
      policyId: "cpol-operational-integrity",
      title: "Operational Integrity Standard",
      description: "ECC, Supervisor and Guardian operational compliance",
      category: "operational_policies",
      version: "1.0.0",
      enabled: true,
      priority: 85,
      severity: "medium",
      effectiveFrom: now,
      effectiveTo: null,
      owner: "Operations Executive",
      metadata: { source: "Engineering Constitution" },
    }),
    policy({
      policyId: "cpol-security-access",
      title: "Security Access Control",
      description: "Authentication and authorization compliance for executive actions",
      category: "security_policies",
      version: "1.0.0",
      enabled: true,
      priority: 92,
      severity: "high",
      effectiveFrom: now,
      effectiveTo: null,
      owner: "Security Executive",
      metadata: { source: "Guardian · Auth services" },
    }),
    policy({
      policyId: "cpol-financial-fiscal",
      title: "Financial Fiscal Responsibility",
      description: "Financial executive decisions comply with E3 fiscal governance",
      category: "financial_policies",
      version: "1.0.0",
      enabled: true,
      priority: 88,
      severity: "high",
      effectiveFrom: now,
      effectiveTo: null,
      owner: "Financial Executive",
      metadata: { source: "E3-16 Financial Executive Certification" },
    }),
    policy({
      policyId: "cpol-privacy-data",
      title: "Privacy and Data Protection",
      description: "Personal and sensitive data handling compliance",
      category: "privacy_policies",
      version: "1.0.0",
      enabled: true,
      priority: 87,
      severity: "high",
      effectiveFrom: now,
      effectiveTo: null,
      owner: "Privacy Officer",
      metadata: { source: "Enterprise Privacy Standard" },
    }),
    policy({
      policyId: "cpol-ai-safety",
      title: "AI Safety and Human Oversight",
      description: "AI decisions require ethical evaluation and human oversight",
      category: "ai_safety_policies",
      version: "1.0.0",
      enabled: true,
      priority: 93,
      severity: "critical",
      effectiveFrom: now,
      effectiveTo: null,
      owner: "AI Governance Executive",
      metadata: { source: "E2-15 Autonomous Monitor" },
    }),
    policy({
      policyId: "cpol-infrastructure-canonical",
      title: "Canonical Architecture Integrity",
      description: "No competing systems · repository and production truth maintained",
      category: "infrastructure_policies",
      version: "1.0.0",
      enabled: true,
      priority: 91,
      severity: "high",
      effectiveFrom: now,
      effectiveTo: null,
      owner: "Engineering Executive",
      metadata: { source: "Guardian repository protection" },
    }),
    policy({
      policyId: "cpol-business-operations",
      title: "Business Operations Compliance",
      description: "Business Factory and Commerce operations governance",
      category: "business_policies",
      version: "1.0.0",
      enabled: true,
      priority: 80,
      severity: "medium",
      effectiveFrom: now,
      effectiveTo: null,
      owner: "Business Executive",
      metadata: { source: "E4 Cross-Business" },
    }),
    policy({
      policyId: "cpol-future-custom",
      title: "Future Custom Policy Provisioning",
      description: "Extensible policy categories without fragmentation",
      category: "future_custom_policy_categories",
      version: "0.1.0",
      enabled: false,
      priority: 10,
      severity: "low",
      effectiveFrom: now,
      effectiveTo: null,
      owner: "Governance Executive",
      metadata: { source: "E5-04 policy registry" },
    }),
  ];
}

export function getEnabledPolicies(registry: CompliancePolicyRecord[]): CompliancePolicyRecord[] {
  return registry.filter((p) => p.enabled);
}

export function getPoliciesByCategory(
  registry: CompliancePolicyRecord[],
  category: CompliancePolicyCategory,
): CompliancePolicyRecord[] {
  return registry.filter((p) => p.category === category && p.enabled);
}

export function getPolicyCategories(): CompliancePolicyCategory[] {
  return [...COMPLIANCE_POLICY_CATEGORIES];
}
