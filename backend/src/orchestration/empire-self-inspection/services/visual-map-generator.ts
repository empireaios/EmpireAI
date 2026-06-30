import type { EsisInspectionReport, EsisVisualMaps } from "../models/esis-inspection.js";
import {
  COMMERCE_LIFECYCLE_STAGES,
  DASHBOARD_SOURCES,
  FRONTEND_PAGE_REGISTRY,
  sortAlpha,
} from "./repo-scanner.js";
import { listAllRestRoutes } from "./backend-inspector.js";

export function generateVisualMaps(report: Pick<EsisInspectionReport, "frontend" | "backend" | "commerce" | "connectors">): EsisVisualMaps {
  const navigationTree = {
    command: FRONTEND_PAGE_REGISTRY.filter((p) => p.navSection === "command").map((p) => ({
      label: p.title,
      path: p.route,
    })),
    workspaces: FRONTEND_PAGE_REGISTRY.filter((p) => p.navSection === "workspaces").map((p) => ({
      label: p.title,
      path: p.route,
    })),
    system: FRONTEND_PAGE_REGISTRY.filter((p) => p.navSection === "system").map((p) => ({
      label: p.title,
      path: p.route,
    })),
    public: FRONTEND_PAGE_REGISTRY.filter((p) => p.navSection === "public").map((p) => ({
      label: p.title,
      path: p.route,
    })),
  };

  const frontendPageGraph = sortAlpha(
    report.frontend.pages.map((p) => ({
      route: p.route,
      component: p.pageComponent,
      apis: p.boundApis,
    })),
    (p) => p.route,
  );

  const backendModuleGraph = sortAlpha(
    report.backend.modules.map((m) => ({
      module: m.moduleId,
      category: m.category,
      routes: m.routes,
    })),
    (m) => m.module,
  );

  const commerceLifecycleGraph = sortAlpha(
    report.commerce.stages.map((s) => ({
      stage: s.stage,
      module: s.module,
      status: s.status,
    })),
    (s) => s.stage,
  );

  const connectorGraph = sortAlpha(
    report.connectors.entries.map((c) => ({
      providerId: c.providerId,
      health: c.health,
      blocked: c.blocked,
    })),
    (c) => c.providerId,
  );

  const allRoutes = listAllRestRoutes();
  const apiDependencyGraph = sortAlpha(
    allRoutes.slice(0, 200).map((route) => {
      const module = report.backend.modules.find((m) => m.routes.some((r) => route.startsWith(r.replace(/:\w+/g, ""))))?.moduleId ?? "core";
      return { route, module };
    }),
    (a) => a.route,
  );

  const dashboardGraph = sortAlpha(
    DASHBOARD_SOURCES.map((d) => ({
      dashboard: d.dashboard,
      sourceModule: d.sourceModule,
    })),
    (d) => d.dashboard,
  );

  return {
    navigationTree,
    frontendPageGraph,
    backendModuleGraph,
    commerceLifecycleGraph,
    connectorGraph,
    apiDependencyGraph,
    dashboardGraph,
  };
}

export function serializeVisualMapsMarkdown(maps: EsisVisualMaps): string {
  const lines: string[] = ["## Visual Maps", ""];
  lines.push("### Navigation Tree", "```json", JSON.stringify(maps.navigationTree, null, 2), "```", "");
  lines.push("### Commerce Lifecycle Graph", "| Stage | Module | Status |");
  lines.push("|-------|--------|--------|");
  for (const node of maps.commerceLifecycleGraph) {
    lines.push(`| ${node.stage} | ${node.module} | ${node.status} |`);
  }
  lines.push("");
  lines.push("### Connector Graph", "| Provider | Health | Blocked |");
  lines.push("|----------|--------|---------|");
  for (const node of maps.connectorGraph) {
    lines.push(`| ${node.providerId} | ${node.health} | ${node.blocked} |`);
  }
  return lines.join("\n");
}
