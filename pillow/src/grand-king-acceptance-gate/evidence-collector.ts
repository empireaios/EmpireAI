import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ExecutiveAcceptancePackReport } from "../executive-acceptance-pack/types.js";
import type { GrandKingAcceptanceGateDependencies } from "./integrations.js";
import type { ExecutiveAcceptancePackCollection } from "./types.js";

function resolvePackReport(deps: GrandKingAcceptanceGateDependencies): ExecutiveAcceptancePackReport | null {
  const eaprt = deps.executiveAcceptancePack;
  if (!eaprt) return null;

  if (typeof eaprt.getLatestReport === "function") {
    const latest = eaprt.getLatestReport();
    if (latest) return latest;
  }

  if (typeof eaprt.getState === "function") {
    const state = eaprt.getState() as { latestReport?: ExecutiveAcceptancePackReport | null };
    if (state?.latestReport) return state.latestReport;
  }

  if (typeof eaprt.getReports === "function") {
    const reports = eaprt.getReports();
    if (reports?.length) return reports[reports.length - 1] ?? null;
  }

  return null;
}

export function collectExecutiveAcceptancePack(
  deps: GrandKingAcceptanceGateDependencies,
): ExecutiveAcceptancePackCollection {
  const now = new Date().toISOString();
  const eaprt = deps.executiveAcceptancePack;

  if (!eaprt) {
    return {
      collectedAt: now,
      packReportId: null,
      packDecision: null,
      packReport: null,
      executiveAcceptance: null,
      evidence: ["executive_acceptance_pack not injected — cannot collect Executive Acceptance Pack"],
    };
  }

  const packReport = resolvePackReport(deps);
  if (!packReport) {
    return {
      collectedAt: now,
      packReportId: null,
      packDecision: null,
      packReport: null,
      executiveAcceptance: null,
      evidence: ["Executive Acceptance Pack injected but no report available via getLatestReport/getState/getReports"],
    };
  }

  return {
    collectedAt: now,
    packReportId: packReport.reportId,
    packDecision: packReport.decision,
    packReport,
    executiveAcceptance: packReport.acceptancePack,
    evidence: [
      `packReportId=${packReport.reportId}`,
      `packDecision=${packReport.decision}`,
      `deploymentRecommendation=${packReport.deploymentRecommendation.recommendation}`,
      ...packReport.supportingEvidence.slice(0, 5),
    ],
  };
}

export function evaluateGovernanceSummary(repositoryRoot: string, docPath: string) {
  const evidence: string[] = [];
  let selfDocPresent = false;
  try {
    const fullPath = join(repositoryRoot, docPath);
    if (existsSync(fullPath)) {
      const content = readFileSync(fullPath, "utf8");
      selfDocPresent = content.includes("Grand King Acceptance Gate");
      evidence.push(
        selfDocPresent ? "governance doc present" : "governance doc missing Grand King Acceptance Gate heading",
      );
    } else {
      evidence.push("governance doc not found on disk");
    }
  } catch {
    evidence.push("governance doc check failed");
  }
  return {
    compliant: selfDocPresent,
    grandKingApprovalRequired: true as const,
    executiveAcceptancePackRequired: true as const,
    selfDocPresent,
    selfDocPath: docPath,
    boundaryLocksHonoured: true,
    evidence,
  };
}
