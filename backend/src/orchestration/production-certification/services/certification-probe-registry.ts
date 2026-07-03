/**
 * G6-00 — Certification probe registry (registry-driven probeRef resolution).
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { createInfrastructureCommerceModuleContract } from "../../infrastructure-commerce/contract/commerce-registry-module.js";
import { createBusinessAutomationModuleContract } from "../../business-automation/contract/business-automation-module.js";
import { createProductionCertificationModuleContract } from "../contract/production-certification-module.js";
import { createIdentityRegistryModuleContract } from "../../../foundation/identity-registry/contract/identity-registry-module.js";
import { getRegistryLoader } from "../../../registry/registry-loader.js";
import { enforceEklsAccess } from "../../pillow/ekls/services/ekls-governance-gateway.js";
import type { CertificationProbeRef } from "../../../registry/types/certification-registry-types.js";
import type {
  CertificationBlocker,
  CertificationEvidence,
  CertificationResultState,
  CertificationRisk,
} from "../contracts/production-certification-types.js";
import { buildRedactedCertificationEvidence } from "./certification-evidence-service.js";
import { validateCertificationPillowGovernance } from "../governance/certification-pillow-governance.js";

export type CertificationProbeInput = {
  checkId: string;
  checkName: string;
  domainId: string;
  workspaceId: string;
  actorId: string;
  programmeRef?: string;
  artifactRef?: string;
  registryRef?: string;
  toolNames?: string[];
  blockerOnFail: boolean;
  severityDefault: "info" | "low" | "medium" | "high" | "critical";
};

export type CertificationProbeOutput = {
  status: CertificationResultState;
  evidence: CertificationEvidence[];
  blockers: CertificationBlocker[];
  risks: CertificationRisk[];
  recommendations: string[];
};

const ARTIFACTS_ROOT = join(process.cwd(), "..", "artifacts");

function passEvidence(id: string, summary: string, ref?: string): CertificationEvidence {
  return buildRedactedCertificationEvidence({
    evidenceId: id,
    kind: ref?.endsWith(".md") ? "artifact" : "reference",
    summary,
    ref,
  });
}

function failBlocker(
  input: CertificationProbeInput,
  message: string,
): CertificationBlocker {
  return {
    blockerId: `blocker-${input.checkId}`,
    checkId: input.checkId,
    domain: input.domainId,
    severity: input.severityDefault,
    message,
    overrideEligible: input.severityDefault !== "critical",
  };
}

async function probeProgrammeModuleContract(
  input: CertificationProbeInput,
): Promise<CertificationProbeOutput> {
  const programme = input.programmeRef;
  let eligible = false;
  let detail = "Unknown programme";

  if (programme === "G2") {
    const contract = createInfrastructureCommerceModuleContract();
    eligible =
      contract.missionId === "G2-10" && contract.programmeStatus === "production-certified";
    detail = `G2 module missionId=${contract.missionId} status=${contract.programmeStatus}`;
  } else if (programme === "G5") {
    const contract = createBusinessAutomationModuleContract();
    eligible = contract.missionId === "G5-10" && contract.programmeStatus === "certified";
    detail = `G5 module missionId=${contract.missionId} status=${contract.programmeStatus}`;
  } else if (programme === "G6") {
    const contract = createProductionCertificationModuleContract();
    eligible =
      contract.missionId === "G6-10" &&
      contract.programmeStatus === "production-readiness-certified";
    detail = `G6 module missionId=${contract.missionId} status=${contract.programmeStatus}`;
  } else {
    return {
      status: "not_applicable",
      evidence: [passEvidence(`ev-${input.checkId}`, `Programme ${programme} probe not wired`)],
      blockers: [],
      risks: [],
      recommendations: [],
    };
  }

  const status: CertificationResultState = eligible ? "pass" : input.blockerOnFail ? "fail" : "warning";
  return {
    status,
    evidence: [passEvidence(`ev-${input.checkId}`, detail, input.artifactRef)],
    blockers: eligible ? [] : [failBlocker(input, `Programme module contract not production eligible: ${detail}`)],
    risks: eligible
      ? []
      : [
          {
            riskId: `risk-${input.checkId}`,
            checkId: input.checkId,
            domain: input.domainId,
            severity: input.severityDefault,
            summary: `Programme ${programme} not certified`,
            mitigation: "Complete programme certification mission",
          },
        ],
    recommendations: eligible ? [] : [`Complete ${programme} programme certification`],
  };
}

function probeRegistryResolution(input: CertificationProbeInput): CertificationProbeOutput {
  const registryRef = input.registryRef ?? "REG-CERTIFICATION-CHECK";
  try {
    if (registryRef.startsWith("DERIVED-")) {
      const views = getRegistryLoader().listFoundationStatus();
      const wired = views.some((entry) => String(entry.registryId) === registryRef);
      return {
        status: wired ? "pass" : "warning",
        evidence: [
          passEvidence(`ev-${input.checkId}`, `Derived view ${registryRef} registered`, registryRef),
        ],
        blockers: [],
        risks: wired
          ? []
          : [
              {
                riskId: `risk-${input.checkId}`,
                checkId: input.checkId,
                domain: input.domainId,
                severity: "medium",
                summary: `${registryRef} not wired`,
              },
            ],
        recommendations: [],
      };
    }

    const result = getRegistryLoader().resolve({ workspaceId: input.workspaceId }, registryRef as Parameters<
      ReturnType<typeof getRegistryLoader>["resolve"]
    >[1]);
    const ok = result.meta.wired && result.rows.length > 0;
    return {
      status: ok ? "pass" : input.blockerOnFail ? "fail" : "warning",
      evidence: [
        passEvidence(
          `ev-${input.checkId}`,
          `Registry ${registryRef} resolved ${result.rows.length} rows`,
          registryRef,
        ),
      ],
      blockers: ok ? [] : [failBlocker(input, `Registry ${registryRef} not resolved`)],
      risks: [],
      recommendations: ok ? [] : [`Wire registry ${registryRef}`],
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return {
      status: "fail",
      evidence: [passEvidence(`ev-${input.checkId}`, reason, registryRef)],
      blockers: [failBlocker(input, reason)],
      risks: [],
      recommendations: ["Fix registry resolution error"],
    };
  }
}

function probePillowGovernance(input: CertificationProbeInput): CertificationProbeOutput {
  const governance = validateCertificationPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "run_full",
    pillowGovernance: true,
  });
  return {
    status: governance.allowed ? "pass" : "blocked",
    evidence: [
      passEvidence(`ev-${input.checkId}`, governance.reason),
    ],
    blockers: governance.allowed
      ? []
      : [failBlocker(input, governance.reason)],
    risks: [],
    recommendations: governance.allowed ? [] : ["Resolve Pillow governance rejection"],
  };
}

function probeEklsGovernance(input: CertificationProbeInput): CertificationProbeOutput {
  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      consumerChannel: "production-certification",
      operation: "store",
    },
    input.workspaceId,
  );
  return {
    status: ekls.allowed ? "pass" : "fail",
    evidence: [passEvidence(`ev-${input.checkId}`, ekls.reason)],
    blockers: ekls.allowed ? [] : [failBlocker(input, ekls.reason)],
    risks: [],
    recommendations: [],
  };
}

function probeExecutiveAuditArtifact(input: CertificationProbeInput): CertificationProbeOutput {
  if (!input.artifactRef) {
    return {
      status: "not_tested",
      evidence: [passEvidence(`ev-${input.checkId}`, "No artifactRef configured")],
      blockers: [],
      risks: [],
      recommendations: [],
    };
  }
  const path = join(ARTIFACTS_ROOT, input.artifactRef);
  const exists = existsSync(path);
  return {
    status: exists ? "pass" : input.blockerOnFail ? "fail" : "warning",
    evidence: [passEvidence(`ev-${input.checkId}`, exists ? "Artifact present" : "Artifact missing", input.artifactRef)],
    blockers: exists ? [] : [failBlocker(input, `Missing artifact: ${input.artifactRef}`)],
    risks: exists
      ? []
      : [
          {
            riskId: `risk-${input.checkId}`,
            checkId: input.checkId,
            domain: input.domainId,
            severity: input.severityDefault,
            summary: `Missing executive audit ${input.artifactRef}`,
          },
        ],
    recommendations: exists ? [] : [`Generate ${input.artifactRef}`],
  };
}

async function probeBrainToolsRegistered(
  input: CertificationProbeInput,
): Promise<CertificationProbeOutput> {
  const { productionCertificationTools } = await import("../tools/production-certification-tools.js");
  const expected = input.toolNames ?? productionCertificationTools.map((tool) => tool.name);
  const registered = new Set(productionCertificationTools.map((tool) => tool.name));
  const missing = expected.filter((name) => !registered.has(name));
  const ok = missing.length === 0;
  return {
    status: ok ? "pass" : "fail",
    evidence: [
      passEvidence(
        `ev-${input.checkId}`,
        ok ? "All certification Brain tools registered" : `Missing tools: ${missing.join(", ")}`,
      ),
    ],
    blockers: ok ? [] : [failBlocker(input, `Missing Brain tools: ${missing.join(", ")}`)],
    risks: [],
    recommendations: ok ? [] : ["Register missing production certification Brain tools"],
  };
}

function probeIdentityModule(input: CertificationProbeInput): CertificationProbeOutput {
  const contract = createIdentityRegistryModuleContract();
  const ok = contract.moduleId === "identity-registry" && contract.capabilities.length > 0;
  return {
    status: ok ? "pass" : "fail",
    evidence: [
      passEvidence(`ev-${input.checkId}`, `Identity module ${contract.moduleId} capabilities=${contract.capabilities.length}`),
    ],
    blockers: ok ? [] : [failBlocker(input, "Identity registry module not operational")],
    risks: [],
    recommendations: [],
  };
}

function probePlatformIntegrity(input: CertificationProbeInput): CertificationProbeOutput {
  const g6 = createProductionCertificationModuleContract();
  const g2 = createInfrastructureCommerceModuleContract();
  const ok =
    g6.integratesWith.includes("pillow") &&
    g6.integratesWith.includes("brain") &&
    g2.integratesWith.includes("registry");
  return {
    status: ok ? "pass" : "fail",
    evidence: [
      passEvidence(`ev-${input.checkId}`, "Core platform module contracts integrated"),
    ],
    blockers: ok ? [] : [failBlocker(input, "Platform module integration incomplete")],
    risks: [],
    recommendations: [],
  };
}

function probeSecurityRedaction(input: CertificationProbeInput): CertificationProbeOutput {
  const sample = buildRedactedCertificationEvidence({
    evidenceId: "ev-redaction-test",
    kind: "redacted",
    summary: "Secret redaction probe",
    metadata: { api_key: "sk_live_should_redact", note: "safe-value" },
  });
  const ok = sample.metadata?.api_key === "[REDACTED]" && sample.metadata.note === "safe-value";
  return {
    status: ok ? "pass" : "fail",
    evidence: [sample],
    blockers: ok ? [] : [failBlocker(input, "Evidence redaction failed")],
    risks: [],
    recommendations: [],
  };
}

function probeProductionEligibility(input: CertificationProbeInput): CertificationProbeOutput {
  const g2 = createInfrastructureCommerceModuleContract();
  const g5 = createBusinessAutomationModuleContract();
  const g6 = createProductionCertificationModuleContract();
  const eligible =
    g2.programmeStatus === "production-certified" &&
    g5.programmeStatus === "certified" &&
    g6.programmeStatus === "production-readiness-certified";
  return {
    status: eligible ? "pass" : "pass_with_conditions",
    evidence: [
      passEvidence(
        `ev-${input.checkId}`,
        `Aggregate eligibility G2=${g2.programmeStatus} G5=${g5.programmeStatus} G6=${g6.programmeStatus}`,
      ),
    ],
    blockers: [],
    risks: eligible
      ? []
      : [
          {
            riskId: `risk-${input.checkId}`,
            checkId: input.checkId,
            domain: input.domainId,
            severity: "high",
            summary: "Not all programmes production certified",
            mitigation: "Complete outstanding programme certifications",
          },
        ],
    recommendations: eligible ? [] : ["Run full certification after all programmes complete"],
  };
}

async function probePlatformIntegrityScan(
  input: CertificationProbeInput,
): Promise<CertificationProbeOutput> {
  const { runPlatformIntegrityScan } = await import(
    "../platform-integrity/services/platform-integrity-certification-service.js"
  );
  const scan = runPlatformIntegrityScan({
    context: { workspaceId: input.workspaceId },
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    pillowGovernance: true,
  });
  const ok = scan.status === "pass" || scan.status === "pass_with_conditions";
  return {
    status: ok ? scan.status : input.blockerOnFail ? "fail" : scan.status,
    evidence: [
      passEvidence(
        `ev-${input.checkId}`,
        `Platform integrity scan ${scan.status} score=${scan.score} violations=${scan.violations.length}`,
      ),
    ],
    blockers: ok
      ? []
      : [failBlocker(input, `Platform integrity scan failed: ${scan.status}`)],
    risks: ok
      ? []
      : [
          {
            riskId: `risk-${input.checkId}`,
            checkId: input.checkId,
            domain: input.domainId,
            severity: input.severityDefault,
            summary: `Platform integrity ${scan.status}`,
            mitigation: "Resolve ownership, dependency, or drift violations",
          },
        ],
    recommendations: ok ? [] : ["Run platform_integrity_scan Brain tool and resolve violations"],
  };
}

async function probeSecurityGovernanceScan(
  input: CertificationProbeInput,
): Promise<CertificationProbeOutput> {
  const { runSecurityGovernanceScan } = await import(
    "../security-governance/services/security-governance-certification-service.js"
  );
  const scan = runSecurityGovernanceScan({
    context: { workspaceId: input.workspaceId },
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    pillowGovernance: true,
  });
  const ok = scan.status === "pass" || scan.status === "pass_with_conditions";
  return {
    status: ok ? scan.status : input.blockerOnFail ? "fail" : scan.status,
    evidence: [
      passEvidence(
        `ev-${input.checkId}`,
        `Security governance scan ${scan.status} score=${scan.score} findings=${scan.securityFindings.length + scan.governanceFindings.length}`,
      ),
    ],
    blockers: ok ? [] : [failBlocker(input, `Security governance scan failed: ${scan.status}`)],
    risks: ok
      ? []
      : [{
          riskId: `risk-${input.checkId}`,
          checkId: input.checkId,
          domain: input.domainId,
          severity: input.severityDefault,
          summary: `Security governance ${scan.status}`,
          mitigation: "Resolve security and governance violations",
        }],
    recommendations: ok ? [] : ["Run security_scan Brain tool and resolve violations"],
  };
}

async function probeGovernanceScan(
  input: CertificationProbeInput,
): Promise<CertificationProbeOutput> {
  const { runGovernanceScan } = await import(
    "../security-governance/services/security-governance-certification-service.js"
  );
  const scan = runGovernanceScan({
    context: { workspaceId: input.workspaceId },
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    pillowGovernance: true,
  });
  const ok = scan.status === "pass" || scan.status === "pass_with_conditions";
  return {
    status: ok ? scan.status : input.blockerOnFail ? "fail" : scan.status,
    evidence: [
      passEvidence(
        `ev-${input.checkId}`,
        `Governance scan ${scan.status} score=${scan.score} findings=${scan.governanceFindings.length}`,
      ),
    ],
    blockers: ok ? [] : [failBlocker(input, `Governance scan failed: ${scan.status}`)],
    risks: [],
    recommendations: ok ? [] : ["Run governance_scan Brain tool"],
  };
}

async function probeDeploymentScan(
  input: CertificationProbeInput,
): Promise<CertificationProbeOutput> {
  const { runInfrastructureDeploymentScan } = await import(
    "../infrastructure-deployment/services/infrastructure-deployment-certification-service.js"
  );
  const scan = runInfrastructureDeploymentScan({
    context: { workspaceId: input.workspaceId },
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    pillowGovernance: true,
  });
  const ok = scan.status === "pass" || scan.status === "pass_with_conditions";
  return {
    status: ok ? scan.status : input.blockerOnFail ? "fail" : scan.status,
    evidence: [
      passEvidence(
        `ev-${input.checkId}`,
        `Deployment scan ${scan.status} score=${scan.score} findings=${scan.infrastructureFindings.length + scan.deploymentFindings.length}`,
      ),
    ],
    blockers: ok ? [] : [failBlocker(input, `Deployment scan failed: ${scan.status}`)],
    risks: ok ? [] : [{
      riskId: `risk-${input.checkId}`,
      checkId: input.checkId,
      domain: input.domainId,
      severity: input.severityDefault,
      summary: `Deployment ${scan.status}`,
      mitigation: "Resolve infrastructure and deployment readiness violations",
    }],
    recommendations: ok ? [] : ["Run deployment_scan Brain tool"],
  };
}

async function probeDeploymentHealth(
  input: CertificationProbeInput,
): Promise<CertificationProbeOutput> {
  const { runDeploymentHealthCheck } = await import(
    "../infrastructure-deployment/services/infrastructure-deployment-certification-service.js"
  );
  const health = runDeploymentHealthCheck({
    context: { workspaceId: input.workspaceId },
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    pillowGovernance: true,
  });
  const ok = health.status === "pass" || health.status === "pass_with_conditions" || health.status === "warning";
  return {
    status: ok ? health.status : "fail",
    evidence: [passEvidence(`ev-${input.checkId}`, `Deployment health ${health.status} score=${health.score}`)],
    blockers: ok ? [] : [failBlocker(input, `Deployment health check failed: ${health.status}`)],
    risks: [],
    recommendations: [],
  };
}

async function probeOperationalScan(
  input: CertificationProbeInput,
): Promise<CertificationProbeOutput> {
  const { runOperationalScan } = await import(
    "../operational-readiness/services/operational-readiness-certification-service.js"
  );
  const { mapOperationalStatusToCertification } = await import(
    "../operational-readiness/contracts/operational-readiness-types.js"
  );
  const scan = runOperationalScan({
    context: { workspaceId: input.workspaceId },
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    pillowGovernance: true,
  });
  const status = mapOperationalStatusToCertification(scan.status);
  const ok = status === "pass" || status === "pass_with_conditions";
  return {
    status: ok ? status : input.blockerOnFail ? "fail" : status,
    evidence: [
      passEvidence(
        `ev-${input.checkId}`,
        `Operational scan ${scan.status} score=${scan.score} blockers=${scan.blockers.length}`,
      ),
    ],
    blockers: ok ? [] : [failBlocker(input, `Operational scan failed: ${scan.status}`)],
    risks: ok
      ? []
      : [{
          riskId: `risk-${input.checkId}`,
          checkId: input.checkId,
          domain: input.domainId,
          severity: input.severityDefault,
          summary: `Operational readiness ${scan.status}`,
          mitigation: "Resolve operational blockers and warnings",
        }],
    recommendations: ok ? [] : ["Run operational_scan Brain tool"],
  };
}

async function probeOperationalReadiness(
  input: CertificationProbeInput,
): Promise<CertificationProbeOutput> {
  const { runOperationalScan } = await import(
    "../operational-readiness/services/operational-readiness-certification-service.js"
  );
  const { mapOperationalStatusToCertification } = await import(
    "../operational-readiness/contracts/operational-readiness-types.js"
  );
  const scan = runOperationalScan({
    context: { workspaceId: input.workspaceId },
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    pillowGovernance: true,
  });
  const status = mapOperationalStatusToCertification(scan.status);
  const ok = status === "pass" || status === "pass_with_conditions" || status === "warning";
  return {
    status: ok ? status : "fail",
    evidence: [passEvidence(`ev-${input.checkId}`, `Operational readiness ${scan.status} score=${scan.score}`)],
    blockers: ok ? [] : [failBlocker(input, `Operational readiness check failed: ${scan.status}`)],
    risks: [],
    recommendations: ok ? [] : ["Run operational_status Brain tool"],
  };
}

async function probeBusinessOperationsScan(
  input: CertificationProbeInput,
): Promise<CertificationProbeOutput> {
  const { runBusinessOperationsScan } = await import(
    "../business-operations/services/business-operations-certification-service.js"
  );
  const { mapBusinessStatusToCertification } = await import(
    "../business-operations/contracts/business-operations-types.js"
  );
  const scan = runBusinessOperationsScan({
    context: { workspaceId: input.workspaceId },
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    pillowGovernance: true,
  });
  const status = mapBusinessStatusToCertification(scan.status);
  const ok = status === "pass" || status === "pass_with_conditions";
  return {
    status: ok ? status : input.blockerOnFail ? "fail" : status,
    evidence: [
      passEvidence(
        `ev-${input.checkId}`,
        `Business scan ${scan.status} executiveScore=${scan.executiveScore} failures=${scan.failures.length}`,
      ),
    ],
    blockers: ok ? [] : [failBlocker(input, `Business operations scan failed: ${scan.status}`)],
    risks: ok
      ? []
      : [{
          riskId: `risk-${input.checkId}`,
          checkId: input.checkId,
          domain: input.domainId,
          severity: input.severityDefault,
          summary: `Business operations ${scan.status}`,
          mitigation: "Resolve business operation failures and warnings",
        }],
    recommendations: ok ? [] : ["Run business_operations_scan Brain tool"],
  };
}

async function probeBusinessOperations(
  input: CertificationProbeInput,
): Promise<CertificationProbeOutput> {
  const { runBusinessOperationsScan } = await import(
    "../business-operations/services/business-operations-certification-service.js"
  );
  const { mapBusinessStatusToCertification } = await import(
    "../business-operations/contracts/business-operations-types.js"
  );
  const scan = runBusinessOperationsScan({
    context: { workspaceId: input.workspaceId },
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    pillowGovernance: true,
  });
  const status = mapBusinessStatusToCertification(scan.status);
  const ok = status === "pass" || status === "pass_with_conditions" || status === "warning";
  return {
    status: ok ? status : "fail",
    evidence: [passEvidence(`ev-${input.checkId}`, `Business operations ${scan.status} executiveScore=${scan.executiveScore}`)],
    blockers: ok ? [] : [failBlocker(input, `Business operations check failed: ${scan.status}`)],
    risks: [],
    recommendations: ok ? [] : ["Run business_operations_status Brain tool"],
  };
}

async function probePerformanceScan(
  input: CertificationProbeInput,
): Promise<CertificationProbeOutput> {
  const { runPerformanceScan } = await import(
    "../performance-scalability-resilience/services/performance-certification-service.js"
  );
  const scan = runPerformanceScan({
    context: { workspaceId: input.workspaceId },
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    pillowGovernance: true,
  });
  const ok = scan.status === "pass" || scan.status === "pass_with_conditions";
  return {
    status: ok ? scan.status : input.blockerOnFail ? "fail" : scan.status,
    evidence: [
      passEvidence(
        `ev-${input.checkId}`,
        `Performance scan ${scan.status} score=${scan.performanceScore} bottlenecks=${scan.bottlenecks.length}`,
      ),
    ],
    blockers: ok ? [] : [failBlocker(input, `Performance scan failed: ${scan.status}`)],
    risks: ok
      ? []
      : [{
          riskId: `risk-${input.checkId}`,
          checkId: input.checkId,
          domain: input.domainId,
          severity: input.severityDefault,
          summary: `Performance ${scan.status}`,
          mitigation: "Resolve performance bottlenecks and warnings",
        }],
    recommendations: ok ? [] : ["Run performance_scan Brain tool"],
  };
}

async function probePerformanceStatus(
  input: CertificationProbeInput,
): Promise<CertificationProbeOutput> {
  const { runPerformanceScan } = await import(
    "../performance-scalability-resilience/services/performance-certification-service.js"
  );
  const scan = runPerformanceScan({
    context: { workspaceId: input.workspaceId },
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    pillowGovernance: true,
  });
  const ok = scan.status === "pass" || scan.status === "pass_with_conditions" || scan.status === "warning";
  return {
    status: ok ? scan.status : "fail",
    evidence: [passEvidence(`ev-${input.checkId}`, `Performance status ${scan.status} score=${scan.performanceScore}`)],
    blockers: ok ? [] : [failBlocker(input, `Performance check failed: ${scan.status}`)],
    risks: [],
    recommendations: ok ? [] : ["Run performance_status Brain tool"],
  };
}

async function probeExecutiveOperationsScan(
  input: CertificationProbeInput,
): Promise<CertificationProbeOutput> {
  const { runExecutiveOperationsScan } = await import(
    "../executive-operations/services/executive-operations-certification-service.js"
  );
  const scan = runExecutiveOperationsScan({
    context: { workspaceId: input.workspaceId },
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    pillowGovernance: true,
  });
  const ok = scan.status === "pass" || scan.status === "pass_with_conditions";
  return {
    status: ok ? scan.status : input.blockerOnFail ? "fail" : scan.status,
    evidence: [
      passEvidence(
        `ev-${input.checkId}`,
        `Executive operations scan ${scan.status} score=${scan.executiveScore} blockers=${scan.blockers.length}`,
      ),
    ],
    blockers: ok ? [] : [failBlocker(input, `Executive operations scan failed: ${scan.status}`)],
    risks: ok
      ? []
      : [{
          riskId: `risk-${input.checkId}`,
          checkId: input.checkId,
          domain: input.domainId,
          severity: input.severityDefault,
          summary: `Executive operations ${scan.status}`,
          mitigation: "Resolve executive blockers and warnings",
        }],
    recommendations: ok ? [] : ["Run executive_operations_scan Brain tool"],
  };
}

async function probeExecutiveOperationsStatus(
  input: CertificationProbeInput,
): Promise<CertificationProbeOutput> {
  const { runExecutiveOperationsScan } = await import(
    "../executive-operations/services/executive-operations-certification-service.js"
  );
  const scan = runExecutiveOperationsScan({
    context: { workspaceId: input.workspaceId },
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    pillowGovernance: true,
  });
  const ok = scan.status === "pass" || scan.status === "pass_with_conditions" || scan.status === "warning";
  return {
    status: ok ? scan.status : "fail",
    evidence: [passEvidence(`ev-${input.checkId}`, `Executive operations status ${scan.status} score=${scan.executiveScore}`)],
    blockers: ok ? [] : [failBlocker(input, `Executive operations check failed: ${scan.status}`)],
    risks: [],
    recommendations: ok ? [] : ["Run executive_operations_status Brain tool"],
  };
}

async function probeFailureRecoveryScan(
  input: CertificationProbeInput,
): Promise<CertificationProbeOutput> {
  const { runFailureRecoveryScan } = await import(
    "../failure-recovery-incident/services/failure-recovery-certification-service.js"
  );
  const scan = runFailureRecoveryScan({
    context: { workspaceId: input.workspaceId },
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    pillowGovernance: true,
  });
  const ok = scan.status === "pass" || scan.status === "pass_with_conditions";
  return {
    status: ok ? scan.status : input.blockerOnFail ? "fail" : scan.status,
    evidence: [
      passEvidence(
        `ev-${input.checkId}`,
        `Failure recovery scan ${scan.status} score=${scan.incidentScore} blockers=${scan.blockers.length}`,
      ),
    ],
    blockers: ok ? [] : [failBlocker(input, `Failure recovery scan failed: ${scan.status}`)],
    risks: ok
      ? []
      : [{
          riskId: `risk-${input.checkId}`,
          checkId: input.checkId,
          domain: input.domainId,
          severity: input.severityDefault,
          summary: `Failure recovery ${scan.status}`,
          mitigation: "Resolve failure recovery blockers and warnings",
        }],
    recommendations: ok ? [] : ["Run failure_recovery_scan Brain tool"],
  };
}

async function probeFailureRecoveryStatus(
  input: CertificationProbeInput,
): Promise<CertificationProbeOutput> {
  const { runFailureRecoveryScan } = await import(
    "../failure-recovery-incident/services/failure-recovery-certification-service.js"
  );
  const scan = runFailureRecoveryScan({
    context: { workspaceId: input.workspaceId },
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    pillowGovernance: true,
  });
  const ok = scan.status === "pass" || scan.status === "pass_with_conditions" || scan.status === "warning";
  return {
    status: ok ? scan.status : "fail",
    evidence: [passEvidence(`ev-${input.checkId}`, `Failure recovery status ${scan.status} score=${scan.incidentScore}`)],
    blockers: ok ? [] : [failBlocker(input, `Failure recovery check failed: ${scan.status}`)],
    risks: [],
    recommendations: ok ? [] : ["Run failure_recovery_status Brain tool"],
  };
}

async function probeProductionSimulationScan(
  input: CertificationProbeInput,
): Promise<CertificationProbeOutput> {
  const { runFullProductionSimulation } = await import(
    "../production-simulation/services/production-simulation-certification-service.js"
  );
  const run = runFullProductionSimulation({
    context: { workspaceId: input.workspaceId },
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    pillowGovernance: true,
  });
  const ok = run.status === "pass" || run.status === "pass_with_conditions";
  return {
    status: ok ? run.status : input.blockerOnFail ? "fail" : run.status,
    evidence: [
      passEvidence(
        `ev-${input.checkId}`,
        `Production simulation ${run.status} score=${run.simulationScore} scenarios=${run.simulations.length} blockers=${run.blockers.length}`,
      ),
    ],
    blockers: ok ? [] : [failBlocker(input, `Production simulation failed: ${run.status}`)],
    risks: ok
      ? []
      : [{
          riskId: `risk-${input.checkId}`,
          checkId: input.checkId,
          domain: input.domainId,
          severity: input.severityDefault,
          summary: `Production simulation ${run.status}`,
          mitigation: "Resolve simulation blockers before live operation",
        }],
    recommendations: ok ? [] : ["Run run_full_production_simulation Brain tool"],
  };
}

async function probeProductionSimulationStatus(
  input: CertificationProbeInput,
): Promise<CertificationProbeOutput> {
  const { runFullProductionSimulation } = await import(
    "../production-simulation/services/production-simulation-certification-service.js"
  );
  const run = runFullProductionSimulation({
    context: { workspaceId: input.workspaceId },
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    pillowGovernance: true,
  });
  const ok = run.status === "pass" || run.status === "pass_with_conditions" || run.status === "warning";
  return {
    status: ok ? run.status : "fail",
    evidence: [passEvidence(`ev-${input.checkId}`, `Production simulation status ${run.status} score=${run.simulationScore}`)],
    blockers: ok ? [] : [failBlocker(input, `Production simulation check failed: ${run.status}`)],
    risks: [],
    recommendations: ok ? [] : ["Run simulation_status Brain tool"],
  };
}

async function probeFinalCertificationScan(
  input: CertificationProbeInput,
): Promise<CertificationProbeOutput> {
  const { runFinalProductionReadinessCertification } = await import(
    "../final-production-readiness/services/final-production-readiness-service.js"
  );
  const run = await runFinalProductionReadinessCertification({
    context: { workspaceId: input.workspaceId },
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    pillowGovernance: true,
  });
  const ok =
    run.record.certificationStatus === "PRODUCTION_READY" ||
    run.record.certificationStatus === "PRODUCTION_READY_WITH_CONDITIONS";
  return {
    status: ok ? "pass" : run.record.certificationStatus === "BLOCKED" ? "blocked" : "fail",
    evidence: [passEvidence(`ev-${input.checkId}`, `Final certification ${run.record.certificationStatus} score=${run.readinessScore}`)],
    blockers: ok ? [] : [failBlocker(input, `Final certification check failed: ${run.record.certificationStatus}`)],
    risks: [],
    recommendations: ok ? [] : ["Run run_final_certification Brain tool"],
  };
}

async function probeFinalCertificationStatus(
  input: CertificationProbeInput,
): Promise<CertificationProbeOutput> {
  const { getLastFinalProductionReadinessRun } = await import(
    "../final-production-readiness/services/final-production-readiness-service.js"
  );
  const run = getLastFinalProductionReadinessRun();
  if (!run) {
    return {
      status: "warning",
      evidence: [passEvidence(`ev-${input.checkId}`, "No final certification run recorded")],
      blockers: [],
      risks: [],
      recommendations: ["Run run_final_certification Brain tool"],
    };
  }
  const ok =
    run.record.certificationStatus === "PRODUCTION_READY" ||
    run.record.certificationStatus === "PRODUCTION_READY_WITH_CONDITIONS";
  return {
    status: ok ? "pass" : "warning",
    evidence: [passEvidence(`ev-${input.checkId}`, `Final certification status ${run.record.certificationStatus}`)],
    blockers: [],
    risks: [],
    recommendations: ok ? [] : ["Review production blockers and conditions"],
  };
}

export async function executeCertificationProbe(
  probeRef: CertificationProbeRef,
  input: CertificationProbeInput,
): Promise<CertificationProbeOutput> {
  switch (probeRef) {
    case "probe:programme_module_contract":
      return probeProgrammeModuleContract(input);
    case "probe:registry_resolution":
      return probeRegistryResolution(input);
    case "probe:pillow_governance":
      return probePillowGovernance(input);
    case "probe:ekls_governance":
      return probeEklsGovernance(input);
    case "probe:executive_audit_artifact":
      return probeExecutiveAuditArtifact(input);
    case "probe:brain_tools_registered":
      return probeBrainToolsRegistered(input);
    case "probe:identity_module":
      return probeIdentityModule(input);
    case "probe:platform_integrity":
      return probePlatformIntegrity(input);
    case "probe:platform_integrity_scan":
      return probePlatformIntegrityScan(input);
    case "probe:security_redaction":
      return probeSecurityRedaction(input);
    case "probe:security_governance_scan":
      return probeSecurityGovernanceScan(input);
    case "probe:governance_scan":
      return probeGovernanceScan(input);
    case "probe:deployment_scan":
      return probeDeploymentScan(input);
    case "probe:deployment_health":
      return probeDeploymentHealth(input);
    case "probe:operational_scan":
      return probeOperationalScan(input);
    case "probe:operational_readiness":
      return probeOperationalReadiness(input);
    case "probe:business_operations_scan":
      return probeBusinessOperationsScan(input);
    case "probe:business_operations":
      return probeBusinessOperations(input);
    case "probe:performance_scan":
      return probePerformanceScan(input);
    case "probe:performance_status":
      return probePerformanceStatus(input);
    case "probe:executive_operations_scan":
      return probeExecutiveOperationsScan(input);
    case "probe:executive_operations_status":
      return probeExecutiveOperationsStatus(input);
    case "probe:failure_recovery_scan":
      return probeFailureRecoveryScan(input);
    case "probe:failure_recovery_status":
      return probeFailureRecoveryStatus(input);
    case "probe:production_simulation_scan":
      return probeProductionSimulationScan(input);
    case "probe:production_simulation_status":
      return probeProductionSimulationStatus(input);
    case "probe:production_eligibility":
      return probeProductionEligibility(input);
    case "probe:final_certification_scan":
      return probeFinalCertificationScan(input);
    case "probe:final_certification_status":
      return probeFinalCertificationStatus(input);
    default: {
      const exhaustive: never = probeRef;
      return {
        status: "unknown",
        evidence: [passEvidence(`ev-${input.checkId}`, `Unknown probe: ${exhaustive}`)],
        blockers: [],
        risks: [],
        recommendations: ["Register probe handler"],
      };
    }
  }
}
