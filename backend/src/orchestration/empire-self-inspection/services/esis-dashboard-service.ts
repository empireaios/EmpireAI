import type { EsisDashboard, EsisHealthState } from "../models/esis-inspection.js";
import { getCachedProductionTimestamp } from "./production-inspector.js";
import { REVIEW_PACKAGE_PATH } from "./repo-scanner.js";
import { runEsisInspection } from "./esis-engine.js";
import fs from "node:fs";

function scoreFromState(state: EsisHealthState): number {
  switch (state) {
    case "HEALTHY":
      return 95;
    case "WARNING":
      return 65;
    case "FAILED":
      return 25;
    default:
      return 50;
  }
}

function deriveHealth(state: EsisHealthState, summary: string): { state: EsisHealthState; score: number; summary: string } {
  return { state, score: scoreFromState(state), summary };
}

export function buildEsisDashboard(
  workspaceId: string,
  companyId: string,
): EsisDashboard {
  const report = runEsisInspection({
    workspaceId,
    companyId,
    runValidation: false,
    writePackage: false,
  });

  const warningModules = report.backend.modules.filter((m) => m.health === "WARNING").length;
  const blockedStages = report.commerce.stages.filter((s) => s.status === "BLOCKED").length;
  const blockedConnectors = report.connectors.entries.filter((c) => c.blocked).length;
  const pagesWithGaps = report.frontend.pages.filter((p) => p.missingImplementation.length > 0).length;

  const backendState: EsisHealthState =
    warningModules > 5 ? "WARNING" : warningModules > 0 ? "WARNING" : "HEALTHY";
  const frontendState: EsisHealthState = pagesWithGaps > 3 ? "WARNING" : "HEALTHY";
  const commerceState: EsisHealthState =
    blockedStages >= 3 ? "WARNING" : blockedStages > 0 ? "WARNING" : "HEALTHY";
  const validationState: EsisHealthState =
    report.production.tests.status === "PASS"
      ? "HEALTHY"
      : report.production.tests.status === "FAIL"
        ? "FAILED"
        : "UNKNOWN";
  const productionState: EsisHealthState =
    report.production.productionBlockers.length > 0
      ? "FAILED"
      : report.production.typecheck.status === "PASS"
        ? "HEALTHY"
        : "UNKNOWN";

  const architectureState: EsisHealthState =
    report.backend.modules.length > 0 && report.backend.tableCount > 50 ? "HEALTHY" : "WARNING";

  const systemState: EsisHealthState =
    [backendState, frontendState, commerceState, validationState].includes("FAILED")
      ? "FAILED"
      : [backendState, frontendState, commerceState, validationState].includes("WARNING")
        ? "WARNING"
        : "HEALTHY";

  const cachedAt = getCachedProductionTimestamp();
  const packageExists = fs.existsSync(REVIEW_PACKAGE_PATH);

  return {
    workspaceId,
    companyId,
    reviewTimestamp: cachedAt ?? (packageExists ? report.generatedAt : null),
    systemHealth: deriveHealth(
      systemState,
      `${report.backend.modules.length} modules; ${report.backend.routeCount} routes; ${report.risks.length} risks`,
    ),
    architectureHealth: deriveHealth(
      architectureState,
      `${report.backend.modules.length} modules; ${report.backend.tableCount} tables; ${report.backend.toolCount} brain tools`,
    ),
    commerceHealth: deriveHealth(
      commerceState,
      `${blockedStages} blocked stages; ${blockedConnectors} blocked connectors`,
    ),
    frontendHealth: deriveHealth(
      frontendState,
      `${report.frontend.routeCount} routes; ${pagesWithGaps} pages with gaps; ${report.frontend.unroutedPages.length} unrouted stubs`,
    ),
    backendHealth: deriveHealth(
      backendState,
      `${warningModules} modules with warnings; ${report.backend.routeCount} REST routes`,
    ),
    validationHealth: deriveHealth(
      validationState,
      report.production.tests.detail ?? `${report.production.tests.total ?? 0} test suites registered`,
    ),
    productionReadiness: deriveHealth(
      productionState,
      report.production.productionBlockers[0] ?? "Run npm run empire:review for full validation",
    ),
    lastReportPath: packageExists ? "EMPIRE_REVIEW_PACKAGE.md" : undefined,
    summary: report.executiveSummary,
  };
}
