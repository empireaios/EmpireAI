import path from "node:path";

import type { EsisFrontendPage } from "../models/esis-inspection.js";
import {
  FRONTEND_PAGE_REGISTRY,
  FRONTEND_SRC,
  countPatternMatches,
  listFilesRecursive,
  readText,
  sortAlpha,
} from "./repo-scanner.js";

function analyzePageFile(componentName: string): EsisFrontendPage["uiElements"] & { apis: string[]; actions: string[] } {
  const pagesDir = path.join(FRONTEND_SRC, "pages");
  const files = listFilesRecursive(pagesDir, ".tsx");
  const match = files.find((f) => path.basename(f, ".tsx") === componentName);
  if (!match) {
    return {
      buttons: 0,
      cards: 0,
      metrics: 0,
      tables: 0,
      forms: 0,
      dialogs: 0,
      widgets: 0,
      hasLoadingState: false,
      hasEmptyState: false,
      hasErrorState: false,
      apis: [],
      actions: [],
    };
  }

  const content = readText(match);
  const apiImports = [...content.matchAll(/from\s+["']@\/api\/([^"']+)["']/g)].map((m) => `@/api/${m[1]}`);
  const apiCalls = [...content.matchAll(/(?:fetch|apiRequest|brainDispatch)\w*\([^)]*["'`](\/[^"'`]+)["'`]/g)].map((m) => m[1]);
  const actions = [...content.matchAll(/(?:handle|on)[A-Z]\w+/g)].map((m) => m[0]);

  return {
    buttons: countPatternMatches(content, [/className="empireBtn/g, /<button/g, /<Link/g]),
    cards: countPatternMatches(content, [/empireCard/g, /MetricCard/g]),
    metrics: countPatternMatches(content, [/empireMetric/g, /MetricCard/g]),
    tables: countPatternMatches(content, [/<table/g, /Table/g]),
    forms: countPatternMatches(content, [/<form/g, /Form/g]),
    dialogs: countPatternMatches(content, [/Dialog/g, /Modal/g]),
    widgets: countPatternMatches(content, [/Panel/g, /Grid/g, /Widget/g]),
    hasLoadingState: /LoadingState/.test(content),
    hasEmptyState: /empty|EmptyState|no data/i.test(content),
    hasErrorState: /ErrorState/.test(content),
    apis: [...new Set([...apiImports, ...apiCalls.filter(Boolean)])].sort() as string[],
    actions: [...new Set(actions)].sort().slice(0, 12),
  };
}

function detectMissingImplementation(componentName: string): string[] {
  const missing: string[] = [];
  const stubPages = ["AiTeamPage", "ProfitPage", "BillingPage", "SuppliersPage", "AdsPage", "IntelligencePage"];
  if (stubPages.includes(componentName)) {
    missing.push("Page exists but not routed in AppRoutes");
  }
  if (componentName === "ProductDiscoveryPage") {
    missing.push("Discovery uses SCOUT_MOCK_PRODUCTS on backend");
  }
  if (componentName === "InfrastructurePage") {
    missing.push("OAuth start URLs lack route handlers for some providers");
  }
  return missing;
}

export function inspectFrontend(): {
  summary: string;
  pages: EsisFrontendPage[];
  unroutedPages: string[];
  routeCount: number;
} {
  const pagesDir = path.join(FRONTEND_SRC, "pages", "dashboard");
  const allDashboardPages = listFilesRecursive(pagesDir, ".tsx")
    .map((f) => path.basename(f, ".tsx"))
    .sort();
  const routedComponents = new Set(FRONTEND_PAGE_REGISTRY.map((p) => p.component));
  const unroutedPages = allDashboardPages.filter((p) => !routedComponents.has(p)).sort();

  const pages: EsisFrontendPage[] = FRONTEND_PAGE_REGISTRY.map((entry) => {
    const analysis = analyzePageFile(entry.component);
    const boundApis = [...new Set([...entry.boundApis, ...analysis.apis])].sort();
    return {
      route: entry.route,
      pageComponent: entry.component,
      title: entry.title,
      purpose: entry.purpose,
      navigationSection: entry.navSection,
      primaryActions: analysis.actions.slice(0, 8),
      uiElements: {
        buttons: analysis.buttons,
        cards: analysis.cards,
        metrics: analysis.metrics,
        tables: analysis.tables,
        forms: analysis.forms,
        dialogs: analysis.dialogs,
        widgets: analysis.widgets,
        hasLoadingState: analysis.hasLoadingState,
        hasEmptyState: analysis.hasEmptyState,
        hasErrorState: analysis.hasErrorState,
      },
      boundApis,
      layoutHierarchy: entry.navSection === "public"
        ? ["App", entry.component]
        : ["App", "DashboardLayout", "EmpirePageShell", entry.component],
      commercialObjective: entry.commercialObjective,
      missingImplementation: detectMissingImplementation(entry.component),
      futureHooks: entry.futureHooks,
    };
  });

  const sortedPages = sortAlpha(pages, (p) => p.route);
  const pagesWithGaps = sortedPages.filter((p) => p.missingImplementation.length > 0).length;

  return {
    summary: `${sortedPages.length} routed pages inspected; ${unroutedPages.length} unrouted dashboard stubs; ${pagesWithGaps} pages with known gaps`,
    pages: sortedPages,
    unroutedPages,
    routeCount: sortedPages.length,
  };
}
