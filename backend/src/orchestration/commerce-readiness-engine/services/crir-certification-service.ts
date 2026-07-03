import type { LaunchWorkflowRecord } from "../../ecommerce-os-orchestrator/models/ecommerce-os-workflow.js";
import { createReadinessBlocker, type ReadinessBlocker } from "../models/commerce-readiness.js";
import {
  type CrirReport,
  type RegisterCrirReportInput,
  crirReportSchema,
  isCrirLaunchCertificationSufficient,
} from "../models/crir-report.js";
import { getCrirReportRepository } from "../repositories/sqlite-crir-report-repository.js";

export function registerCrirReport(input: RegisterCrirReportInput): CrirReport {
  const now = new Date().toISOString();
  const report = crirReportSchema.parse({
    ...input,
    updatedAt: input.updatedAt ?? now,
  });
  return getCrirReportRepository().upsert(report);
}

export function getCrirReportsForCompany(workspaceId: string, companyId: string): CrirReport[] {
  return getCrirReportRepository().listForCompany(workspaceId, companyId);
}

export function getCrirReportById(reportId: string): CrirReport | null {
  return getCrirReportRepository().getById(reportId);
}

/**
 * EI6-09 Launch Risk Certification gate — blocks launch when CRIR is missing,
 * under-certified, or survivability FAIL.
 */
export function evaluateCrirReadiness(
  workspaceId: string,
  companyId: string,
  workflow: LaunchWorkflowRecord | null,
  blockers: ReadinessBlocker[],
): number {
  const hasApprovedProducts = Boolean(
    workflow && workflow.approvedProductIds.length > 0,
  );
  const primaryProductId = workflow?.approvedProductIds[0];

  const report = getCrirReportRepository().findBestForLaunchScope(
    workspaceId,
    companyId,
    primaryProductId,
  );

  if (!report) {
    blockers.push(
      createReadinessBlocker({
        id: "crir:missing",
        severity: hasApprovedProducts ? "BLOCKING" : "WARNING",
        category: "crir",
        title: "Commercial Risk Intelligence Report (CRIR) required",
        description:
          "Product launch requires a certified CRIR per EI6-09 and Commerce Canon READINESS gate.",
        recommendedAction:
          "Prepare CRIR with all 10 mandatory sections and advance certification to GOVERNANCE_CERTIFIED minimum.",
        metadata: {
          eiReference: "EI6-09",
          spec: "COMMERCIAL_RISK_INTELLIGENCE_REPORT_SPECIFICATION.md",
        },
      }),
    );
    return hasApprovedProducts ? 0 : 35;
  }

  if (report.survivabilityAssessment === "FAIL") {
    blockers.push(
      createReadinessBlocker({
        id: "crir:survivability-fail",
        severity: "BLOCKING",
        category: "crir",
        title: "CRIR survivability assessment FAIL",
        description: `CRIR ${report.reportId} has survivability FAIL — launch prohibited under CRI-003.`,
        recommendedAction: "Revise opportunity or obtain new CRIR with survivability PASS or CONDITIONAL with King acceptance.",
        metadata: { reportId: report.reportId },
      }),
    );
    return 0;
  }

  if (
    report.survivabilityAssessment === "CONDITIONAL"
    && report.certificationStatus !== "GRAND_KING_APPROVED"
  ) {
    blockers.push(
      createReadinessBlocker({
        id: "crir:conditional-king-required",
        severity: "BLOCKING",
        category: "crir",
        title: "Conditional survivability requires Grand King approval",
        description: `CRIR ${report.reportId} is CONDITIONAL — Grand King written acceptance required.`,
        recommendedAction: "Advance CRIR to GRAND_KING_APPROVED with documented conditions.",
        metadata: { reportId: report.reportId },
      }),
    );
    return 15;
  }

  if (!isCrirLaunchCertificationSufficient(report.certificationStatus)) {
    blockers.push(
      createReadinessBlocker({
        id: "crir:under-certified",
        severity: "BLOCKING",
        category: "crir",
        title: "CRIR not commercially certified",
        description: `CRIR ${report.reportId} is ${report.certificationStatus} — minimum GOVERNANCE_CERTIFIED required.`,
        recommendedAction: "Complete Intelligence, Finance, and Governance review workflow on CRIR.",
        metadata: {
          reportId: report.reportId,
          certificationStatus: report.certificationStatus,
        },
      }),
    );
    return 20;
  }

  if (!report.sectionsComplete) {
    blockers.push(
      createReadinessBlocker({
        id: "crir:sections-incomplete",
        severity: "WARNING",
        category: "crir",
        title: "CRIR sections marked incomplete",
        description: `CRIR ${report.reportId} is certified but sectionsComplete flag is false.`,
        recommendedAction: "Verify all 10 CRIR sections are complete or marked UNKNOWN_WITH_BLOCKER with mitigation.",
        metadata: { reportId: report.reportId },
      }),
    );
    return 85;
  }

  return 100;
}
