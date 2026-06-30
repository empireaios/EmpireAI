import {
  DASHBOARD_SOURCES,
  FRONTEND_PAGE_REGISTRY,
} from "../../../orchestration/empire-self-inspection/services/repo-scanner.js";
import { PROGRAM_CATALOG } from "../../../orchestration/master-completion-ledger/models/program-catalog.js";
import type { UxReviewPreparation } from "../models/ux-review-preparation.js";

type ReviewItem = UxReviewPreparation["items"][number];

function refinementSupportForPage(page: (typeof FRONTEND_PAGE_REGISTRY)[number]): boolean {
  return page.futureHooks.length > 0
    || page.navSection === "workspaces"
    || page.route.includes(":");
}

function scoreForPage(page: (typeof FRONTEND_PAGE_REGISTRY)[number], refinementSupport: boolean): number {
  let score = 75;
  if (page.boundApis.length === 0 && page.navSection !== "public") score -= 15;
  if (refinementSupport) score -= 5;
  if (page.navSection === "command") score += 10;
  return Math.max(30, Math.min(95, score));
}

/** REAL-092 — Grand King UX review prep: all frontend routes/panels with refinement flags. */
export function buildUxReviewPreparation(
  workspaceId: string,
  companyId: string,
): UxReviewPreparation {
  const items: ReviewItem[] = [];

  for (const page of FRONTEND_PAGE_REGISTRY) {
    const refinementSupport = refinementSupportForPage(page);
    const score = scoreForPage(page, refinementSupport);
    items.push({
      itemId: `page-${page.route.replace(/[/:]/g, "-") || "root"}`,
      label: `${page.title} (${page.route})`,
      score,
      status: score >= 80 ? "READY" : score >= 60 ? "PENDING" : "BLOCKED",
      recommendation: refinementSupport
        ? "Schedule Grand King UX refinement session — futureHooks or dynamic params present"
        : "Stable screen — verify bound APIs return live data before go-live",
      evidence: `navSection=${page.navSection} · boundApis=${page.boundApis.length} · refinementSupport=${refinementSupport} · panels=${page.purpose}`,
      why: "Grand King UX review requires per-screen inventory before Version 1 freeze",
    });
  }

  for (const dash of DASHBOARD_SOURCES) {
    const linkedPage = FRONTEND_PAGE_REGISTRY.find((p) =>
      p.boundApis.some((api) => dash.route.startsWith(api.replace("/*", ""))),
    );
    const refinementSupport = !linkedPage || linkedPage.futureHooks.length > 0;
    items.push({
      itemId: `backend-dash-${dash.sourceModule}`,
      label: `Backend panel: ${dash.dashboard}`,
      score: linkedPage ? 78 : 52,
      status: linkedPage ? "PENDING" : "BLOCKED",
      recommendation: linkedPage
        ? "Confirm backend dashboard data matches frontend panel layout"
        : "Add frontend route or embed as Mission Home widget — orphan backend dashboard",
      evidence: `route=${dash.route} · sourceModule=${dash.sourceModule} · refinementSupport=${refinementSupport}`,
      why: "Backend-only dashboards without frontend panels block Founder UX validation",
    });
  }

  const uxProgram = PROGRAM_CATALOG.find((p) => p.programId === "frontend-ux");
  if (uxProgram) {
    items.push({
      itemId: "program-frontend-ux",
      label: "PROGRAM_CATALOG frontend-ux program",
      score: uxProgram.baseCompletionPercent,
      status: uxProgram.baseCompletionPercent >= 80 ? "READY" : "PENDING",
      recommendation: uxProgram.nextCursorMission,
      evidence: `${uxProgram.dashboardSurface} · ${uxProgram.baseCompletionPercent}% complete`,
      why: uxProgram.realWorldDependencies.join("; ") || "OAuth flows required for operational access UX",
    });
  }

  const refinementCount = items.filter((i) => i.evidence.includes("refinementSupport=true")).length;
  const avgScore = Math.round(items.reduce((s, i) => s + i.score, 0) / items.length);

  return {
    moduleId: "ux-review-preparation",
    missionId: "REAL-092",
    workspaceId,
    companyId,
    summary: `REAL-092 — ${FRONTEND_PAGE_REGISTRY.length} frontend routes + ${DASHBOARD_SOURCES.length} backend panels · ${refinementCount} screens need refinement support`,
    items,
    reusedModules: ["empire-self-inspection", "master-completion-ledger"],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
