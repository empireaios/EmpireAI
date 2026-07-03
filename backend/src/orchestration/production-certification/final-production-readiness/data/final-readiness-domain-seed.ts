/**
 * G6-10 — Final readiness domain rule seed (REG-CERTIFICATION-FINAL-READINESS).
 */

import {
  CERTIFICATION_REGISTRY_VERSION,
  type CertificationRegistryRowBase,
  type FinalReadinessRuleKind,
} from "../../../../registry/types/certification-registry-types.js";

function finalReadinessRow(input: {
  id: string;
  name: string;
  ruleKind: FinalReadinessRuleKind;
  certificationDomain: string;
  missionRef: string;
  scanResolverRef: string;
  artifactRef?: string;
  auditMissionRefs?: string[];
}): CertificationRegistryRowBase {
  return {
    id: input.id,
    name: input.name,
    description: `Final production readiness rule ${input.ruleKind} for ${input.certificationDomain}`,
    status: "VALIDATED",
    version: "1.0.0",
    owner: "pillow:governance",
    dependencies: input.auditMissionRefs ?? [],
    capabilities: ["final-readiness-validate"],
    configuration: {
      finalReadinessRule: {
        schemaVersion: CERTIFICATION_REGISTRY_VERSION,
        ruleKind: input.ruleKind,
        certificationDomain: input.certificationDomain,
        missionRef: input.missionRef,
        scanResolverRef: input.scanResolverRef,
        artifactRef: input.artifactRef,
        auditMissionRefs: input.auditMissionRefs ?? [],
      },
    },
    supportedRegions: [],
    supportedCountries: [],
    validation: { schemaVersion: CERTIFICATION_REGISTRY_VERSION },
    pluginSupport: { allowPluginRegistration: true },
    workspaceScope: { scope: "global" },
    futureCompatibility: { notes: "Extensible via REG-CERTIFICATION-FINAL-READINESS rows" },
  };
}

export const FINAL_READINESS_DOMAIN_SEED_ROWS: CertificationRegistryRowBase[] = [
  finalReadinessRow({
    id: "final-rule-platform-integrity",
    name: "Platform integrity final certification",
    ruleKind: "platform_integrity",
    certificationDomain: "platform_integrity",
    missionRef: "G6-01",
    scanResolverRef: "scan:platform-integrity",
    artifactRef: "artifacts/g6-01-platform-integrity-certification-executive-audit.md",
    auditMissionRefs: ["G6-01"],
  }),
  finalReadinessRow({
    id: "final-rule-security-governance",
    name: "Security and governance final certification",
    ruleKind: "security_governance",
    certificationDomain: "security",
    missionRef: "G6-02",
    scanResolverRef: "scan:security-governance",
    artifactRef: "artifacts/g6-02-security-governance-certification-executive-audit.md",
    auditMissionRefs: ["G6-02"],
  }),
  finalReadinessRow({
    id: "final-rule-infrastructure-deployment",
    name: "Infrastructure and deployment final certification",
    ruleKind: "infrastructure_deployment",
    certificationDomain: "production_deployment",
    missionRef: "G6-03",
    scanResolverRef: "scan:infrastructure-deployment",
    artifactRef: "artifacts/g6-03-infrastructure-deployment-certification-executive-audit.md",
    auditMissionRefs: ["G6-03"],
  }),
  finalReadinessRow({
    id: "final-rule-operational-readiness",
    name: "Operational readiness final certification",
    ruleKind: "operational_readiness",
    certificationDomain: "operational_readiness",
    missionRef: "G6-04",
    scanResolverRef: "scan:operational-readiness",
    artifactRef: "artifacts/g6-04-operational-readiness-certification-executive-audit.md",
    auditMissionRefs: ["G6-04"],
  }),
  finalReadinessRow({
    id: "final-rule-business-operations",
    name: "Business operations final certification",
    ruleKind: "business_operations",
    certificationDomain: "business_operations",
    missionRef: "G6-05",
    scanResolverRef: "scan:business-operations",
    artifactRef: "artifacts/g6-05-business-operations-certification-executive-audit.md",
    auditMissionRefs: ["G6-05"],
  }),
  finalReadinessRow({
    id: "final-rule-performance-scalability",
    name: "Performance and scalability final certification",
    ruleKind: "performance_scalability",
    certificationDomain: "performance_scalability_resilience",
    missionRef: "G6-06",
    scanResolverRef: "scan:performance",
    artifactRef: "artifacts/g6-06-performance-scalability-resilience-certification-executive-audit.md",
    auditMissionRefs: ["G6-06"],
  }),
  finalReadinessRow({
    id: "final-rule-executive-operations",
    name: "Executive operations final certification",
    ruleKind: "executive_operations",
    certificationDomain: "executive_operations",
    missionRef: "G6-07",
    scanResolverRef: "scan:executive-operations",
    artifactRef: "artifacts/g6-07-executive-operations-certification-executive-audit.md",
    auditMissionRefs: ["G6-07"],
  }),
  finalReadinessRow({
    id: "final-rule-failure-recovery",
    name: "Failure and recovery final certification",
    ruleKind: "failure_recovery",
    certificationDomain: "failure_recovery_incident",
    missionRef: "G6-08",
    scanResolverRef: "scan:failure-recovery",
    artifactRef: "artifacts/g6-08-failure-recovery-incident-certification-executive-audit.md",
    auditMissionRefs: ["G6-08"],
  }),
  finalReadinessRow({
    id: "final-rule-production-simulation",
    name: "Production simulation final certification",
    ruleKind: "production_simulation",
    certificationDomain: "production_simulation",
    missionRef: "G6-09",
    scanResolverRef: "scan:production-simulation",
    artifactRef: "artifacts/g6-09-production-simulation-certification-executive-audit.md",
    auditMissionRefs: ["G6-09"],
  }),
  finalReadinessRow({
    id: "final-rule-evidence-completeness",
    name: "Evidence completeness final certification",
    ruleKind: "evidence_completeness",
    certificationDomain: "ekls_memory",
    missionRef: "G6-00",
    scanResolverRef: "scan:evidence-completeness",
    auditMissionRefs: ["G6-00", "G6-01", "G6-02", "G6-03", "G6-04", "G6-05", "G6-06", "G6-07", "G6-08", "G6-09"],
  }),
  finalReadinessRow({
    id: "final-rule-risk-register",
    name: "Risk register final certification",
    ruleKind: "risk_register",
    certificationDomain: "registry_compliance",
    missionRef: "G6-00",
    scanResolverRef: "scan:risk-register",
  }),
  finalReadinessRow({
    id: "final-rule-blocker-register",
    name: "Blocker register final certification",
    ruleKind: "blocker_register",
    certificationDomain: "pillow_governance",
    missionRef: "G6-00",
    scanResolverRef: "scan:blocker-register",
  }),
  finalReadinessRow({
    id: "final-rule-production-eligibility",
    name: "Production eligibility final certification",
    ruleKind: "production_eligibility",
    certificationDomain: "grand_king_readiness",
    missionRef: "G6-10",
    scanResolverRef: "scan:production-eligibility",
  }),
  finalReadinessRow({
    id: "final-rule-grand-king-readiness",
    name: "Grand King readiness final certification",
    ruleKind: "grand_king_readiness",
    certificationDomain: "grand_king_readiness",
    missionRef: "G6-10",
    scanResolverRef: "scan:grand-king-readiness",
  }),
];
