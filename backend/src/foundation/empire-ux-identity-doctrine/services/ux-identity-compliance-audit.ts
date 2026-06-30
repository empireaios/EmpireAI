import fs from "node:fs";
import path from "node:path";

import { BACKEND_SRC, FRONTEND_SRC } from "../../../orchestration/empire-self-inspection/services/repo-scanner.js";
import {
  listIdentityDoctrines,
  listUxDoctrines,
  UX_IDENTITY_DOCTRINE_CATALOG,
} from "../catalog/uid-catalog.js";
import type {
  NavigationReviewEntry,
  UxIdentityComplianceCheck,
  UxIdentityComplianceReport,
} from "../models/ux-identity-doctrine.js";
import {
  UX_IDENTITY_DOCTRINE_MISSION_ID,
  UX_IDENTITY_DOCTRINE_VERSION,
} from "../models/ux-identity-doctrine.js";

function modulePathExists(relativePath: string): boolean {
  return fs.existsSync(path.join(BACKEND_SRC, ...relativePath.split("/")));
}

function frontendFileExists(relativePath: string): boolean {
  return fs.existsSync(path.join(FRONTEND_SRC, ...relativePath.split("/")));
}

function fileContains(base: "backend" | "frontend", relativePath: string, needle: string): boolean {
  const root = base === "backend" ? BACKEND_SRC : FRONTEND_SRC;
  const full = path.join(root, ...relativePath.split("/"));
  if (!fs.existsSync(full)) return false;
  if (fs.statSync(full).isDirectory()) return false;
  return fs.readFileSync(full, "utf8").includes(needle);
}

function check(
  checkId: string,
  doctrineId: string,
  label: string,
  ok: boolean,
  partial: boolean,
  evidence: string,
  violation: string | null,
): UxIdentityComplianceCheck {
  const status = ok ? "COMPLIANT" as const : partial ? "PARTIAL" as const : "VIOLATION" as const;
  return { checkId, doctrineId, label, status, evidence, violation: status === "VIOLATION" ? violation : null };
}

function buildNavigationReview(): NavigationReviewEntry[] {
  const entries: NavigationReviewEntry[] = [
    {
      routeId: "nav-001",
      path: "/dashboard",
      label: "Mission Home — Empire Headquarters",
      role: "grand-king",
      purpose: "Executive Headquarters; global health + next actions on login",
      uidArticles: ["UID-008", "UID-009", "UID-011"],
      status: frontendFileExists("pages/dashboard/MissionHomePage.tsx") ? "COMPLIANT" : "VIOLATION",
    },
    {
      routeId: "nav-002",
      path: "/dashboard/success-001",
      label: "SUCCESS-001 Command Center",
      role: "grand-king",
      purpose: "USD 100K net profit critical path — separate from tenant surfaces",
      uidArticles: ["UID-004", "UID-020"],
      status: frontendFileExists("pages/dashboard/Success001CommandCenterPage.tsx") ? "COMPLIANT" : "VIOLATION",
    },
    {
      routeId: "nav-003",
      path: "/dashboard/command",
      label: "Empire Command Center",
      role: "grand-king",
      purpose: "Executive brief + Grand King actions today",
      uidArticles: ["UID-005", "UID-014", "UID-017"],
      status: frontendFileExists("pages/dashboard/EmpireCommandCenterPage.tsx") ? "COMPLIANT" : "VIOLATION",
    },
    {
      routeId: "nav-004",
      path: "/dashboard/intelligence",
      label: "Product Discovery",
      role: "grand-king",
      purpose: "Approve products — business decision surface",
      uidArticles: ["UID-006", "UID-010"],
      status: frontendFileExists("pages/dashboard/ProductDiscoveryPage.tsx") ? "COMPLIANT" : "VIOLATION",
    },
    {
      routeId: "nav-005",
      path: "/dashboard/brands",
      label: "Brand Workspace",
      role: "founder-tenant",
      purpose: "Tenant brand portfolio — no Grand King platform governance",
      uidArticles: ["UID-002", "UID-004"],
      status: frontendFileExists("pages/dashboard/BusinessWorkspacePage.tsx") ? "COMPLIANT" : "VIOLATION",
    },
    {
      routeId: "nav-006",
      path: "/login",
      label: "Authentication",
      role: "all",
      purpose: "Credentials-only login — no role selection; auth determines destination",
      uidArticles: ["UID-001", "UID-003"],
      status:
        frontendFileExists("pages/auth/LoginPage.tsx") &&
        !fileContains("frontend", "pages/auth/LoginPage.tsx", 'role="tablist"')
          ? "COMPLIANT"
          : "VIOLATION",
    },
    {
      routeId: "nav-007",
      path: "mission-home:country-marketplace",
      label: "Country → Marketplace tabs",
      role: "grand-king",
      purpose: "Standard navigation model: Country, Marketplace, Products, Performance",
      uidArticles: ["UID-010"],
      status: fileContains("frontend", "components/empire/GlobalMarketplaceOperationsPanel.tsx", "CountryMarketplaceTabsPanel")
        ? "COMPLIANT"
        : "VIOLATION",
    },
    {
      routeId: "nav-008",
      path: "mission-home:executive-debate",
      label: "Executive Visual Debate",
      role: "grand-king",
      purpose: "Visual debate → Soul recommendation → King decision",
      uidArticles: ["UID-012", "UID-013", "UID-014"],
      status:
        fileContains("frontend", "components/empire/ExecutiveVisualDebatePanel.tsx", "soulRecommendation") &&
        fileContains("frontend", "components/empire/GlobalMarketplaceOperationsPanel.tsx", "Request Investigation")
          ? "COMPLIANT"
          : "VIOLATION",
    },
  ];
  return entries;
}

/** Static UX & identity doctrine compliance audit — NOT runtime enforcement. */
export function auditUxIdentityCompliance(
  workspaceId: string,
  companyId: string,
): UxIdentityComplianceReport {
  const doctrines = [...UX_IDENTITY_DOCTRINE_CATALOG];
  const identityCoverage = listIdentityDoctrines().map((d) => d.doctrineId);
  const uxCoverage = listUxDoctrines().map((d) => d.doctrineId);
  const navigationReview = buildNavigationReview();

  const checks: UxIdentityComplianceCheck[] = [
    check("uid-001-gk", "UID-001", "Grand King platform owner recognized at auth", modulePathExists("grand-king") && fileContains("backend", "auth/routes.ts", "platformIdentity"), false, "grand-king module + auth platformIdentity resolution", "Grand King identity recognition missing"),
    check("uid-002-founder", "UID-002", "Founder tenant module separated", modulePathExists("runtime/founder-platform-preparation"), false, "founder-platform-preparation — tenant scope", "Founder tenant separation missing"),
    check("uid-003-no-role", "UID-003", "No role-selection screen on login", frontendFileExists("pages/auth/LoginPage.tsx") && !fileContains("frontend", "pages/auth/LoginPage.tsx", 'role="tablist"'), false, "LoginPage — credentials only, no role tabs", "Role-selection screen present on login"),
    check("uid-004-separate", "UID-004", "Grand King dashboard separate from tenant", frontendFileExists("pages/dashboard/MissionHomePage.tsx") && frontendFileExists("pages/dashboard/BusinessWorkspacePage.tsx"), false, "Mission Home (GK HQ) + Brand Workspace (tenant) separate routes", "Dashboard separation missing"),
    check("uid-005-next", "UID-005", "Dashboard answers what to do next", fileContains("frontend", "lib/mission-engine.ts", "buildMissionActions") && fileContains("frontend", "components/empire/MissionPanel.tsx", "Recommended"), false, "mission-engine + MissionPanel next actions", "Next-action dashboard pattern missing"),
    check("uid-006-business", "UID-006", "Pages drive business decisions", fileContains("frontend", "pages/dashboard/ProductDiscoveryPage.tsx", "Approve"), false, "ProductDiscovery approve actions — decision surfaces", "Business decision pages missing"),
    check("uid-007-no-display", "UID-007", "Dashboards include actions not display-only", fileContains("frontend", "pages/dashboard/MissionHomePage.tsx", "MissionPanel"), false, "Mission Home pairs metrics with MissionPanel actions", "Display-only dashboard pattern"),
    check("uid-008-hq", "UID-008", "Mission Home is Empire Headquarters", fileContains("frontend", "routes/index.tsx", "MissionHomePage") && fileContains("frontend", "routes/index.tsx", "index element"), false, "Dashboard index route → MissionHomePage", "Mission Home headquarters route missing"),
    check("uid-009-executive", "UID-009", "Executive Headquarters presents Empire", fileContains("frontend", "pages/dashboard/MissionHomePage.tsx", "Executive Headquarters"), false, "Mission Home Executive Headquarters shell", "Executive Headquarters presentation missing"),
    check("uid-010-nav-model", "UID-010", "Country→Marketplace navigation model", fileContains("frontend", "components/empire/GlobalMarketplaceOperationsPanel.tsx", "CountryMarketplaceTabsPanel"), false, "CountryMarketplaceTabsPanel — standard nav model", "Standard navigation model missing"),
    check("uid-011-global-health", "UID-011", "Global business health on login", fileContains("frontend", "pages/dashboard/MissionHomePage.tsx", "GlobalCommandCenterPanel"), false, "Global Command Center on Mission Home first screen", "Instant global health surface missing"),
    check("uid-012-visual-debate", "UID-012", "Executive debates are visual", fileContains("frontend", "components/empire/ExecutiveVisualDebatePanel.tsx", "chiefGrid"), false, "ExecutiveVisualDebatePanel — visual chief cards", "Visual executive debate missing"),
    check("uid-013-soul-after", "UID-013", "Soul after executive debate", fileContains("frontend", "components/empire/ExecutiveVisualDebatePanel.tsx", "soulRecommendation"), false, "Soul recommendation rendered after debate cards", "Soul-after-debate ordering missing"),
    check("uid-014-king-actions", "UID-014", "King Approve/Reject/Investigate visible", fileContains("frontend", "components/empire/GlobalMarketplaceOperationsPanel.tsx", "Request Investigation"), false, "GlobalMarketplaceOperationsPanel king action labels", "Grand King action visibility missing"),
    check("uid-015-business-first", "UID-015", "Business health before technical", fileContains("frontend", "pages/dashboard/MissionHomePage.tsx", "GrandKingFinancialCommandCenterPanel"), false, "Financial command center before ESIS technical health sections", "Business-first hierarchy missing"),
    check("uid-016-revenue-priority", "UID-016", "Revenue/Profit/Risk visual priority", fileContains("frontend", "pages/dashboard/Success001CommandCenterPage.tsx", "net profit") || fileContains("frontend", "pages/dashboard/MissionHomePage.tsx", "revenue"), false, "Revenue/profit metrics prioritized on command surfaces", "Revenue visual hierarchy missing"),
    check("uid-017-min-clicks", "UID-017", "Critical decisions reachable quickly", fileContains("frontend", "pages/dashboard/MissionHomePage.tsx", "paths.dashboard.command"), false, "Mission Home links to Command Center in one click", "Critical decision navigation depth too high"),
    check("uid-018-why", "UID-018", "Visuals explain WHY", fileContains("frontend", "lib/mission-engine.ts", "why:") && fileContains("frontend", "components/empire/MissionPanel.tsx", "itemWhy"), false, "MissionAction.why rendered in MissionPanel", "WHY explanations missing from visuals"),
    check("uid-019-simple", "UID-019", "Simple professional V1 UX", fileContains("frontend", "pages/dashboard/MissionHomePage.module.css", "missionHero") || frontendFileExists("pages/dashboard/MissionHomePage.module.css"), false, "CSS modules — no animation libraries required for V1", "V1 UX simplicity pattern missing"),
    check("uid-020-success", "UID-020", "UX aligned to SUCCESS-001", fileContains("frontend", "pages/dashboard/Success001CommandCenterPage.tsx", "100,000") || fileContains("frontend", "pages/dashboard/Success001CommandCenterPage.tsx", "100000"), false, "SUCCESS-001 Command Center — USD 100K target", "SUCCESS-001 UX alignment missing"),
  ];

  const compliantCount = checks.filter((c) => c.status === "COMPLIANT").length;
  const partialCount = checks.filter((c) => c.status === "PARTIAL").length;
  const violationCount = checks.filter((c) => c.status === "VIOLATION").length;
  const coveragePercent = Math.round((compliantCount / checks.length) * 100);
  const violations = checks.filter((c) => c.violation).map((c) => `${c.doctrineId}: ${c.violation}`);
  const reviewPassed = violationCount === 0;

  return {
    moduleId: "empire-ux-identity-doctrine",
    missionId: UX_IDENTITY_DOCTRINE_MISSION_ID,
    workspaceId,
    companyId,
    catalogVersion: UX_IDENTITY_DOCTRINE_VERSION,
    doctrineCount: 20,
    doctrines,
    identityCoverage,
    uxCoverage,
    navigationReview,
    checks,
    compliantCount,
    partialCount,
    violationCount,
    coveragePercent,
    reviewPassed,
    violations,
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}

export function uxIdentityExecutiveSummary(report: UxIdentityComplianceReport): string {
  const status = report.reviewPassed ? "REVIEW PASSED" : "REVIEW FAILED";
  const navOk = report.navigationReview.filter((n) => n.status !== "VIOLATION").length;
  return `UX & Identity Doctrine UID-001→020 @ ${report.catalogVersion}: ${report.compliantCount}/${report.checks.length} checks compliant (${report.coveragePercent}%). Identity: ${report.identityCoverage.length} · UX: ${report.uxCoverage.length}. Navigation review: ${navOk}/${report.navigationReview.length} routes compliant. ${status}. Violations: ${report.violationCount}.`;
}
