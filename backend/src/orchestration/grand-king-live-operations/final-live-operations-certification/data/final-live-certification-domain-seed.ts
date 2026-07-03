/**
 * G7-10 — Final live certification domain rule seed (REG-LIVE-OPERATIONS-FINAL-CERTIFICATION).
 */

import {
  LIVE_OPERATIONS_REGISTRY_VERSION,
  type LiveOperationsRegistryRowBase,
  type FinalLiveCertificationRuleKind,
} from "../../../../registry/types/live-operations-registry-types.js";

function liveCertificationRow(input: {
  id: string;
  name: string;
  ruleKind: FinalLiveCertificationRuleKind;
  certificationDomain: string;
  missionRef: string;
  scanResolverRef: string;
  artifactRef?: string;
  auditMissionRefs?: string[];
}): LiveOperationsRegistryRowBase {
  return {
    id: input.id,
    name: input.name,
    description: `Final live operations certification rule ${input.ruleKind} for ${input.certificationDomain}`,
    status: "VALIDATED",
    version: "1.0.0",
    owner: "pillow:governance",
    dependencies: input.auditMissionRefs ?? [],
    capabilities: ["final-live-certification-validate"],
    configuration: {
      finalLiveCertificationRule: {
        schemaVersion: LIVE_OPERATIONS_REGISTRY_VERSION,
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
    validation: { schemaVersion: LIVE_OPERATIONS_REGISTRY_VERSION },
    pluginSupport: { allowPluginRegistration: true },
    workspaceScope: { scope: "global" },
    futureCompatibility: { notes: "Extensible via REG-LIVE-OPERATIONS-FINAL-CERTIFICATION rows" },
  };
}

export const FINAL_LIVE_CERTIFICATION_DOMAIN_SEED_ROWS: LiveOperationsRegistryRowBase[] = [
  liveCertificationRow({
    id: "live-rule-framework",
    name: "Live operations framework certification",
    ruleKind: "live_operations_framework",
    certificationDomain: "operational_evidence",
    missionRef: "G7-00",
    scanResolverRef: "scan:live-operations-framework",
    artifactRef: "artifacts/g7-00-grand-king-live-operations-framework-executive-audit.md",
    auditMissionRefs: ["G7-00"],
  }),
  liveCertificationRow({
    id: "live-rule-production-workspace",
    name: "Grand King production workspace certification",
    ruleKind: "production_workspace",
    certificationDomain: "grand_king_workspace",
    missionRef: "G7-01",
    scanResolverRef: "scan:production-workspace",
    artifactRef: "artifacts/g7-01-grand-king-production-workspace-executive-audit.md",
    auditMissionRefs: ["G7-01"],
  }),
  liveCertificationRow({
    id: "live-rule-commerce",
    name: "Commerce operations certification",
    ruleKind: "commerce_operations",
    certificationDomain: "commerce_operations",
    missionRef: "G7-02",
    scanResolverRef: "scan:commerce-operations",
    artifactRef: "artifacts/g7-02-grand-king-commerce-operations-executive-audit.md",
    auditMissionRefs: ["G7-02"],
  }),
  liveCertificationRow({
    id: "live-rule-automation",
    name: "Automation operations certification",
    ruleKind: "automation_operations",
    certificationDomain: "automation_operations",
    missionRef: "G7-03",
    scanResolverRef: "scan:automation-operations",
    artifactRef: "artifacts/g7-03-grand-king-business-automation-operations-executive-audit.md",
    auditMissionRefs: ["G7-03"],
  }),
  liveCertificationRow({
    id: "live-rule-executive",
    name: "Executive operations certification",
    ruleKind: "executive_operations",
    certificationDomain: "executive_operations",
    missionRef: "G7-04",
    scanResolverRef: "scan:executive-decision-centre",
    artifactRef: "artifacts/g7-04-grand-king-executive-decision-centre-executive-audit.md",
    auditMissionRefs: ["G7-04"],
  }),
  liveCertificationRow({
    id: "live-rule-financial",
    name: "Financial operations certification",
    ruleKind: "financial_operations",
    certificationDomain: "financial_operations",
    missionRef: "G7-05",
    scanResolverRef: "scan:financial-operations",
    artifactRef: "artifacts/g7-05-grand-king-revenue-financial-operations-executive-audit.md",
    auditMissionRefs: ["G7-05"],
  }),
  liveCertificationRow({
    id: "live-rule-optimization",
    name: "Continuous optimization certification",
    ruleKind: "continuous_optimization",
    certificationDomain: "continuous_optimization",
    missionRef: "G7-06",
    scanResolverRef: "scan:continuous-intelligence",
    artifactRef: "artifacts/g7-06-grand-king-continuous-intelligence-optimization-executive-audit.md",
    auditMissionRefs: ["G7-06"],
  }),
  liveCertificationRow({
    id: "live-rule-autonomous",
    name: "Autonomous operations certification",
    ruleKind: "autonomous_operations",
    certificationDomain: "autonomous_operations",
    missionRef: "G7-07",
    scanResolverRef: "scan:autonomous-operations",
    artifactRef: "artifacts/g7-07-grand-king-autonomous-operations-executive-audit.md",
    auditMissionRefs: ["G7-07"],
  }),
  liveCertificationRow({
    id: "live-rule-self-healing",
    name: "Self-healing operations certification",
    ruleKind: "self_healing_operations",
    certificationDomain: "self_healing_operations",
    missionRef: "G7-08",
    scanResolverRef: "scan:self-healing-operations",
    artifactRef: "artifacts/g7-08-grand-king-self-healing-operations-executive-audit.md",
    auditMissionRefs: ["G7-08"],
  }),
  liveCertificationRow({
    id: "live-rule-intelligence",
    name: "Operational intelligence certification",
    ruleKind: "operational_intelligence",
    certificationDomain: "operational_intelligence",
    missionRef: "G7-09",
    scanResolverRef: "scan:operational-intelligence",
    artifactRef: "artifacts/g7-09-grand-king-operational-intelligence-executive-audit.md",
    auditMissionRefs: ["G7-09"],
  }),
  liveCertificationRow({
    id: "live-rule-evidence-completeness",
    name: "Evidence completeness certification",
    ruleKind: "evidence_completeness",
    certificationDomain: "operational_evidence",
    missionRef: "G7-00",
    scanResolverRef: "scan:evidence-completeness",
    auditMissionRefs: ["G7-00", "G7-01", "G7-02", "G7-03", "G7-04", "G7-05", "G7-06", "G7-07", "G7-08", "G7-09"],
  }),
  liveCertificationRow({
    id: "live-rule-production-stability",
    name: "Production stability certification",
    ruleKind: "production_stability",
    certificationDomain: "production_stability",
    missionRef: "G6-10",
    scanResolverRef: "scan:production-stability",
  }),
  liveCertificationRow({
    id: "live-rule-production-governance",
    name: "Production governance certification",
    ruleKind: "production_governance",
    certificationDomain: "production_governance",
    missionRef: "G7-00",
    scanResolverRef: "scan:production-governance",
  }),
  liveCertificationRow({
    id: "live-rule-operational-risks",
    name: "Operational risks certification",
    ruleKind: "operational_risks",
    certificationDomain: "operational_risks",
    missionRef: "G7-10",
    scanResolverRef: "scan:operational-risks",
  }),
  liveCertificationRow({
    id: "live-rule-grand-king-readiness",
    name: "Grand King launch readiness certification",
    ruleKind: "grand_king_readiness",
    certificationDomain: "grand_king_readiness",
    missionRef: "G7-10",
    scanResolverRef: "scan:grand-king-readiness",
  }),
  liveCertificationRow({
    id: "live-rule-launch-gate",
    name: "Version 1 launch gate certification",
    ruleKind: "launch_gate",
    certificationDomain: "version1_launch_eligibility",
    missionRef: "G7-10",
    scanResolverRef: "scan:launch-gate",
  }),
  liveCertificationRow({
    id: "live-rule-launch-eligibility",
    name: "Version 1 launch eligibility certification",
    ruleKind: "version1_launch_eligibility",
    certificationDomain: "version1_launch_eligibility",
    missionRef: "G7-10",
    scanResolverRef: "scan:version1-launch-eligibility",
  }),
];
